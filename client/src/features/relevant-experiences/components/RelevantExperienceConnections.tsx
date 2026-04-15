import { useMemo, type PointerEvent as ReactPointerEvent } from 'react';
import { buildConnectionPath, getRenderableConnectionPoints } from './experienceConnections';
import type {
  RelevantExperienceConnection,
  RelevantExperienceConnectionPoint,
  RelevantExperienceNode,
  RelevantExperienceNodeLayout,
} from './relevantExperiences.types';

type RelevantExperienceConnectionsProps = {
  canvasHeight: number;
  canvasWidth: number;
  connections: RelevantExperienceConnection[];
  nodes: RelevantExperienceNode[];
  measuredNodeLayouts: Map<string, RelevantExperienceNodeLayout>;
  editorEnabled: boolean;
  selectedConnectionId: string | null;
  selectedViaIndex: number | null;
  onSelectConnection: (connectionId: string, event: ReactPointerEvent<SVGPathElement>) => void;
  onSelectViaPoint: (
    connectionId: string,
    viaIndex: number,
    event: ReactPointerEvent<SVGCircleElement>,
  ) => void;
};

export function RelevantExperienceConnections({
  canvasHeight,
  canvasWidth,
  connections,
  nodes,
  measuredNodeLayouts,
  editorEnabled,
  selectedConnectionId,
  selectedViaIndex,
  onSelectConnection,
  onSelectViaPoint,
}: RelevantExperienceConnectionsProps) {
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  return (
    <svg
      className={`relevant-experiences-connections ${editorEnabled ? 'relevant-experiences-connections--editable' : ''}`}
      width="100%"
      height="100%"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {connections.map((connection) => {
        const path = buildConnectionPath(connection, nodesById, measuredNodeLayouts);
        if (!path) {
          return null;
        }

        const isSelected = connection.id === selectedConnectionId;
        const points = getRenderableConnectionPoints(connection, nodesById, measuredNodeLayouts);
        const viaPoints = points.slice(1, -1) as RelevantExperienceConnectionPoint[];

        return (
          <g key={connection.id}>
            {editorEnabled ? (
              <path
                d={path}
                className="relevant-experiences-connection-hitbox"
                onPointerDown={(event) => onSelectConnection(connection.id, event)}
              />
            ) : null}
            <path
              d={path}
              className={`relevant-experiences-connection relevant-experiences-connection--${connection.variant} ${isSelected ? 'relevant-experiences-connection--selected' : ''}`}
            />
            {editorEnabled && isSelected
              ? viaPoints.map((point, index) => (
                <circle
                  key={`${connection.id}-via-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={selectedViaIndex === index ? 7 : 6}
                  className={`relevant-experiences-connection-point ${selectedViaIndex === index ? 'relevant-experiences-connection-point--active' : ''}`}
                  onPointerDown={(event) => onSelectViaPoint(connection.id, index, event)}
                />
              ))
              : null}
          </g>
        );
      })}
    </svg>
  );
}

