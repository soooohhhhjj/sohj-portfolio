import type { Anchor, JourneyItemNode } from '../components/Journey/types/journey.types';
import type { LayoutEdge } from '../components/Journey/layout/layout.types';

export interface ConstellationPoint {
  x: number;
  y: number;
}

export interface DragState {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
}

export const JOURNEY_STORAGE_KEY = 'sohj.journey.constellation.positions.v1';

export const CONSTELLATION_PARENT_IDS = ['node1', 'node2', 'node3', 'node4', 'node5', 'node6'] as const;

export const CONSTELLATION_POINTS: Record<string, ConstellationPoint> = {
  node1: { x: 0.09, y: 0.16 },
  node2: { x: 0.24, y: 0.44 },
  node3: { x: 0.47, y: 0.23 },
  node4: { x: 0.58, y: 0.58 },
  node5: { x: 0.8, y: 0.3 },
  node6: { x: 0.86, y: 0.72 },
};

export const CONSTELLATION_EDGE_BLUEPRINTS: LayoutEdge[] = [
  { from: 'node1', to: 'node2', fromAnchor: 'right', toAnchor: 'left' },
  { from: 'node2', to: 'node3', fromAnchor: 'right', toAnchor: 'left', via: [{ x: 0.35, y: 0.34 }] },
  { from: 'node3', to: 'node4', fromAnchor: 'bottom', toAnchor: 'top' },
  { from: 'node3', to: 'node5', fromAnchor: 'right', toAnchor: 'left' },
  { from: 'node4', to: 'node6', fromAnchor: 'right', toAnchor: 'left', via: [{ x: 0.73, y: 0.68 }] },
  { from: 'node5', to: 'node6', fromAnchor: 'bottom', toAnchor: 'top' },
];

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const parseStoredPositions = (): Record<string, ConstellationPoint> => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, { x?: unknown; y?: unknown }>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, point]) => {
        return (
          typeof point?.x === 'number' &&
          Number.isFinite(point.x) &&
          typeof point?.y === 'number' &&
          Number.isFinite(point.y)
        );
      }),
    ) as Record<string, ConstellationPoint>;
  } catch {
    return {};
  }
};

export const resolveAnchor = (
  from: JourneyItemNode,
  to: JourneyItemNode,
): { fromAnchor: Anchor; toAnchor: Anchor } => {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const deltaX = toCenterX - fromCenterX;
  const deltaY = toCenterY - fromCenterY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? { fromAnchor: 'right', toAnchor: 'left' } : { fromAnchor: 'left', toAnchor: 'right' };
  }

  return deltaY >= 0 ? { fromAnchor: 'bottom', toAnchor: 'top' } : { fromAnchor: 'top', toAnchor: 'bottom' };
};

export const getLaneSizeKey = (laneWidth: number) => {
  if (laneWidth >= 840) return 'xl';
  if (laneWidth >= 680) return 'lg';
  if (laneWidth >= 520) return 'md';
  return 'sm';
};

export const getNodeSizes = (laneSizeKey: 'sm' | 'md' | 'lg' | 'xl') => {
  if (laneSizeKey === 'xl') return { parent: 52, child: 30 };
  if (laneSizeKey === 'lg') return { parent: 44, child: 27 };
  if (laneSizeKey === 'md') return { parent: 36, child: 22 };
  return { parent: 28, child: 16 };
};
