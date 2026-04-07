import type { LayoutEdge, LayoutItem } from "./layout.types";

export const buildLinearEdges = (items: LayoutItem[]): LayoutEdge[] => {
  if (items.length < 2) return [];

  return items.slice(0, -1).map((item, index) => ({
    from: item.id,
    to: items[index + 1].id,
    fromAnchor: "bottom",
    toAnchor: "top",
  }));
};

export const baseEdges: LayoutEdge[] = [
  { from: "node1", to: "node1-c1", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node1", to: "node1-c2", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node1", to: "node1-c3", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node1", to: "node2", fromAnchor: "bottom", toAnchor: "top" },

  { from: "node2", to: "node2-c1", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node2", to: "node2-c2", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node2", to: "node3", fromAnchor: "bottom", toAnchor: "top" },

  { from: "node3", to: "node3-c1", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node3", to: "node3-c2", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node3", to: "node4", fromAnchor: "bottom", toAnchor: "top" },

  { from: "node4", to: "node4-c1", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node4", to: "node4-c2", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node4", to: "node4-c3", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node4", to: "node5", fromAnchor: "bottom", toAnchor: "top" },

  { from: "node5", to: "node5-c1", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node5", to: "node5-c2", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node5", to: "node6", fromAnchor: "bottom", toAnchor: "top" },

  { from: "node6", to: "node6-p1", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node6", to: "node6-p2", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node6", to: "node6-p3", fromAnchor: "bottom", toAnchor: "right" },
  { from: "node6", to: "node6-p4", fromAnchor: "bottom", toAnchor: "left" },
  { from: "node6", to: "node6-p5", fromAnchor: "bottom", toAnchor: "top" },
  { from: "node6", to: "node6-p6", fromAnchor: "bottom", toAnchor: "top" },
];
