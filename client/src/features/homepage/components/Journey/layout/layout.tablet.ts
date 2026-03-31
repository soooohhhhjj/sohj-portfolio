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

const getCardHeight = (_item: JourneyItemContent) => 470;

const buildStackedItems = () => {
  let y = startY;
  const items: LayoutItem[] = [];

  let lastWasChild = false;

  for (let index = 0; index < journeyContent.length; index++) {
    const item = journeyContent[index];
    const isLast = index === journeyContent.length - 1;

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
      y += parentSize;
      if (!isLast) y += gapAfterParent;
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
    y += height;
    if (!isLast) y += gapAfterCard;
    lastWasChild = true;
  }

  return { items, height: y };
};

const stacked = buildStackedItems();

export const layoutTablet: LayoutConfig = {
  id: "tablet",
  minWidth: 768,
  maxWidth: 1023,
  canvasWidth,
  scaleWithContainer: true,
  items: stacked.items,
  edges: baseEdges,
};
