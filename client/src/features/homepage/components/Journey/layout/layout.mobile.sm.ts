import type { JourneyItemContent } from "../types/journey.types";
import { journeyContent } from "../journey.content";
import type { LayoutConfig, LayoutItem } from "./layout.types";
import { baseEdges } from "./layout.edges";

const canvasWidth = 576;
const paddingX = 0;
const cardWidth = canvasWidth - paddingX * 2;
const gapAfterParent = 40;
const gapAfterCard = 30;
const gapAfterLastChild = 100;
const startY = 70;

const getCardHeight = (_item: JourneyItemContent) => 420;

const estimateTextLines = (text: string, charsPerLine: number) => {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return 1;
  return Math.max(1, Math.ceil(normalized.length / Math.max(1, charsPerLine)));
};

const getParentHeight = (item: JourneyItemContent) => {
  const text = item.modalDetails ?? "";
  const charsPerLine = 54;
  const header = 76;
  const lineHeight = 18;
  const padding = 36;
  const lines = estimateTextLines(text, charsPerLine);
  const estimated = header + lines * lineHeight + padding;
  return Math.min(520, Math.max(200, Math.round(estimated)));
};

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

      const height = getParentHeight(item);
      items.push({
        id: item.id,
        x: paddingX,
        y,
        width: cardWidth,
        height,
      });
      y += height;
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
