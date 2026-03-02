import type { JourneyItemContent, JourneyItemNode } from "../types/journey.types";
import type { LayoutConfig, LayoutEdge } from "./layout.types";

const round = (value: number) => Math.round(value);

const scalePoint = (value: number, scale: number) => round(value * scale);

const scaleEdges = (edges: LayoutEdge[], scale: number) =>
  edges.map((edge) => ({
    ...edge,
    via: edge.via
      ? edge.via.map((point) => ({
          x: scalePoint(point.x, scale),
          y: scalePoint(point.y, scale),
        }))
      : undefined,
  }));

export const computeJourneyNodes = (
  content: JourneyItemContent[],
  layout: LayoutConfig,
  containerWidth: number | null
) => {
  const contentMap = Object.fromEntries(
    content.map((item) => [item.id, item])
  );

  const scale =
    layout.scaleWithContainer && containerWidth
      ? containerWidth / layout.canvasWidth
      : 1;

  const items: JourneyItemNode[] = layout.items
    .map((placement) => {
      const base = contentMap[placement.id];
      if (!base) return null;

      const override = layout.overrides?.[placement.id];

      return {
        ...base,
        ...override,
        x: scalePoint(placement.x, scale),
        y: scalePoint(placement.y, scale),
        width: scalePoint(placement.width, scale),
        height: scalePoint(placement.height, scale),
      };
    })
    .filter((item): item is JourneyItemNode => Boolean(item));

  const itemMap = Object.fromEntries(
    items.map((item) => [item.id, item])
  );

  const edges = scaleEdges(layout.edges, scale);

  const maxContentHeight = items.reduce(
    (max, item) => Math.max(max, item.y + item.height),
    0
  );

  const computedHeight =
    scalePoint(layout.height ?? maxContentHeight, scale) +
    scalePoint(layout.extraHeight ?? 120, scale);

  return {
    items,
    itemMap,
    edges,
    height: computedHeight,
  };
};
