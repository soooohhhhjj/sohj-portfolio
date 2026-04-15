import { RelevantExperiencesModel } from './relevant-experiences.model.js';
import { relevantExperiencesSeedState } from './relevant-experiences.seed.js';

const SECTION_KEY = 'relevant-experiences';
const MIN_CARD_WIDTH = 200;
const MIN_CARD_HEIGHT = 170;

type RelevantExperienceNodeType = 'parent' | 'child';
type RelevantExperienceIcon = 'briefcase-business' | 'folder-kanban';

type RelevantExperienceNodeLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RelevantExperienceConnectionAnchor = 'top' | 'right' | 'bottom' | 'left';

export type RelevantExperienceConnectionPoint = {
  x: number;
  y: number;
};

export type RelevantExperienceNode = {
  id: string;
  type: RelevantExperienceNodeType;
  parentId?: string;
  title: string;
  details: string;
  image?: string;
  icon?: RelevantExperienceIcon;
  layout: RelevantExperienceNodeLayout;
};

export type RelevantExperienceConnection = {
  id: string;
  from: string;
  to: string;
  fromAnchor: RelevantExperienceConnectionAnchor;
  toAnchor: RelevantExperienceConnectionAnchor;
  viaPoints: RelevantExperienceConnectionPoint[];
  variant: 'group' | 'detail';
};

export type RelevantExperiencesContentState = {
  nodes: RelevantExperienceNode[];
  connections: RelevantExperienceConnection[];
};

type LegacyTextOverride = {
  id: string;
  title?: string | null;
  details?: string | null;
};

type LegacyNodeOverride = {
  id: string;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
};

type StoredContentState = {
  nodes?: RelevantExperienceNode[] | null;
  connections?: RelevantExperienceConnection[] | null;
  textOverrides?: LegacyTextOverride[] | null;
  nodeOverrides?: LegacyNodeOverride[] | null;
} | null;

function cloneContentState(content: RelevantExperiencesContentState): RelevantExperiencesContentState {
  return {
    nodes: content.nodes.map((node) => ({
      ...node,
      layout: { ...node.layout },
    })),
    connections: content.connections.map((connection) => ({
      ...connection,
      viaPoints: connection.viaPoints.map((point) => ({ ...point })),
    })),
  };
}

function sanitizeConnectionPoint(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const point = input as Record<string, unknown>;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null;
  }

  return {
    x: Math.max(0, Math.round(Number(point.x))),
    y: Math.max(0, Math.round(Number(point.y))),
  } satisfies RelevantExperienceConnectionPoint;
}

function sanitizeNodeLayout(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const layout = input as Record<string, unknown>;
  if (
    !Number.isFinite(layout.x) ||
    !Number.isFinite(layout.y) ||
    !Number.isFinite(layout.width) ||
    !Number.isFinite(layout.height)
  ) {
    return null;
  }

  return {
    x: Math.max(0, Math.round(Number(layout.x))),
    y: Math.max(0, Math.round(Number(layout.y))),
    width: Math.max(MIN_CARD_WIDTH, Math.round(Number(layout.width))),
    height: Math.max(MIN_CARD_HEIGHT, Math.round(Number(layout.height))),
  };
}

function sanitizeNode(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const node = input as Record<string, unknown>;
  const id = typeof node.id === 'string' ? node.id.trim() : '';
  const type = node.type === 'parent' || node.type === 'child' ? node.type : null;
  const title = typeof node.title === 'string' ? node.title.trim() : '';
  const details = typeof node.details === 'string' ? node.details.trim() : '';
  const layout = sanitizeNodeLayout(node.layout);

  if (!id || !type || !title || !details || !layout) {
    return null;
  }

  const icon =
    node.icon === 'briefcase-business' || node.icon === 'folder-kanban' ? node.icon : undefined;
  const image = typeof node.image === 'string' && node.image.trim() ? node.image.trim() : undefined;
  const parentId =
    typeof node.parentId === 'string' && node.parentId.trim() ? node.parentId.trim() : undefined;

  return {
    id,
    type,
    ...(parentId ? { parentId } : {}),
    title,
    details,
    ...(image ? { image } : {}),
    ...(icon ? { icon } : {}),
    layout,
  } satisfies RelevantExperienceNode;
}

