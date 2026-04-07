import type { JourneyItemContent } from "../types/journey.types";
import { journeyContent } from "../journey.content";
import type { LayoutConfig, LayoutItem } from "./layout.types";
import { buildLinearEdges } from "./layout.edges";
import { type JourneyStackedGapOverrides } from "./layout.mobile";

const canvasWidth = 370;
const paddingX = 0;
const cardWidth = canvasWidth - paddingX * 2;
const startY = 0;
const gapAfterParent = 70;
const gapAfterCard = 70;
const gapAfterLastChild = 140;

const mobileXxsmCardHeights: Partial<Record<string, number>> = {
  "node1-c1": 275,
  "node1-c2": 275,
  "node1-c3": 273,
  "node2-c1": 275,
  "node2-c2": 275,
  "node3-c1": 273,
  "node3-c2": 273,
  "node4-c1": 273,
  "node4-c2": 275,
  "node4-c3": 275,
  "node5-c1": 273,
  "node6-p1": 273,
  "node6-p2": 273,
  "node6-p3": 273,
};

const getCardHeight = (itemId: string) => mobileXxsmCardHeights[itemId] ?? 320;

const estimateTextLines = (text: string, charsPerLine: number) => {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return 1;
  return Math.max(1, Math.ceil(normalized.length / Math.max(1, charsPerLine)));
};

const getParentHeight = (item: JourneyItemContent) => {
  const text = item.modalDetails ?? "";
  const charsPerLine = 34;
  const header = 72;
  const lineHeight = 18;
  const padding = 36;
  const lines = estimateTextLines(text, charsPerLine);
  const estimated = header + lines * lineHeight + padding;
  return Math.min(420, Math.max(180, Math.round(estimated)));
};

export const DEFAULT_MOBILE_XXSM_GAPS: Required<JourneyStackedGapOverrides> = {
  parentToChildGap: gapAfterParent,
  childToChildGap: gapAfterCard,
  parentToParentGap: gapAfterLastChild,
};

const normalizeGap = (value: number) => Math.max(0, Math.round(value));

const buildStackedItems = (
  gaps: Required<JourneyStackedGapOverrides>,
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

export const createLayoutMobileXxsm = (
  overrides: JourneyStackedGapOverrides = {},
  options: { excludedIds?: Iterable<string> } = {},
): LayoutConfig => {
  const excludedIdSet = new Set(options.excludedIds ?? []);

  const gaps: Required<JourneyStackedGapOverrides> = {
    parentToChildGap: normalizeGap(overrides.parentToChildGap ?? DEFAULT_MOBILE_XXSM_GAPS.parentToChildGap),
    childToChildGap: normalizeGap(overrides.childToChildGap ?? DEFAULT_MOBILE_XXSM_GAPS.childToChildGap),
    parentToParentGap: normalizeGap(overrides.parentToParentGap ?? DEFAULT_MOBILE_XXSM_GAPS.parentToParentGap),
  };

  const stacked = buildStackedItems(gaps, excludedIdSet);
  const linearEdges = buildLinearEdges(stacked.items);

  return {
    id: "mobile-xxsm",
    minWidth: 400,
    maxWidth: 479,
    canvasWidth,
    scaleWithContainer: true,
    items: stacked.items,
    edges: linearEdges,
  };
};

export const layoutMobileXxsm: LayoutConfig = createLayoutMobileXxsm();
