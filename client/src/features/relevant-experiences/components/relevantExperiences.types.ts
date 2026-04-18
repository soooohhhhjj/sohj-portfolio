export type RelevantExperienceNodeType = 'parent' | 'child';
export type RelevantExperienceIcon = 'briefcase-business' | 'folder-kanban';

export type RelevantExperienceNodeLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RelevantExperienceConnectionAnchor = 'top' | 'right' | 'bottom' | 'left';

export type RelevantExperienceNode = {
  id: string;
  type: RelevantExperienceNodeType;
  parentId?: string;
  title: string;
  subtitle?: string;
  details: string;
  modalWhatIDid?: string[];
  previewTags?: string[];
  modalTags?: string[];
  image?: string;
  icon?: RelevantExperienceIcon;
  layout: RelevantExperienceNodeLayout;
};

export type RelevantExperienceConnectionPoint = {
  x: number;
  y: number;
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

export type RelevantExperiencesLayoutNode = {
  id: string;
  layout: RelevantExperienceNodeLayout;
};

export type RelevantExperiencesLayoutState = {
  nodes: RelevantExperiencesLayoutNode[];
  connections: RelevantExperienceConnection[];
};

export type RelevantExperiencesContentState = {
  nodes: RelevantExperienceNode[];
  connections: RelevantExperienceConnection[];
  mdLayout?: RelevantExperiencesLayoutState;
};