function sanitizeConnection(input: unknown, nodeIds: Set<string>) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const connection = input as Record<string, unknown>;
  const id = typeof connection.id === 'string' ? connection.id.trim() : '';
  const from = typeof connection.from === 'string' ? connection.from.trim() : '';
  const to = typeof connection.to === 'string' ? connection.to.trim() : '';
  const fromAnchor =
    connection.fromAnchor === 'top' ||
    connection.fromAnchor === 'right' ||
    connection.fromAnchor === 'bottom' ||
    connection.fromAnchor === 'left'
      ? connection.fromAnchor
      : null;
  const toAnchor =
    connection.toAnchor === 'top' ||
    connection.toAnchor === 'right' ||
    connection.toAnchor === 'bottom' ||
    connection.toAnchor === 'left'
      ? connection.toAnchor
      : null;
  const variant =
    connection.variant === 'group' || connection.variant === 'detail' ? connection.variant : null;
  const viaPoints = Array.isArray(connection.viaPoints)
    ? connection.viaPoints
        .map((point) => sanitizeConnectionPoint(point))
        .filter((point): point is RelevantExperienceConnectionPoint => point !== null)
    : [];

  if (
    !id ||
    !from ||
    !to ||
    from === to ||
    !nodeIds.has(from) ||
    !nodeIds.has(to) ||
    !fromAnchor ||
    !toAnchor ||
    !variant
  ) {
    return null;
  }

  return {
    id,
    from,
    to,
    fromAnchor,
    toAnchor,
    viaPoints,
    variant,
  } satisfies RelevantExperienceConnection;
}

function sanitizeContentState(input: unknown): RelevantExperiencesContentState | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const payload = input as Record<string, unknown>;
  const nodes = Array.isArray(payload.nodes)
    ? payload.nodes
        .map((node) => sanitizeNode(node))
        .filter((node): node is RelevantExperienceNode => node !== null)
    : [];

  if (nodes.length === 0) {
    return null;
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const connections = Array.isArray(payload.connections)
    ? payload.connections
        .map((connection) => sanitizeConnection(connection, nodeIds))
        .filter((connection): connection is RelevantExperienceConnection => connection !== null)
    : [];

  return { nodes, connections };
}

function buildStateFromLegacyDocument(document: StoredContentState) {
  const nextState = cloneContentState(relevantExperiencesSeedState);
  const textOverrides = new Map((document?.textOverrides ?? []).map((override) => [override.id, override]));
  const nodeOverrides = new Map((document?.nodeOverrides ?? []).map((override) => [override.id, override]));

  nextState.nodes = nextState.nodes.map((node) => {
    const textOverride = textOverrides.get(node.id);
    const nodeOverride = nodeOverrides.get(node.id);

    return {
      ...node,
      title: textOverride?.title?.trim() || node.title,
      details: textOverride?.details?.trim() || node.details,
      layout: {
        x: typeof nodeOverride?.x === 'number' ? Math.max(0, Math.round(nodeOverride.x)) : node.layout.x,
        y: typeof nodeOverride?.y === 'number' ? Math.max(0, Math.round(nodeOverride.y)) : node.layout.y,
        width: typeof nodeOverride?.width === 'number' ? Math.max(MIN_CARD_WIDTH, Math.round(nodeOverride.width)) : node.layout.width,
        height: typeof nodeOverride?.height === 'number' ? Math.max(MIN_CARD_HEIGHT, Math.round(nodeOverride.height)) : node.layout.height,
      },
    };
  });

  nextState.connections = [];

  return nextState;
}

function toState(document: StoredContentState) {
  const sanitizedState = sanitizeContentState(document);
  if (sanitizedState) {
    return sanitizedState;
  }

  return buildStateFromLegacyDocument(document);
}

async function ensureRelevantExperiencesContentState() {
  const document = await RelevantExperiencesModel.findOne({ key: SECTION_KEY }).lean<StoredContentState>();

  if (!document) {
    const seededState = cloneContentState(relevantExperiencesSeedState);
    await RelevantExperiencesModel.create({
      key: SECTION_KEY,
      nodes: seededState.nodes,
    });
    return seededState;
  }

  const contentState = toState(document);
  const hasStoredNodes = Array.isArray(document.nodes) && document.nodes.length > 0;

  if (!hasStoredNodes) {
    await RelevantExperiencesModel.findOneAndUpdate(
      { key: SECTION_KEY },
      {
        $set: {
          nodes: contentState.nodes,
          connections: contentState.connections,
        },
        $unset: {
          textOverrides: 1,
          nodeOverrides: 1,
          edges: 1,
        },
      },
      { new: true },
    );
  }

  return contentState;
}

export async function getRelevantExperiencesContentState() {
  return ensureRelevantExperiencesContentState();
}

export async function saveRelevantExperiencesContentState(input: unknown) {
  const contentState = sanitizeContentState(input);

  if (!contentState) {
    throw new Error('Invalid relevant experiences payload.');
  }

  const document = await RelevantExperiencesModel.findOneAndUpdate(
    { key: SECTION_KEY },
    {
      $set: {
        key: SECTION_KEY,
        nodes: contentState.nodes,
        connections: contentState.connections,
      },
      $unset: {
        textOverrides: 1,
        nodeOverrides: 1,
        edges: 1,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).lean<StoredContentState>();

  return toState(document);
}
