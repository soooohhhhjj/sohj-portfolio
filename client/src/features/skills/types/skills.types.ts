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
