import type { JourneyItemNode } from "./types/journey.types";
import type { LayoutEdge } from "./layout/layout.types";

interface Props {
  edge: LayoutEdge;
  items: Record<string, JourneyItemNode>;
}

export default function MemoryPath({ edge, items }: Props) {
  const from = items[edge.from];
  const to = items[edge.to];

  if (!from || !to) return null;

  const getAnchorPoint = (
    item: JourneyItemNode,
    anchor: "top" | "bottom" | "left" | "right"
  ) => {
    const { x, y, width } = item;
    const height = item.height ?? 0;

    switch (anchor) {
      case "top":
        return { x: x + width / 2, y };
      case "bottom":
        return { x: x + width / 2, y: y + height };
      case "left":
        return { x, y: y + height / 2 };
      case "right":
        return { x: x + width, y: y + height / 2 };
    }
  };

  const start = getAnchorPoint(from, edge.fromAnchor);
  const end = getAnchorPoint(to, edge.toAnchor);

  const points = [start, ...(edge.via ?? []), end];

  const buildPath = () => {
    if (points.length < 2) return "";

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const cx = (prev.x + curr.x) / 2;
      const cy = (prev.y + curr.y) / 2;

      d += ` Q ${prev.x} ${prev.y} ${cx} ${cy}`;
    }

    const last = points[points.length - 1];
    d += ` T ${last.x} ${last.y}`;

    return d;
  };

  const pathD = buildPath();

  // unique ids so multiple paths don’t clash
  const gradientId = `memory-gradient-${edge.from}-${edge.to}`;
  const glowId = `memory-glow-${edge.from}-${edge.to}`;

  return (
    <>
      <defs>
        {/* Stroke gradient following the path direction */}
        <linearGradient
  id={gradientId}
  gradientUnits="userSpaceOnUse"
  x1={start.x}
  y1={start.y}
  x2={end.x}
  y2={end.y}
>
  <stop offset="0%" stopColor="rgba(0,0,0,0.9)" />
  <stop offset="25%" stopColor="rgba(255,255,255,0.6)" />
  <stop offset="50%" stopColor="rgba(0,0,0,0.9)" />
  <stop offset="75%" stopColor="rgba(255,255,255,0.6)" />
  <stop offset="100%" stopColor="rgba(0,0,0,0.9)" />
</linearGradient>


        {/* Glow that inherits the gradient color */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow layer */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.1}
        filter={`url(#${glowId})`}
      />

      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
