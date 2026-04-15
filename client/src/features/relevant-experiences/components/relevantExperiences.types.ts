export type RelevantExperienceNodeType = 'parent' | 'child';
export type RelevantExperienceIcon = 'briefcase-business' | 'folder-kanban';

export type RelevantExperienceNodeLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
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

export type RelevantExperiencesContentState = {
  nodes: RelevantExperienceNode[];
};
