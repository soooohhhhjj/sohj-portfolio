import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { JourneyItemNode as Item } from "./types/journey.types";
import { GlassCard } from "../../../../shared/components/GlassCard";
import { truncateToFit } from "./ui/truncateToFit";

type MeasureSize = { width: number; height: number };

type MemoryItemProps = Item & {
  onSelect?: (item: Item) => void;
  onMeasure?: (id: string, size: MeasureSize) => void;
  editorEnabled?: boolean;
  layoutId?: string;
  onEditMove?: (id: string, next: { x: number; y: number }) => void;
  onEditResize?: (id: string, next: { x: number; y: number; width: number; height: number }) => void;
};

const applyAbsoluteRect = (element: HTMLElement | null, item: Item) => {
  if (!element) return;
  element.style.left = `${item.x}px`;
  element.style.top = `${item.y}px`;
  element.style.width = `${item.width}px`;
  element.style.height = `${item.height}px`;
};

const getPaddingBottomPx = (element: HTMLElement) => {
  const value = window.getComputedStyle(element).paddingBottom;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const constrainToInnerBox = (textEl: HTMLElement | null, containerEl: HTMLElement | null) => {
  if (!textEl || !containerEl) return;

  const containerRect = containerEl.getBoundingClientRect();
  const textRect = textEl.getBoundingClientRect();
  const paddingBottom = getPaddingBottomPx(containerEl);

  // Available vertical space from the text's top edge down to the container's inner bottom.
  const available = containerRect.bottom - paddingBottom - textRect.top;
  textEl.style.maxHeight = `${Math.max(0, Math.floor(available))}px`;
};

export default function MemoryItem(props: MemoryItemProps) {
  const { x, y, width, height, type } = props;
  const parentWrapperRef = useRef<HTMLDivElement | null>(null);
  const childWrapperRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const parentDetailsRef = useRef<HTMLParagraphElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    pointerId: number;
    handle: "se" | "sw" | "ne" | "nw";
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  useLayoutEffect(() => {
    const el = type === "parent" ? parentWrapperRef.current : childWrapperRef.current;
    applyAbsoluteRect(el, props);
  }, [x, y, width, height, type]);

  useLayoutEffect(() => {
    if (type !== "parent") return;
    const el = cardRef.current;
    if (!el) return;

    const isMobileLayout = props.layoutId === "mobile" || props.layoutId === "mobile-sm";

    let measuredHeight = el.offsetHeight;
    if (isMobileLayout) {
      const prevHeight = el.style.height;
      el.style.height = "auto";
      measuredHeight = Math.ceil(el.scrollHeight || el.offsetHeight || 0);
      el.style.height = prevHeight;
    }

    const next = { width: el.offsetWidth, height: measuredHeight };
    if (!next.width || !next.height) return;

    props.onMeasure?.(props.id, next);
  }, [props.editorEnabled, props.id, props.layoutId, props.modalDetails, props.onMeasure, props.title, type]);

  useLayoutEffect(() => {
    if (type !== "parent") return;
    const text = props.modalDetails ?? "Milestone summary coming soon.";
    const isMobileLayout = props.layoutId === "mobile" || props.layoutId === "mobile-sm";

    if (!props.editorEnabled && isMobileLayout) return;
    constrainToInnerBox(parentDetailsRef.current, cardRef.current);
    truncateToFit(parentDetailsRef.current, text);
  }, [height, props.editorEnabled, props.layoutId, props.modalDetails, type, width]);

  const handleItemClick = () => {
    if (props.editorEnabled) return;
    props.onSelect?.(props);
  };

  const handleItemKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (props.editorEnabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      props.onSelect?.(props);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!props.editorEnabled) return;
    if (event.button !== 0) return;
    event.preventDefault();

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: x,
      startTop: y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const state = dragStateRef.current;
    if (!props.editorEnabled || !state) return;
    if (state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    props.onEditMove?.(props.id, {
      x: Math.round(state.startLeft + dx),
      y: Math.round(state.startTop + dy),
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const state = dragStateRef.current;
    if (!state) return;
    if (state.pointerId !== event.pointerId) return;

    if (props.editorEnabled) {
      const dx = Math.abs(event.clientX - state.startX);
      const dy = Math.abs(event.clientY - state.startY);
      if (dx <= 3 && dy <= 3) {
        props.onSelect?.(props);
      }
    }
    dragStateRef.current = null;
  };

  const handleResizePointerDown = (
    handle: "se" | "sw" | "ne" | "nw",
    event: ReactPointerEvent<HTMLSpanElement>,
  ) => {
    if (!props.editorEnabled) return;
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: x,
      startTop: y,
      startWidth: width,
      startHeight: height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const state = resizeStateRef.current;
    if (!props.editorEnabled || !state) return;
    if (state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    let nextX = state.startLeft;
    let nextY = state.startTop;
    let nextW = state.startWidth;
    let nextH = state.startHeight;

    if (state.handle.includes("e")) nextW = state.startWidth + dx;
    if (state.handle.includes("s")) nextH = state.startHeight + dy;
    if (state.handle.includes("w")) {
      nextW = state.startWidth - dx;
      nextX = state.startLeft + dx;
    }
    if (state.handle.includes("n")) {
      nextH = state.startHeight - dy;
      nextY = state.startTop + dy;
    }

    props.onEditResize?.(props.id, {
      x: Math.round(nextX),
      y: Math.round(nextY),
      width: Math.round(nextW),
      height: Math.round(nextH),
    });
  };

  const handleResizePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const state = resizeStateRef.current;
    if (!state) return;
    if (state.pointerId !== event.pointerId) return;
    resizeStateRef.current = null;
  };

  const resizeHandleBaseClassName = `absolute z-30
  size-[14px] rounded-full
  border border-emerald-400/75 bg-emerald-400/20
  shadow-[0_0_0_3px_rgba(0,0,0,0.22)]
  touch-none select-none`;

  if (type === "parent" && props.icon) {
    const Icon = props.icon;
    const isMobileLayout = props.layoutId === "mobile" || props.layoutId === "mobile-sm";
    const parentCardPositionClasses = isMobileLayout
      ? "static w-full max-w-none h-auto"
      : "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[var(--journey-parent-card-width)] max-w-[var(--journey-parent-card-width)] h-[var(--journey-parent-card-height)]";

    return (
      <div
        ref={parentWrapperRef}
        className={`absolute z-20
        flex items-center justify-center
        ${props.editorEnabled
          ? "cursor-grab active:cursor-grabbing touch-none select-none"
          : "cursor-pointer"}`}
        role="button"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={handleItemKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label={`Open ${props.id} details`}
      >
        {props.editorEnabled && !isMobileLayout ? (
          <>
            <span
              className={`${resizeHandleBaseClassName}
              -left-[7px] -top-[7px]
              cursor-nwse-resize`}
              onPointerDown={(e) => handleResizePointerDown("nw", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
            <span
              className={`${resizeHandleBaseClassName}
              -right-[7px] -top-[7px]
              cursor-nesw-resize`}
              onPointerDown={(e) => handleResizePointerDown("ne", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
            <span
              className={`${resizeHandleBaseClassName}
              -left-[7px] -bottom-[7px]
              cursor-nesw-resize`}
              onPointerDown={(e) => handleResizePointerDown("sw", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
            <span
              className={`${resizeHandleBaseClassName}
              -right-[7px] -bottom-[7px]
              cursor-nwse-resize`}
              onPointerDown={(e) => handleResizePointerDown("se", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
          </>
        ) : null}

        <article
          ref={cardRef}
          className={`${parentCardPositionClasses} 
          relative overflow-visible border-none
          rounded-[0.35rem]
          p-[1.1rem]
          journey-map-card journey-showcase__card journey-showcase__card--parent`}
        >
          <div className="flex items-center gap-[0.85rem]">
            <div className="journey-map-card__icon-shell relative inline-flex
            items-center justify-center
            w-12 h-[2.55rem] shrink-0
            rounded-[0.2rem]
            bg-white/[0.02]">
              <Icon className="size-[1.4rem] text-[var(--base-text-color)]" strokeWidth={1.3} />
            </div>
            <h3 className="font-jura 
            text-[0.94rem] font-[500] tracking-[.1px] 
            truncate">
              {props.title ?? props.id}
            </h3>
          </div>
          <p
            ref={parentDetailsRef}
            className="font-jura 
            mt-[0.72rem] pt-[0.8rem] 
            border-t border-dashed border-[rgba(247,247,217,0.28)] 
            text-[0.82rem] leading-[1.55] tracking-[.1px] 
            text-[var(--base-text-color)] opacity-[0.72] 
            overflow-hidden"
          >
            {props.modalDetails ?? "Milestone summary coming soon."}
          </p>
        </article>
      </div>
    );
  }

  const title = props.title ?? props.id;
  const details = props.details ?? "Details coming soon.";

  return (
    <article
      ref={childWrapperRef}
      className={`absolute z-10
      w-full max-w-none h-full
      flex flex-col
      relative overflow-visible border-none
      rounded-[0.35rem]
      p-4
      journey-map-card journey-showcase__card journey-showcase__card--child
      ${props.editorEnabled
        ? "cursor-grab active:cursor-grabbing touch-none select-none"
        : "cursor-pointer"}`}
      role="button"
      tabIndex={0}
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label={`Open ${title} details`}
    >
      {props.editorEnabled ? (
        <>
          <span
            className={`${resizeHandleBaseClassName}
            -left-[7px] -top-[7px]
            cursor-nwse-resize`}
            onPointerDown={(e) => handleResizePointerDown("nw", e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className={`${resizeHandleBaseClassName}
            -right-[7px] -top-[7px]
            cursor-nesw-resize`}
            onPointerDown={(e) => handleResizePointerDown("ne", e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className={`${resizeHandleBaseClassName}
            -left-[7px] -bottom-[7px]
            cursor-nesw-resize`}
            onPointerDown={(e) => handleResizePointerDown("sw", e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className={`${resizeHandleBaseClassName}
            -right-[7px] -bottom-[7px]
            cursor-nwse-resize`}
            onPointerDown={(e) => handleResizePointerDown("se", e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
        </>
      ) : null}

      {props.image ? (
        <GlassCard
          width="w-full"
          corner="rounded-[2px]"
          shadow=""
          className="overflow-hidden 
          flex-1 min-h-0 h-auto 
          mb-[0.55rem]"
        >
          <img
            src={props.image}
            alt={title}
            className="block w-full h-full object-cover object-top"
            draggable={false}
          />
        </GlassCard>
      ) : null}

      <h4 className="font-jura 
      ml-[2px] 
      text-[0.95rem] font-[600] tracking-[.1px] 
      truncate">
        {title}
      </h4>
      <div className="ml-1 flex flex-col gap-0 font-jura text-xs base-text-color">
        <div className="mt-1 flex items-center leading-none">
          <span className="mb-1 select-none opacity-55">L</span>
          <span className="ml-1 truncate opacity-70">{details}</span>
        </div>
      </div>
    </article>
  );
}
