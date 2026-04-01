import type { LayoutConfig, LayoutEdge, LayoutItem } from "./layout.types";
import { layoutDesktopLg } from "./layout.desktop.lg";

const nodeOverrides: Record<string, Partial<LayoutItem>> = {
  "node1-c1": { x: 548, y: 78, width: 307, height: 255 },
  "node1-c2": { width: 307, height: 255 },
  "node1-c3": { x: 32, y: 385, width: 307, height: 254 },
  "node2": { x: 280, y: 953 },
  "node2-c1": { x: 583, y: 933, width: 307, height: 255 },
  "node2-c2": { x: 55, y: 1232, width: 307, height: 246 },
  "node3-c1": { x: 96, y: 1619, width: 307, height: 254 },
  "node3-c2": { x: 623, y: 1826, width: 307, height: 254 },
  "node4-c1": { x: 583, y: 2265, width: 307, height: 254 },
  "node4-c2": { width: 307, height: 255 },
  "node5-c1": { x: 596, y: 3056, width: 307, height: 254 },
  "node6": { x: 222, y: 3631 },
  "node6-p2": { x: 582, y: 3637 },
};

const edgeOverrides: Record<string, Pick<LayoutEdge, "via">> = {
  "node1->node1-c1": {
    via: [
      { x: 228, y: 350 },
      { x: 485, y: 350 },
      { x: 485, y: 205 },
    ],
  },
  "node1->node1-c2": {
    via: [
      { x: 228, y: 350 },
      { x: 423, y: 350 },
      { x: 423, y: 535 },
    ],
  },
  "node1->node1-c3": {
    via: [
      { x: 228, y: 352 },
      { x: 185, y: 352 },
    ],
  },
  "node1->node2": {
    via: [
      { x: 228, y: 350 },
      { x: 423, y: 350 },
      { x: 423, y: 759 },
      { x: 308, y: 759 },
    ],
  },
  "node2->node2-c1": {
    via: [
      { x: 308, y: 1194 },
      { x: 541, y: 1194 },
      { x: 541, y: 1060 },
    ],
  },
  "node2->node2-c2": {
    via: [
      { x: 308, y: 1194 },
      { x: 208, y: 1194 },
    ],
  },
  "node2->node3": {
    via: [
      { x: 308, y: 1194 },
      { x: 482, y: 1194 },
      { x: 482, y: 1321 },
      { x: 710, y: 1321 },
    ],
  },
  "node3->node3-c1": { via: [{ x: 710, y: 1746 }] },
  "node3->node3-c2": {
    via: [
      { x: 710, y: 1773 },
      { x: 776, y: 1773 },
    ],
  },
  "node3->node4": {
    via: [
      { x: 710, y: 1747 },
      { x: 533, y: 1747 },
      { x: 533, y: 1998 },
      { x: 313, y: 1998 },
    ],
  },
  "node4->node4-c1": { via: [{ x: 313, y: 2392 }] },
  "node4->node4-c2": {
    via: [
      { x: 313, y: 2408 },
      { x: 185, y: 2408 },
    ],
  },
  "node4->node4-c3": {
    via: [
      { x: 313, y: 2391 },
      { x: 438, y: 2391 },
      { x: 438, y: 2727 },
    ],
  },
  "node4->node5": {
    via: [
      { x: 313, y: 2391 },
      { x: 438, y: 2391 },
      { x: 438, y: 2900 },
      { x: 250, y: 2900 },
    ],
  },
  "node5->node5-c1": {
    via: [
      { x: 250, y: 3320 },
      { x: 511, y: 3320 },
      { x: 511, y: 3183 },
    ],
  },
  "node6->node6-p1": {
    via: [
      { x: 250, y: 3860 },
      { x: 202, y: 3860 },
    ],
  },
  "node6->node6-p2": {
    via: [
      { x: 250, y: 3863 },
      { x: 533, y: 3863 },
      { x: 533, y: 3759 },
    ],
  },
  "node6->node6-p3": {
    via: [
      { x: 250, y: 3863 },
      { x: 475, y: 3863 },
      { x: 475, y: 4130 },
    ],
  },
};

export const layoutTablet: LayoutConfig = {
  ...layoutDesktopLg,
  id: "tablet",
  minWidth: 768,
  maxWidth: 1023,
  items: layoutDesktopLg.items.map((item) => ({
    ...item,
    ...(nodeOverrides[item.id] ?? {}),
  })),
  edges: layoutDesktopLg.edges.map((edge) => {
    const key = `${edge.from}->${edge.to}`;
    const override = edgeOverrides[key];
    if (!override) return edge;
    return { ...edge, ...override };
  }),
};
