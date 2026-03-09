import { journeyContent } from './journey.content';
import type { JourneyItemContent } from './types/journey.types';

export interface JourneyTimelineGroup {
  parent: JourneyItemContent;
  children: JourneyItemContent[];
}

const PARENT_ID_ORDER = ['node1', 'node2', 'node3', 'node4', 'node5', 'node6'] as const;

export const journeyTimelineGroups: JourneyTimelineGroup[] = PARENT_ID_ORDER.map((parentId) => {
  const parent = journeyContent.find((item) => item.id === parentId && item.type === 'parent');

  if (!parent) {
    throw new Error(`Missing journey parent content for ${parentId}`);
  }

  const children = journeyContent.filter((item) => item.type !== 'parent' && item.id.startsWith(`${parentId}-`));

  return {
    parent,
    children,
  };
});
