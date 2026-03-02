import type { JourneyItemContent } from "../types/journey.types";
import { journeyContent } from "../journey.content";
import type { LayoutConfig, LayoutItem } from "./layout.types";
import { baseEdges } from "./layout.edges";

const canvasWidth = 730;
const paddingX = 28;
const cardWidth = canvasWidth - paddingX * 2;
const parentSize = 56;
const gapAfterParent = 50;
const gapAfterCard = 34;
const gapAfterLastChild = 100;
const startY = 80;

const getCardHeight = (item: JourneyItemContent) => {
  if (item.type === "placeholder") return 250;
  if (item.type === "internship") return 470;
  return 470;
};

const buildStackedItems = () => {
  let y = startY;
  const items: LayoutItem[] = [];

  let lastWasChild = false;

  for (const item of journeyContent) {
    if (item.type === "parent") {
      if (lastWasChild) {
        y += gapAfterLastChild;
      }

      items.push({
        id: item.id,
        x: (canvasWidth - parentSize) / 2,
        y,
        width: parentSize,
        height: parentSize,
      });
      y += parentSize + gapAfterParent;
      lastWasChild = false;
      continue;
    }

    const height = getCardHeight(item);
    items.push({
      id: item.id,
      x: paddingX,
      y,
      width: cardWidth,
      height,
    });
    y += height + gapAfterCard;
    lastWasChild = true;
  }

  return { items, height: y + 50 };
};

const stacked = buildStackedItems();

export const layoutTablet: LayoutConfig = {
  id: "tablet",
  minWidth: 768,
  maxWidth: 1023,
  canvasWidth,
  extraHeight: 200,
  scaleWithContainer: true,
  items: stacked.items,
  edges: baseEdges,
};
