import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { JourneyItemNode as Item } from "./types/journey.types";
import { techIconMap } from "./ui/memoryLane.techIcons";
import { GlassCard } from "../../../../shared/components/GlassCard";
import BouncingImage from "./ui/BouncingImage";

type FlickerKind = "strong" | "medium" | "light";
type FlickerPlan = Record<number, { kind: FlickerKind; delay: number }>;
type MemoryItemProps = Item & {
  onSelect?: (item: Item) => void;
  renderAsStar?: boolean;
  isEditMode?: boolean;
  isDragging?: boolean;
  onStarPointerDown?: (event: ReactPointerEvent<HTMLDivElement>, item: Item) => void;
};

const FLICKER_CHANCE_PER_LETTER = 0.08;
const FLICKER_MAX_LETTERS = 7;
const GUARANTEED_FLICKER_MIN = 1;
const GUARANTEED_FLICKER_MAX = 5;

const pickRandomFlickerKind = (): FlickerKind => {
  const roll = Math.random();
  return roll < 0.35 ? "strong" : roll < 0.7 ? "medium" : "light";
};

const pickRandomFlickerDelay = () =>
  Number((0.02 + Math.random() * 0.5).toFixed(2));

const buildFlickerPlan = (title: string): FlickerPlan => {
  const plan: FlickerPlan = {};
  let used = 0;
  const letterIndexes = title
    .split("")
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => char !== " ")
    .map(({ index }) => index);

  if (letterIndexes.length === 0) return plan;

  const guaranteedCount = Math.min(
    letterIndexes.length,
    GUARANTEED_FLICKER_MIN +
      Math.floor(
        Math.random() * (GUARANTEED_FLICKER_MAX - GUARANTEED_FLICKER_MIN + 1),
      ),
  );

  const shuffled = [...letterIndexes].sort(() => Math.random() - 0.5);
  const guaranteedIndexes = shuffled.slice(0, guaranteedCount);

  guaranteedIndexes.forEach((index) => {
    plan[index] = {
      kind: pickRandomFlickerKind(),
      delay: pickRandomFlickerDelay(),
    };
  });

  used = guaranteedIndexes.length;

  for (let index = 0; index < title.length; index++) {
    const char = title[index];
    if (char === " " || plan[index] || used >= FLICKER_MAX_LETTERS) continue;
    if (Math.random() > FLICKER_CHANCE_PER_LETTER) continue;

    plan[index] = {
      kind: pickRandomFlickerKind(),
      delay: pickRandomFlickerDelay(),
    };
    used++;
  }

  return plan;
};

/* Image Variant */
function MemoryCardImage({
  type,
  image,
  height = 160,
}: {
  type: Item["type"];
  image?: string;
  height?: number;
}) {
  /* Placeholder */
  if (type === "placeholder") {
    return (
      <GlassCard
        corner="rounded-[4px]"
        shadow="shadow-[0_0_10px_rgba(255,255,255,0.15)]"
        className="w-full"
        style={{ height }}
      >
        <div className="w-full h-full flex items-center justify-center text-center px-4">
          <span className="text-[10px] tracking-[1.5px] text-white/50 uppercase font-montserrat">
            Coming Soon
          </span>
        </div>
      </GlassCard>
    );
  }

  /* Internship */
  if (type === "internship" && image) {
    return (
      <GlassCard
        corner="rounded-[3px]"
        shadow="shadow-[0_0_14px_rgba(255,255,255,0.2)]"
        className="w-full h-full"
      >
        <BouncingImage src={image} />
      </GlassCard>
    );
  }

  /* Default / Child */
  if (image) {
    return (
      <GlassCard
        corner="rounded-[3px]"
        shadow="shadow-[0_0_10px_rgba(255,255,255,0.15)]"
      >
        <img
          src={image}
          alt=""
          draggable={false}
          className="w-full object-cover"
        />
      </GlassCard>
    );
  }

  return null;
}

