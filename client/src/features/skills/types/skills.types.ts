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

export type SkillsLineLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type SkillsTitleLayout = {
  x: number;
  y: number;
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

export type SkillsLine = {
  id: string;
  layout: SkillsLineLayout;
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
  titleLayout?: SkillsTitleLayout;
  lines?: SkillsLine[];
  mdLayout?: SkillsLayoutState;
};
