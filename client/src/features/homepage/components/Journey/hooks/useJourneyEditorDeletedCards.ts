import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Stored = string[];

const STORAGE_KEY = "sohj.debug.journeyEditor.deletedCards.v1";

const safeParse = (raw: string | null): string[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((value) => typeof value === "string");
  } catch {
    return null;
  }
};

export function useJourneyEditorDeletedCards(params: { enabled: boolean }) {
  const { enabled } = params;
  const hydratedRef = useRef(false);
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    if (!enabled || typeof window === "undefined") return [];
    const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
    hydratedRef.current = true;
    return parsed ?? [];
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (hydratedRef.current) return;
    const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
    hydratedRef.current = true;
    setDeletedIds(parsed ?? []);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deletedIds satisfies Stored));
    } catch {
      // ignore
    }
  }, [deletedIds, enabled]);

  const deletedSet = useMemo(() => new Set(deletedIds), [deletedIds]);

  const deleteCard = useCallback((id: string) => {
    setDeletedIds((prev) => (prev.includes(id) ? prev : [...prev, id].sort()));
  }, []);

  const restoreCard = useCallback((id: string) => {
    setDeletedIds((prev) => prev.filter((value) => value !== id));
  }, []);

  const resetDeletedCards = useCallback(() => setDeletedIds([]), []);

  return {
    deletedIds,
    deletedSet,
    deleteCard,
    restoreCard,
    resetDeletedCards,
  };
}
