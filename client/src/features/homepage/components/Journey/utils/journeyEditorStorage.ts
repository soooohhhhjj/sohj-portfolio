import type { Anchor } from "../types/journey.types";

export type NodeLayoutOverride = Partial<{ x: number; y: number; width: number; height: number }>;

export type EdgeOverride = Partial<{
  fromAnchor: Anchor;
  toAnchor: Anchor;
  via: { x: number; y: number }[];
}>;

export const buildNodeOverrideKey = (layoutId: string) => `journey-editor:${layoutId}:nodes`;
export const buildEdgeOverrideKey = (layoutId: string) => `journey-editor:${layoutId}:edges`;
export const buildParentCardSizeKey = (layoutId: string) => `journey-editor:${layoutId}:parentCardSize`;
export const buildGapOverrideKey = (layoutId: string) => `journey-editor:${layoutId}:gaps`;

export const HUD_POS_STORAGE_KEY = "sohj.debug.journeyEditor.hudPos";
export const HUD_MINIMIZED_STORAGE_KEY = "sohj.debug.journeyEditor.hudMinimized";
export const DELETED_IDS_STORAGE_KEY = "journey-editor:deletedIds.v1";

export function readLocalStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return fallback;
    if (Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function readLocalStorageStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function readLocalStorageParentCardSizeOverride(
  layoutId: string,
): { width: number; height: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(buildParentCardSizeKey(layoutId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown } | null;
    const nextW = Number(parsed?.width);
    const nextH = Number(parsed?.height);
    if (!Number.isFinite(nextW) || !Number.isFinite(nextH)) return null;
    return { width: nextW, height: nextH };
  } catch {
    return null;
  }
}
