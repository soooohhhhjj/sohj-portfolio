import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type JourneyCardTextOverride = Partial<{
  title: string;
  details: string;
  modalDetails: string;
}>;

type OverrideMap = Record<string, JourneyCardTextOverride>;

const STORAGE_KEY = "sohj.debug.journeyEditor.cardOverrides.v1";

const safeParse = (raw: string | null): OverrideMap | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as OverrideMap;
  } catch {
    return null;
  }
};

export function useJourneyEditorCardOverrides(params: { enabled: boolean }) {
  const { enabled } = params;
  const hydratedRef = useRef(false);
  const [overrides, setOverrides] = useState<OverrideMap>(() => {
    if (!enabled || typeof window === "undefined") return {};
    const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
    hydratedRef.current = true;
    return parsed ?? {};
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (hydratedRef.current) return;
    const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
    hydratedRef.current = true;
    setOverrides(parsed ?? {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }
  }, [enabled, overrides]);

  const getOverride = useCallback((id: string) => overrides[id] ?? null, [overrides]);

  const upsertOverride = useCallback((id: string, patch: JourneyCardTextOverride) => {
    setOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  }, []);

  const clearOverride = useCallback((id: string) => {
    setOverrides((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const resetAllOverrides = useCallback(() => setOverrides({}), []);

  const overrideIds = useMemo(() => Object.keys(overrides).sort(), [overrides]);

  return {
    overrides,
    overrideIds,
    getOverride,
    upsertOverride,
    clearOverride,
    resetAllOverrides,
  };
}
