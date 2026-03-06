import type { LayoutEdge } from './layout/layout.types';
import type { JourneyItemNode } from './types/journey.types';

interface Props {
  edge: LayoutEdge;
  items: Record<string, JourneyItemNode>;
}

function getAnchorPoint(item: JourneyItemNode, anchor: 'top' | 'bottom' | 'left' | 'right') {
  const { x, y, width, height } = item;

  if (anchor === 'top') return { x: x + width / 2, y };
  if (anchor === 'bottom') return { x: x + width / 2, y: y + height };
  if (anchor === 'left') return { x, y: y + height / 2 };
  return { x: x + width, y: y + height / 2 };
}

function buildPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const cx = (previous.x + current.x) / 2;
    const cy = (previous.y + current.y) / 2;

    path += ` Q ${previous.x} ${previous.y} ${cx} ${cy}`;
  }

  const last = points[points.length - 1];
  path += ` T ${last.x} ${last.y}`;

  return path;
}

export default function MemoryPath({ edge, items }: Props) {
  const from = items[edge.from];
  const to = items[edge.to];

  if (!from || !to) return null;

  const start = getAnchorPoint(from, edge.fromAnchor);
  const end = getAnchorPoint(to, edge.toAnchor);
  const pathD = buildPath([start, ...(edge.via ?? []), end]);
  const gradientId = `memory-gradient-${edge.from}-${edge.to}`;
  const glowId = `memory-glow-${edge.from}-${edge.to}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
          <stop offset="0%" stopColor="rgba(255,214,126,0.18)" />
          <stop offset="50%" stopColor="rgba(255,238,180,0.9)" />
          <stop offset="100%" stopColor="rgba(255,214,126,0.18)" />
        </linearGradient>

        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={pathD}
        className="memory-path-glow"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.1}
        filter={`url(#${glowId})`}
      />

      <path
        d={pathD}
        className="memory-path-line"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
