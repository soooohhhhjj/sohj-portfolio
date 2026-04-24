import type {
  SkillsCard,
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

const TOOLS_CURRENT_STACKS: SkillsCard['currentStacks'] = [
  { id: 'vscode', name: 'VS Code', icon: 'vscode' },
  { id: 'github', name: 'GitHub', icon: 'github' },
];

const TOOLS_PREVIOUS_STACKS: SkillsCard['previousStacks'] = [
  { id: 'android-studio', name: 'Android Studio', icon: 'androidstudio' },
  { id: 'java', name: 'Java', icon: 'java' },
  { id: 'python', name: 'Python', icon: 'python' },
  { id: 'cpp', name: 'C++', icon: 'cpp' },
];

const DEFAULT_CARD_LAYOUTS: Record<string, SkillsCardLayout> = {
  frontend: { x: 0, y: 0, width: 694, height: 292 },
  backend: { x: 710, y: 34, width: 450, height: 292 },
  database: { x: 0, y: 308, width: 376, height: 268 },
  tools: { x: 392, y: 308, width: 376, height: 268 },
};

export function getDefaultSkillsCardLayout(cardId: string, index: number): SkillsCardLayout {
  const layout = DEFAULT_CARD_LAYOUTS[cardId];

  if (layout) {
    return { ...layout };
  }

  const column = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: column * 392,
    y: row * 292,
    width: 376,
    height: 268,
  };
}

function normalizeLayout(layout: SkillsCardLayout | undefined, cardId: string, index: number): SkillsCardLayout {
  const fallback = getDefaultSkillsCardLayout(cardId, index);

  if (!layout) {
    return fallback;
  }

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
    cards: content.cards.map((card, index) => ({
      id: card.id,
      layout: normalizeLayout(card.layout, card.id, index),
    })),
  };
}

function normalizeLayoutState(layout: SkillsLayoutState | undefined, content: SkillsContentState): SkillsLayoutState {
  const fallbackById = new Map(
    createMdLayoutFromBase(content).cards.map((card) => [card.id, card]),
  );
  const incomingById = new Map((layout?.cards ?? []).map((card) => [card.id, card]));

  return {
    cards: content.cards.map((card, index) => {
      const incoming = incomingById.get(card.id);
      const fallback = fallbackById.get(card.id);

      return {
        id: card.id,
        layout: normalizeLayout(
          incoming?.layout ?? fallback?.layout,
          card.id,
          index,
        ),
      } satisfies SkillsLayoutCard;
    }),
  };
}

export function normalizeSkillsContent(content: SkillsContentState): SkillsContentState {
  const nextCards = content.cards
    .filter((card) => card.id !== 'programming')
    .map((card, index) => (
      card.id === 'tools'
        ? {
            ...card,
            currentStacks: TOOLS_CURRENT_STACKS,
            previousStacks: TOOLS_PREVIOUS_STACKS,
            layout: normalizeLayout(card.layout, card.id, index),
          }
        : {
            ...card,
            layout: normalizeLayout(card.layout, card.id, index),
          }
    ));

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
