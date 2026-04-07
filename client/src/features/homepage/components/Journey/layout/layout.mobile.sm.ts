import type { JourneyItemContent } from "../types/journey.types";
import { journeyContent } from "../journey.content";
import type { LayoutConfig, LayoutItem } from "./layout.types";
import { buildLinearEdges } from "./layout.edges";

const canvasWidth = 576;
const paddingX = 0;
const cardWidth = canvasWidth - paddingX * 2;
const gapAfterParent = 40;
const gapAfterCard = 30;
const gapAfterLastChild = 100;
const startY = 0;

const mobileSmCardHeights: Partial<Record<string, number>> = {
  "node1-c1": 391,
  "node1-c2": 391,
  "node1-c3": 387,
  "node2-c1": 390,
  "node2-c2": 390,
  "node3-c1": 387,
  "node3-c2": 387,
  "node4-c1": 387,
  "node4-c2": 390,
  "node4-c3": 390,
  "node5-c1": 387,
  "node6-p1": 387,
  "node6-p2": 387,
  "node6-p3": 387,
};

const getCardHeight = (itemId: string) => mobileSmCardHeights[itemId] ?? 420;

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

export type JourneyStackedGapOverridesSm = Partial<{
  parentToChildGap: number;
  childToChildGap: number;
  parentToParentGap: number;
}>;

export const DEFAULT_MOBILE_SM_GAPS: Required<JourneyStackedGapOverridesSm> = {
  parentToChildGap: gapAfterParent,
  childToChildGap: gapAfterCard,
  parentToParentGap: gapAfterLastChild,
};

const normalizeGap = (value: number) => Math.max(0, Math.round(value));

const buildStackedItems = (
  gaps: Required<JourneyStackedGapOverridesSm>,
  excludedIds: ReadonlySet<string>,
) => {
  let y = startY;
  const items: LayoutItem[] = [];

  for (let index = 0; index < journeyContent.length; index++) {
    const item = journeyContent[index];
    if (excludedIds.has(item.id)) continue;

    let nextVisible: JourneyItemContent | null = null;
    for (let nextIndex = index + 1; nextIndex < journeyContent.length; nextIndex++) {
      const candidate = journeyContent[nextIndex];
      if (excludedIds.has(candidate.id)) continue;
      nextVisible = candidate;
      break;
    }

    const hasNext = Boolean(nextVisible);

    if (item.type === "parent") {
      const height = getParentHeight(item);
      items.push({
        id: item.id,
        x: paddingX,
        y,
        width: cardWidth,
        height,
      });
      y += height;
      if (hasNext && nextVisible) {
        y += nextVisible.type === "parent" ? gaps.parentToParentGap : gaps.parentToChildGap;
      }
      continue;
    }

    const height = getCardHeight(item.id);
    items.push({
      id: item.id,
      x: paddingX,
      y,
      width: cardWidth,
      height,
    });
    y += height;
    if (hasNext && nextVisible) {
      y += nextVisible.type === "parent" ? gaps.parentToParentGap : gaps.childToChildGap;
    }
  }

  return { items, height: y };
};

export const createLayoutMobileSm = (
  overrides: JourneyStackedGapOverridesSm = {},
  options: { excludedIds?: Iterable<string> } = {},
): LayoutConfig => {
  const excludedIdSet = new Set(options.excludedIds ?? []);

  const gaps: Required<JourneyStackedGapOverridesSm> = {
    parentToChildGap: normalizeGap(overrides.parentToChildGap ?? DEFAULT_MOBILE_SM_GAPS.parentToChildGap),
    childToChildGap: normalizeGap(overrides.childToChildGap ?? DEFAULT_MOBILE_SM_GAPS.childToChildGap),
    parentToParentGap: normalizeGap(overrides.parentToParentGap ?? DEFAULT_MOBILE_SM_GAPS.parentToParentGap),
  };

  const stacked = buildStackedItems(gaps, excludedIdSet);
  const linearEdges = buildLinearEdges(stacked.items);

  return {
    id: "mobile-sm",
    minWidth: 640,
    maxWidth: 767,
    canvasWidth,
    scaleWithContainer: true,
    items: stacked.items,
    edges: linearEdges,
  };
};

export const layoutMobileSm: LayoutConfig = createLayoutMobileSm();
