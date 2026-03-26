import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import type { JourneyItemNode as Item } from "./types/journey.types";
import { GlassCard } from "../../../../shared/components/GlassCard";

type MeasureSize = { width: number; height: number };

type MemoryItemProps = Item & {
  onSelect?: (item: Item) => void;
  onMeasure?: (id: string, size: MeasureSize) => void;
};

const applyAbsoluteRect = (element: HTMLElement | null, item: Item) => {
  if (!element) return;
  element.style.left = `${item.x}px`;
  element.style.top = `${item.y}px`;
  element.style.width = `${item.width}px`;
  element.style.height = `${item.height}px`;
};

export default function MemoryItem(props: MemoryItemProps) {
  const { x, y, width, height, type } = props;
  const parentWrapperRef = useRef<HTMLDivElement | null>(null);
  const childWrapperRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = type === "parent" ? parentWrapperRef.current : childWrapperRef.current;
    applyAbsoluteRect(el, props);
  }, [x, y, width, height, type]);

  useLayoutEffect(() => {
    if (type !== "parent") return;
    const el = cardRef.current;
    if (!el) return;

    const next = { width: el.offsetWidth, height: el.offsetHeight };
    if (!next.width || !next.height) return;

    props.onMeasure?.(props.id, next);
  }, [props.id, props.onMeasure, type]);

  const handleItemClick = () => {
    props.onSelect?.(props);
  };

  const handleItemKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      props.onSelect?.(props);
    }
  };

  if (type === "parent" && props.icon) {
    const Icon = props.icon;

    return (
      <div
        ref={parentWrapperRef}
        className="absolute z-10 flex items-center justify-center memory-node"
        role="button"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={handleItemKeyDown}
        aria-label={`Open ${props.id} details`}
      >
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
          <p className="journey-map-card__details font-jura text-sm leading-relaxed">
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
      className="absolute z-10 journey-map-card journey-showcase__card journey-showcase__card--child"
      role="button"
      tabIndex={0}
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      aria-label={`Open ${title} details`}
    >
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
          <span className="ml-1 opacity-70">{details}</span>
        </div>
      </div>
    </article>
  );
}
