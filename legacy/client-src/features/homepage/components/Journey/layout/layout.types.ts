import type { Anchor, JourneyItemContent } from "../types/journey.types";

export interface LayoutItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  from: string;
  to: string;
  fromAnchor: Anchor;
  toAnchor: Anchor;
  via?: { x: number; y: number }[];
}

export type LayoutOverrides = Record<
  string,
  Partial<JourneyItemContent>
>;

export interface LayoutConfig {
  id: string;
  minWidth: number;
  maxWidth?: number;
  canvasWidth: number;
  height?: number;
  extraHeight?: number;
  scaleWithContainer?: boolean;
  items: LayoutItem[];
  edges: LayoutEdge[];
  overrides?: LayoutOverrides;
}
