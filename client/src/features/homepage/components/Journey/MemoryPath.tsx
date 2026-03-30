import type { PointerEvent as ReactPointerEvent } from "react";
import type { JourneyItemNode } from "./types/journey.types";
import type { LayoutEdge } from "./layout/layout.types";

interface Props {
  edge: LayoutEdge;
  items: Record<string, JourneyItemNode>;
  parentCardSizes?: Record<string, { width: number; height: number }>;
  editorEnabled?: boolean;
  isSelected?: boolean;
  onSelectEdge?: (edgeKey: string, event: ReactPointerEvent<SVGPathElement>) => void;
}

const edgeKeyOf = (edge: LayoutEdge) => `${edge.from}->${edge.to}`;

export default function MemoryPath({
  edge,
  items,
  parentCardSizes,
  editorEnabled,
  isSelected,
  onSelectEdge,
}: Props) {
  const from = items[edge.from];
  const to = items[edge.to];

  if (!from || !to) return null;

  const getAnchorPoint = (
    item: JourneyItemNode,
    anchor: "top" | "bottom" | "left" | "right",
  ) => {
    const base = { x: item.x, y: item.y, width: item.width, height: item.height ?? 0 };

    // Parent nodes are rendered as full cards centered on a small anchor box.
    // For connector routing, use the measured parent-card size (when available)
    // so anchors attach to the card edges instead of the anchor center.
    const parentSize = item.type === "parent" ? parentCardSizes?.[item.id] : undefined;

    const centerX = base.x + base.width / 2;
    const centerY = base.y + base.height / 2;
    const width = parentSize?.width ?? base.width;
    const height = parentSize?.height ?? base.height;
    const x = centerX - width / 2;
    const y = centerY - height / 2;

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

  if (points.length < 2) return null;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    d += ` L ${curr.x} ${curr.y}`;
  }

  return (
    <>
      {editorEnabled ? (
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={14}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => onSelectEdge?.(edgeKeyOf(edge), event)}
        />
      ) : null}

      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={isSelected ? 2.2 : 1.5}
        strokeDasharray="6 8"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        opacity={isSelected ? 0.75 : 0.55}
      />
    </>
  );
}