/* Shared Content */
function MemoryCardContent({
  title,
  details,
  techTags,
  highlightTags,
  hideTags = false,
  enableTitleFlicker = false,
  flickerPlan = {},
  isFlickerActive = false,
  flickerRunId = 0,
}: Item & {
  hideTags?: boolean;
  enableTitleFlicker?: boolean;
  flickerPlan?: FlickerPlan;
  isFlickerActive?: boolean;
  flickerRunId?: number;
}) {
  const hasTech = techTags && techTags.length > 0;
  const hasHighlights = highlightTags && highlightTags.length > 0;
  const showTags = !hideTags && (hasTech || hasHighlights);

  return (
    <div className="p-[2px]">
      {title && (
        <h3 className="mt-3 text-[16px] text-white/80 font-medium tracking-[.5px] font-montserrat leading-tight memory-card-title">
          {enableTitleFlicker
            ? title.split("").map((char, index) => {
                const flicker = isFlickerActive
                  ? flickerPlan[index]
                  : undefined;
                const flickerClass = flicker
                  ? `memory-title-char-flicker memory-title-char-flicker-${flicker.kind}`
                  : "";

                return (
                  <span
                    key={`${char}-${index}-${flickerRunId}`}
                    className={`memory-title-char ${flickerClass}`}
                    style={
                      flicker
                        ? ({
                            ["--memory-flicker-delay" as string]: `${flicker.delay}s`,
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                );
              })
            : title}
        </h3>
      )}

      {details && (
        <p className="mt-[5px] px-[1px] text-[11px] text-white/70 leading-snug font-montserrat">
          {details}
        </p>
      )}

      {showTags && (
        <div className="mt-2 inline-flex flex-wrap items-start gap-1">
          {techTags?.map((tech) => (
            <div
              key={tech}
              className="flex items-center rounded-[3px] bg-white/5 border border-white/10 text-gray-300 px-[9px] py-[4px] text-[9px] font-montserrat"
            >
              {techIconMap[tech] || null}
              <span>{tech}</span>
            </div>
          ))}

          {hasTech && hasHighlights && (
            <span className="px-0.5 mt-[2px] text-[12px] text-gray-400 select-none">
              •
            </span>
          )}

          {highlightTags?.map((tag) => (
            <div
              key={tag}
              className="flex items-center rounded-[3px] bg-white/5 border border-white/10 text-gray-300 px-[9px] py-[4px] text-[9px] font-medium font-montserrat"
            >
              <span>{tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Main Component */
export default function MemoryItem(props: MemoryItemProps) {
  const { x, y, width, height, type } = props;
  const shouldFlickerTitle =
    type === "child" || type === "internship" || type === "placeholder";
  const [flickerPlan, setFlickerPlan] = useState<FlickerPlan>({});
  const [isFlickerActive, setIsFlickerActive] = useState(false);
  const [flickerRunId, setFlickerRunId] = useState(0);

  const handleMouseEnter = () => {
    if (!shouldFlickerTitle || !props.title) return;

    setFlickerPlan(buildFlickerPlan(props.title));
    setFlickerRunId((prev) => prev + 1);
    setIsFlickerActive(true);
  };

  const handleMouseLeave = () => {
    if (!shouldFlickerTitle) return;
    setIsFlickerActive(false);
  };

  const handleItemClick = () => {
    props.onSelect?.(props);
  };

  const handleItemKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      props.onSelect?.(props);
    }
  };

  // STAR NODE (parent + optional child star mode)
  if (type === "parent" || props.renderAsStar) {
    const isParentStar = type === "parent";
    return (
      <div
        className={`absolute flex items-center justify-center memory-node ${isParentStar ? "memory-node--parent" : "memory-node--child"} ${
          props.isEditMode ? "memory-node--editable" : ""
        } ${props.isDragging ? "memory-node--dragging" : ""}`}
        style={{ left: x, top: y, width, height }}
        role="button"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={handleItemKeyDown}
        onPointerDown={(event) => props.onStarPointerDown?.(event, props)}
        aria-label={`Open ${props.id} details`}
      >
        <span className="memory-node__halo" aria-hidden="true" />
        <span className="memory-node__glow" aria-hidden="true" />
        <span className="memory-node__core" aria-hidden="true" />
        {isParentStar && props.title ? (
          <span className="memory-node__label">{props.title}</span>
        ) : null}
      </div>
    );
  }

  /* All Card Types */
  return (
    <div
      className={`absolute flex flex-col memory-card ${shouldFlickerTitle ? "memory-card-flicker" : ""}`}
      style={{ left: x, top: y, width, height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      aria-label={`Open ${props.title ?? props.id} details`}
    >
      <MemoryCardImage type={type} image={props.image} height={props.height} />

      <MemoryCardContent
        {...props}
        hideTags={type === "placeholder"}
        enableTitleFlicker={shouldFlickerTitle}
        flickerPlan={flickerPlan}
        isFlickerActive={isFlickerActive}
        flickerRunId={flickerRunId}
      />
    </div>
  );
}
