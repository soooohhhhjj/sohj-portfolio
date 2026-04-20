import { SkillsModel } from './skills.model.js';

const SECTION_KEY = 'skills';
const MIN_CARD_WIDTH = 260;
const MIN_CARD_HEIGHT = 220;

const DEFAULT_CARD_LAYOUTS: Record<string, SkillsCardLayout> = {
  frontend: { x: 0, y: 0, width: 694, height: 292 },
  backend: { x: 710, y: 34, width: 450, height: 292 },
  database: { x: 0, y: 308, width: 376, height: 268 },
  tools: { x: 392, y: 308, width: 376, height: 268 },
};

export type SkillsStack = {
  id: string;
  name: string;
  icon: string;
};

export type SkillsCardLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SkillsCard = {
  id: string;
  title: string;
  frontLabel: string;
  backLabel: string;
  currentStacks: SkillsStack[];
  previousStacks: SkillsStack[];
  layout: SkillsCardLayout;
};

export type SkillsLayoutCard = {
  id: string;
  layout: SkillsCardLayout;
};

export type SkillsLayoutState = {
  cards: SkillsLayoutCard[];
};

export type SkillsContentState = {
  title: string;
  intro: string;
  cards: SkillsCard[];
  mdLayout?: SkillsLayoutState;
};

function getDefaultCardLayout(cardId: string, index: number): SkillsCardLayout {
  const defaultLayout = DEFAULT_CARD_LAYOUTS[cardId];

  if (defaultLayout) {
    return { ...defaultLayout };
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

function sanitizeSkillsCardLayout(input: unknown, fallback: SkillsCardLayout): SkillsCardLayout {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return fallback;
  }

  const layout = input as Record<string, unknown>;
  const x = typeof layout.x === 'number' && Number.isFinite(layout.x) ? Math.round(layout.x) : fallback.x;
  const y = typeof layout.y === 'number' && Number.isFinite(layout.y) ? Math.round(layout.y) : fallback.y;
  const width = typeof layout.width === 'number' && Number.isFinite(layout.width)
    ? Math.max(MIN_CARD_WIDTH, Math.round(layout.width))
    : fallback.width;
  const height = typeof layout.height === 'number' && Number.isFinite(layout.height)
    ? Math.max(MIN_CARD_HEIGHT, Math.round(layout.height))
    : fallback.height;

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width,
    height,
  };
}

function sanitizeSkillsStack(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const stack = input as Record<string, unknown>;
  const id = typeof stack.id === 'string' ? stack.id.trim() : '';
  const name = typeof stack.name === 'string' ? stack.name.trim() : '';
  const icon = typeof stack.icon === 'string' ? stack.icon.trim() : '';

  if (!id || !name || !icon) {
    return null;
  }

  return {
    id,
    name,
    icon,
  } satisfies SkillsStack;
}

function sanitizeSkillsLayoutCard(input: unknown, index: number) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const card = input as Record<string, unknown>;
  const id = typeof card.id === 'string' ? card.id.trim() : '';

  if (!id) {
    return null;
  }

  return {
    id,
    layout: sanitizeSkillsCardLayout(card.layout, getDefaultCardLayout(id, index)),
  } satisfies SkillsLayoutCard;
}

function sanitizeSkillsLayoutState(input: unknown): SkillsLayoutState | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }

  const layoutState = input as Record<string, unknown>;
  const cards = Array.isArray(layoutState.cards)
    ? layoutState.cards
        .map((card, index) => sanitizeSkillsLayoutCard(card, index))
        .filter((card): card is SkillsLayoutCard => card !== null)
    : [];

  if (cards.length === 0) {
    return undefined;
  }

  return { cards };
}

function sanitizeSkillsCard(input: unknown, index: number) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const card = input as Record<string, unknown>;
  const id = typeof card.id === 'string' ? card.id.trim() : '';
  const title = typeof card.title === 'string' ? card.title.trim() : '';
  const frontLabel = typeof card.frontLabel === 'string' ? card.frontLabel.trim() : '';
  const backLabel = typeof card.backLabel === 'string' ? card.backLabel.trim() : '';
  const currentStacks = Array.isArray(card.currentStacks)
    ? card.currentStacks
        .map((stack) => sanitizeSkillsStack(stack))
        .filter((stack): stack is SkillsStack => stack !== null)
    : [];
  const previousStacks = Array.isArray(card.previousStacks)
    ? card.previousStacks
        .map((stack) => sanitizeSkillsStack(stack))
        .filter((stack): stack is SkillsStack => stack !== null)
    : [];
  const layout = sanitizeSkillsCardLayout(card.layout, getDefaultCardLayout(id, index));

  if (!id || !title || !frontLabel || !backLabel || (currentStacks.length === 0 && previousStacks.length === 0)) {
    return null;
  }

  return {
    id,
    title,
    frontLabel,
    backLabel,
    currentStacks,
    previousStacks,
    layout,
  } satisfies SkillsCard;
}

function sanitizeSkillsContent(input: unknown): SkillsContentState | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const content = input as Record<string, unknown>;
  const title = typeof content.title === 'string' ? content.title.trim() : '';
  const intro = typeof content.intro === 'string' ? content.intro.trim() : '';
  const cards = Array.isArray(content.cards)
    ? content.cards
        .map((card, index) => sanitizeSkillsCard(card, index))
        .filter((card): card is SkillsCard => card !== null)
    : [];

  if (!title || !intro || cards.length === 0) {
    return null;
  }

  const mdLayout = sanitizeSkillsLayoutState(content.mdLayout);

  return {
    title,
    intro,
    cards,
    ...(mdLayout ? { mdLayout } : {}),
  };
}

export async function getSkillsContentState() {
  const document = await SkillsModel.findOne({ key: SECTION_KEY }).lean<SkillsContentState | null>();

  if (!document) {
    return null;
  }

  const sanitizedContent = sanitizeSkillsContent(document);

  if (sanitizedContent) {
    return sanitizedContent;
  }

  return null;
}

export async function saveSkillsContentState(input: unknown) {
  const sanitizedContent = sanitizeSkillsContent(input);

  if (!sanitizedContent) {
    throw new Error('Invalid skills content payload.');
  }

  const document = await SkillsModel.findOneAndUpdate(
    { key: SECTION_KEY },
    {
      $set: {
        key: SECTION_KEY,
        title: sanitizedContent.title,
        intro: sanitizedContent.intro,
        cards: sanitizedContent.cards,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).lean<SkillsContentState | null>();

  return sanitizeSkillsContent(document);
}
