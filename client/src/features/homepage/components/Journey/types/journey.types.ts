import type { LucideIcon } from "lucide-react";

export type Anchor = "top" | "bottom" | "left" | "right";

export type JourneyItemType = "parent" | "child" | "placeholder" | "internship";

export interface JourneyItemContent {
  id: string;
  type: JourneyItemType;

  // parent
  icon?: LucideIcon;

  // child
  title?: string;
  details?: string;
  modalDetails?: string;
  modalProblemToAddress?: string;
  modalPlannedFeatureSummary?: string | string[];
  projectExperienceSummary?: string | string[];
  image?: string;
  keyTakeaways?: string[];
  viewLiveUrl?: string;
  projectDetailsUrl?: string;

  techTags?: string[];
  highlightTags?: string[];
}

export interface JourneyItemNode extends JourneyItemContent {
  x: number;
  y: number;
  width: number;
  height: number;
}
