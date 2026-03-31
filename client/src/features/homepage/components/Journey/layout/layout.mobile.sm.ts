import type { JourneyItemContent } from "../types/journey.types";
import { journeyContent } from "../journey.content";
import type { LayoutConfig, LayoutItem } from "./layout.types";
import { baseEdges } from "./layout.edges";

const canvasWidth = 576;
const paddingX = 0;
const cardWidth = canvasWidth - paddingX * 2;
const parentSize = 55;
const gapAfterParent = 40;
const gapAfterCard = 30;
const gapAfterLastChild = 100;
const startY = 70;

const getCardHeight = (_item: JourneyItemContent) => 420;

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

export const layoutMobileSm: LayoutConfig = {
  id: "mobile-sm",
  minWidth: 640,
  maxWidth: 767,
  canvasWidth,
  scaleWithContainer: true,
  items: stacked.items,
  edges: baseEdges,
};
