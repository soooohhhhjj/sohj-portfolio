import type {
  RelevantExperienceConnection,
  RelevantExperienceConnectionAnchor,
  RelevantExperienceConnectionPoint,
  RelevantExperienceNode,
  RelevantExperienceNodeLayout,
} from './relevantExperiences.types';

function getAnchorPoint(
  node: RelevantExperienceNode,
  anchor: RelevantExperienceConnectionAnchor,
  measuredLayoutsById?: Map<string, RelevantExperienceNodeLayout>,
): RelevantExperienceConnectionPoint {
  const { x, y, width, height } = measuredLayoutsById?.get(node.id) ?? node.layout;

  switch (anchor) {
    case 'top':
      return { x: x + width / 2, y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
  }
}

export function buildConnectionPath(
  connection: RelevantExperienceConnection,
  nodesById: Map<string, RelevantExperienceNode>,
  measuredLayoutsById?: Map<string, RelevantExperienceNodeLayout>,
) {
  const fromNode = nodesById.get(connection.from);
  const toNode = nodesById.get(connection.to);

  if (!fromNode || !toNode) {
    return '';
  }

  const points = [
    getAnchorPoint(fromNode, connection.fromAnchor, measuredLayoutsById),
    ...connection.viaPoints,
    getAnchorPoint(toNode, connection.toAnchor, measuredLayoutsById),
  ];

  if (points.length < 2) {
    return '';
  }

  return points.reduce((path, point, index) => (
    `${path}${index === 0 ? 'M' : ' L'} ${point.x} ${point.y}`
  ), '');
}

export function getRenderableConnectionPoints(
  connection: RelevantExperienceConnection,
  nodesById: Map<string, RelevantExperienceNode>,
  measuredLayoutsById?: Map<string, RelevantExperienceNodeLayout>,
) {
  const fromNode = nodesById.get(connection.from);
  const toNode = nodesById.get(connection.to);

  if (!fromNode || !toNode) {
    return [];
  }

  return [
    getAnchorPoint(fromNode, connection.fromAnchor, measuredLayoutsById),
    ...connection.viaPoints,
    getAnchorPoint(toNode, connection.toAnchor, measuredLayoutsById),
  ];
}
