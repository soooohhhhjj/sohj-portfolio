import type {
  SkillsCardLayout,
  SkillsContentState,
  SkillsLayoutCard,
  SkillsLayoutState,
  SkillsLine,
  SkillsLineLayout,
  SkillsTitleLayout,
} from '../types/skills.types';

export const SKILLS_MIN_CARD_WIDTH = 260;
export const SKILLS_MIN_CARD_HEIGHT = 220;
export const SKILLS_MIN_LINE_WIDTH = 80;
export const SKILLS_LINE_HEIGHT = 16;
export const SKILLS_TITLE_DEFAULT_LAYOUT: SkillsTitleLayout = {
  x: 335,
  y: 26,
};

function normalizeLayout(layout: SkillsCardLayout): SkillsCardLayout {
  return {
    x: Math.max(0, Math.round(layout.x)),
    y: Math.max(0, Math.round(layout.y)),
    width: Math.max(SKILLS_MIN_CARD_WIDTH, Math.round(layout.width)),
    height: Math.max(SKILLS_MIN_CARD_HEIGHT, Math.round(layout.height)),
  };
}

function normalizeLineLayout(layout: SkillsLineLayout | undefined): SkillsLineLayout {
  const rotation = typeof layout?.rotation === 'number' && Number.isFinite(layout.rotation)
    ? Math.round(layout.rotation)
    : 0;

  return {
    x: Math.max(0, Math.round(layout?.x ?? 0)),
    y: Math.max(0, Math.round(layout?.y ?? 0)),
    width: Math.max(SKILLS_MIN_LINE_WIDTH, Math.round(layout?.width ?? 180)),
    height: SKILLS_LINE_HEIGHT,
    rotation,
  };
}

function normalizeTitleLayout(layout: SkillsTitleLayout | undefined): SkillsTitleLayout {
  return {
    x: Math.max(0, Math.round(layout?.x ?? SKILLS_TITLE_DEFAULT_LAYOUT.x)),
    y: Math.max(0, Math.round(layout?.y ?? SKILLS_TITLE_DEFAULT_LAYOUT.y)),
  };
}

export function cloneSkillsContentState(content: SkillsContentState): SkillsContentState {
  return {
    ...content,
    cards: content.cards.map((card) => ({
      ...card,
      currentStacks: card.currentStacks.map((stack) => ({ ...stack })),
      previousStacks: card.previousStacks.map((stack) => ({ ...stack })),
      layout: { ...card.layout },
    })),
    titleLayout: content.titleLayout ? { ...content.titleLayout } : { ...SKILLS_TITLE_DEFAULT_LAYOUT },
    lines: (content.lines ?? []).map((line) => ({
      ...line,
      layout: { ...line.layout },
    })),
    ...(content.mdLayout
      ? {
          mdLayout: {
            cards: content.mdLayout.cards.map((card) => ({
              ...card,
              layout: { ...card.layout },
            })),
          },
        }
      : {}),
  };
}

function createMdLayoutFromBase(content: SkillsContentState): SkillsLayoutState {
  return {
    cards: content.cards.map((card) => ({
      id: card.id,
      layout: normalizeLayout(card.layout),
    })),
  };
}

function normalizeLayoutState(layout: SkillsLayoutState | undefined, content: SkillsContentState): SkillsLayoutState {
  return {
    cards: (layout?.cards ?? createMdLayoutFromBase(content).cards).map((card) => ({
      id: card.id,
      layout: normalizeLayout(card.layout),
    })) satisfies SkillsLayoutCard[],
  };
}

export function normalizeSkillsContent(content: SkillsContentState): SkillsContentState {
  const nextCards = content.cards.map((card) => ({
    ...card,
    currentStacks: card.currentStacks.map((stack) => ({ ...stack })),
    previousStacks: card.previousStacks.map((stack) => ({ ...stack })),
    layout: normalizeLayout(card.layout),
  }));

  return {
    ...content,
    cards: nextCards,
    titleLayout: normalizeTitleLayout(content.titleLayout),
    lines: (content.lines ?? []).map((line, index) => ({
      id: line.id?.trim() || `line-${index + 1}`,
      layout: normalizeLineLayout(line.layout),
    })) satisfies SkillsLine[],
    mdLayout: normalizeLayoutState(content.mdLayout, {
      ...content,
      cards: nextCards,
    }),
  };
}
