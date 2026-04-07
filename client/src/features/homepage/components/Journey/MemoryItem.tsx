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

    const isMobileLayout =
      props.layoutId === "mobile" ||
      props.layoutId === "mobile-xxsm" ||
      props.layoutId === "mobile-sm";

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
  }, [
    props.editorEnabled,
    props.id,
    props.layoutId,
    props.modalDetails,
    props.onMeasure,
    props.title,
    type,
    width,
  ]);

  useLayoutEffect(() => {
    if (type !== "parent") return;
    const text = props.modalDetails ?? "Milestone summary coming soon.";
    const isMobileLayout =
      props.layoutId === "mobile" ||
      props.layoutId === "mobile-xxsm" ||
      props.layoutId === "mobile-sm";

    if (isMobileLayout) {
      if (parentDetailsRef.current) {
        parentDetailsRef.current.style.maxHeight = "";
      }
      return;
    }
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

  if (type === "parent" && props.icon) {
    const Icon = props.icon;

    return (
      <div
        ref={parentWrapperRef}
        className={`absolute z-10 flex items-center justify-center memory-node ${
          props.editorEnabled
            ? "cursor-grab active:cursor-grabbing touch-none select-none"
            : "cursor-pointer"
        }`}
        role="button"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={handleItemKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label={`Open ${props.id} details`}
      >
        {props.editorEnabled &&
        props.layoutId !== "mobile" &&
        props.layoutId !== "mobile-xxsm" &&
        props.layoutId !== "mobile-sm" ? (
          <>
            <span
              className="journey-resize-handle journey-resize-handle--nw"
              onPointerDown={(e) => handleResizePointerDown("nw", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
            <span
              className="journey-resize-handle journey-resize-handle--ne"
              onPointerDown={(e) => handleResizePointerDown("ne", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
            <span
              className="journey-resize-handle journey-resize-handle--sw"
              onPointerDown={(e) => handleResizePointerDown("sw", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
            <span
              className="journey-resize-handle journey-resize-handle--se"
              onPointerDown={(e) => handleResizePointerDown("se", e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
          </>
        ) : null}

        <article
          ref={cardRef}
          className="journey-memory-parent-card journey-map-card journey-showcase__card journey-showcase__card--parent"
        >
          <div className="journey-map-card__parent-header">
            <div className="journey-map-card__icon-shell">
              <Icon className="journey-map-card__icon" strokeWidth={1.3} />
            </div>
            <h3 className="journey-map-card__title font-jura">{props.title ?? props.id}</h3>
          </div>
          <p
            ref={parentDetailsRef}
            className="journey-map-card__details journey-map-card__details--truncate font-jura text-sm leading-relaxed"
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
      className={`absolute z-10 journey-map-card journey-showcase__card journey-showcase__card--child ${
        props.editorEnabled
          ? "cursor-grab active:cursor-grabbing touch-none select-none"
          : "cursor-pointer"
      }`}
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
            className="journey-resize-handle journey-resize-handle--nw"
            onPointerDown={(e) => handleResizePointerDown("nw", e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="journey-resize-handle journey-resize-handle--ne"
            onPointerDown={(e) => handleResizePointerDown("ne", e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="journey-resize-handle journey-resize-handle--sw"
            onPointerDown={(e) => handleResizePointerDown("sw", e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="journey-resize-handle journey-resize-handle--se"
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
          className="overflow-hidden journey-map-card__media"
        >
          <img
            src={props.image}
            alt={title}
            className="journey-map-card__image"
            draggable={false}
          />
        </GlassCard>
      ) : null}

      <h4 className="journey-map-card__child-title font-jura">{title}</h4>
      <div className="ml-1 flex flex-col gap-0 font-jura text-xs base-text-color">
        <div className="mt-1 flex items-center leading-none">
          <span className="mb-1 select-none opacity-55">L</span>
          <span className="ml-1 truncate opacity-70">{details}</span>
        </div>
      </div>
    </article>
  );
}
