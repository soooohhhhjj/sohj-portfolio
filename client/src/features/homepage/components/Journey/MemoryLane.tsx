import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import MemoryItem from "./MemoryItem";
import MemoryPath from "./MemoryPath";
import JourneyNodeModal from "./JourneyNodeModal";
import { journeyContent } from "./journey.content";
import { useJourneyEditorCardOverrides } from "./hooks/useJourneyEditorCardOverrides";
import { computeJourneyNodes } from "./layout/computeNodes";
import { pickLayout } from "./layout";
import { useContainerSize } from "./layout/useContainerSize";
import { useViewportWidth } from "./layout/useViewportWidth";
import type { Anchor, JourneyItemNode } from "./types/journey.types";

import "./CSS/memoryLane.css";

interface MemoryLaneProps {
  onModalOpenChange?: (isOpen: boolean) => void;
  editorEnabled?: boolean;
  editorActive?: boolean;
}

type NodeLayoutOverride = Partial<{ x: number; y: number; width: number; height: number }>;
type EdgeOverride = Partial<{
  fromAnchor: Anchor;
  toAnchor: Anchor;
  via: { x: number; y: number }[];
}>;

const buildNodeOverrideKey = (layoutId: string) => `journey-editor:${layoutId}:nodes`;
const buildEdgeOverrideKey = (layoutId: string) => `journey-editor:${layoutId}:edges`;
const buildParentCardSizeKey = (layoutId: string) =>
  `journey-editor:${layoutId}:parentCardSize`;
const HUD_POS_STORAGE_KEY = "sohj.debug.journeyEditor.hudPos";
const HUD_MINIMIZED_STORAGE_KEY = "sohj.debug.journeyEditor.hudMinimized";
const DELETED_IDS_STORAGE_KEY = "journey-editor:deletedIds.v1";
const edgeKeyOf = (edge: { from: string; to: string }) => `${edge.from}->${edge.to}`;

const anchorOrder: Anchor[] = ["top", "right", "bottom", "left"];
const cycleAnchor = (value: Anchor) => {
  const idx = anchorOrder.indexOf(value);
  return anchorOrder[(idx + 1) % anchorOrder.length];
};

export default function MemoryLane({
  onModalOpenChange,
  editorEnabled,
  editorActive = true,
}: MemoryLaneProps) {
  const viewportWidth = useViewportWidth();
  const layout = useMemo(() => pickLayout(viewportWidth), [viewportWidth]);

  return (
    <MemoryLaneImpl
      key={layout.id}
      layout={layout}
      onModalOpenChange={onModalOpenChange}
      editorEnabled={editorEnabled}
      editorActive={editorActive}
    />
  );
}

function readLocalStorageJson<T>(key: string, fallback: T): T {
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

function readLocalStorageStringArray(key: string): string[] {
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

function readLocalStorageParentCardSizeOverride(
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

function MemoryLaneImpl({
  onModalOpenChange,
  editorEnabled,
  editorActive = true,
  layout,
}: MemoryLaneProps & { layout: ReturnType<typeof pickLayout> }) {
  const isDev = import.meta.env.DEV;
  const editorToolsEnabled = Boolean(editorEnabled) && isDev;
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const [selectedItem, setSelectedItem] = useState<JourneyItemNode | null>(
    null,
  );
  const [selectedEditorCardId, setSelectedEditorCardId] = useState<string | null>(null);
  const [editorClickMode, setEditorClickMode] = useState<"modal" | "edit">("modal");
  const [parentCardSizes, setParentCardSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [parentCardSizeOverride, setParentCardSizeOverride] = useState<
    { width: number; height: number } | null
  >(() => readLocalStorageParentCardSizeOverride(layout.id));
  const [deletedIds, setDeletedIds] = useState<string[]>(() =>
    readLocalStorageStringArray(DELETED_IDS_STORAGE_KEY),
  );
  const [selectedDeletedId, setSelectedDeletedId] = useState<string>("");

  useEffect(() => {
    onModalOpenChange?.(Boolean(selectedItem));
    return () => onModalOpenChange?.(false);
  }, [onModalOpenChange, selectedItem]);

  const { items, itemMap, edges } = useMemo(
    () => computeJourneyNodes(journeyContent, layout, width),
    [layout, width],
  );
  const scale = useMemo(() => {
    if (!layout.scaleWithContainer) return 1;
    if (!width) return 1;
    return width / layout.canvasWidth;
  }, [layout.canvasWidth, layout.scaleWithContainer, width]);

  const [nodeOverrides, setNodeOverrides] = useState<Record<string, NodeLayoutOverride>>(() =>
    readLocalStorageJson<Record<string, NodeLayoutOverride>>(buildNodeOverrideKey(layout.id), {}),
  );
  const [edgeOverrides, setEdgeOverrides] = useState<Record<string, EdgeOverride>>(() =>
    readLocalStorageJson<Record<string, EdgeOverride>>(buildEdgeOverrideKey(layout.id), {}),
  );
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);
  const [selectedViaIndex, setSelectedViaIndex] = useState<number | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const hudDragRef = useRef<null | {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  }>(null);
  const [hudPos, setHudPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    try {
      const raw = window.localStorage.getItem(HUD_POS_STORAGE_KEY);
      if (!raw) return { x: 0, y: 0 };
      const parsed = JSON.parse(raw) as { x?: number; y?: number };
      if (!parsed || typeof parsed !== "object") return { x: 0, y: 0 };
      return { x: Number(parsed.x ?? 0), y: Number(parsed.y ?? 0) };
    } catch {
      return { x: 0, y: 0 };
    }
  });
  const [hudMinimized, setHudMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(HUD_MINIMIZED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const {
    overrides: cardTextOverrides,
    upsertOverride: upsertCardTextOverride,
    clearOverride: clearCardTextOverride,
    resetAllOverrides: resetAllCardTextOverrides,
  } = useJourneyEditorCardOverrides({ enabled: isDev });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HUD_POS_STORAGE_KEY, JSON.stringify(hudPos));
    } catch {
      // ignore
    }
  }, [hudPos]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HUD_MINIMIZED_STORAGE_KEY, hudMinimized ? "true" : "false");
    } catch {
      // ignore
    }
  }, [hudMinimized]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(deletedIds));
    } catch {
      // ignore
    }
  }, [deletedIds]);

  // state is initialized from localStorage via useState initializers (and the component
  // is keyed by layout.id to ensure a clean re-init whenever the layout switches)

  useEffect(() => {
    try {
      window.localStorage.setItem(buildNodeOverrideKey(layout.id), JSON.stringify(nodeOverrides));
    } catch {
      // ignore write failures
    }
  }, [layout.id, nodeOverrides]);

  const handleEditorClickModeChange = useCallback((next: "modal" | "edit") => {
    setEditorClickMode(next);
    if (next === "modal") {
      setSelectedEditorCardId(null);
      setSelectedEdgeKey(null);
      setSelectedViaIndex(null);
    }
  }, []);

  const scrubLayoutOverridesForDeletedIds = useCallback((ids: string[]) => {
    if (typeof window === "undefined") return;
    if (ids.length === 0) return;

    const idSet = new Set(ids);
    const storage = window.localStorage;

    const nodeKeys = Object.keys(storage).filter(
      (key) => key.startsWith("journey-editor:") && key.endsWith(":nodes"),
    );

    for (const key of nodeKeys) {
      try {
        const raw = storage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
        const record = { ...(parsed as Record<string, unknown>) };
        let changed = false;
        for (const id of ids) {
          if (!(id in record)) continue;
          delete record[id];
          changed = true;
        }
        if (changed) storage.setItem(key, JSON.stringify(record));
      } catch {
        // ignore bad localStorage
      }
    }

    const edgeKeys = Object.keys(storage).filter(
      (key) => key.startsWith("journey-editor:") && key.endsWith(":edges"),
    );

    for (const key of edgeKeys) {
      try {
        const raw = storage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
        const record = { ...(parsed as Record<string, unknown>) };
        let changed = false;

        for (const edgeKey of Object.keys(record)) {
          const [from, to] = edgeKey.split("->");
          if (!from || !to) continue;
          if (!idSet.has(from) && !idSet.has(to)) continue;
          delete record[edgeKey];
          changed = true;
        }

        if (changed) storage.setItem(key, JSON.stringify(record));
      } catch {
        // ignore bad localStorage
      }
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(buildEdgeOverrideKey(layout.id), JSON.stringify(edgeOverrides));
    } catch {
      // ignore write failures
    }
  }, [edgeOverrides, layout.id]);

  useEffect(() => {
    if (!parentCardSizeOverride) return;
    try {
      window.localStorage.setItem(
        buildParentCardSizeKey(layout.id),
        JSON.stringify(parentCardSizeOverride),
      );
    } catch {
      // ignore write failures
    }
  }, [layout.id, parentCardSizeOverride]);

  const effectiveItems = useMemo(() => {
    return items.map((item) => {
      const override = nodeOverrides[item.id];
      const textOverride = cardTextOverrides[item.id];
      const next = override
        ? {
            ...item,
            x: override.x ?? item.x,
            y: override.y ?? item.y,
            width: override.width ?? item.width,
            height: override.height ?? item.height,
          }
        : item;

      return textOverride ? { ...next, ...textOverride } : next;
    });
  }, [cardTextOverrides, items, nodeOverrides]);

  const deletedIdSet = useMemo(() => new Set(deletedIds), [deletedIds]);

  const visibleItems = useMemo(() => {
    if (deletedIdSet.size === 0) return effectiveItems;
    return effectiveItems.filter((item) => !deletedIdSet.has(item.id));
  }, [deletedIdSet, effectiveItems]);

  const effectiveItemMap = useMemo(() => {
    return Object.fromEntries(visibleItems.map((item) => [item.id, item]));
  }, [visibleItems]);

  const templateSize = useMemo(() => {
    const template = effectiveItemMap["node1-c1"] ?? itemMap["node1-c1"];
    if (!template) return null;
    return { width: template.width, height: template.height };
  }, [effectiveItemMap, itemMap]);

  const handleSelectCardInEditor = useCallback(
    (item: JourneyItemNode) => {
      if (!editorToolsEnabled) return;
      if (editorClickMode === "edit") {
        setSelectedEditorCardId(item.id);
        return;
      }
      setSelectedEditorCardId(null);
      setSelectedItem(item);
    },
    [editorClickMode, editorToolsEnabled],
  );

  const selectedEditorCard = useMemo(() => {
    if (!selectedEditorCardId) return null;
    return effectiveItemMap[selectedEditorCardId] ?? null;
  }, [effectiveItemMap, selectedEditorCardId]);

  const renderEdges = useMemo(() => {
    const rendered = edges
      .filter((edge) => Boolean(effectiveItemMap[edge.from]) && Boolean(effectiveItemMap[edge.to]))
      .map((edge) => {
        const key = edgeKeyOf(edge);
        const override = edgeOverrides[key];
        if (!override) return edge;
        return {
          ...edge,
          ...override,
          via: override.via ?? edge.via,
        };
      });

    // Render parent->parent connectors first so they sit visually behind
    // parent->child connectors in the SVG stacking order.
    return rendered.sort((a, b) => {
      const aFrom = effectiveItemMap[a.from];
      const aTo = effectiveItemMap[a.to];
      const bFrom = effectiveItemMap[b.from];
      const bTo = effectiveItemMap[b.to];

      const aIsParentParent = aFrom?.type === "parent" && aTo?.type === "parent";
      const bIsParentParent = bFrom?.type === "parent" && bTo?.type === "parent";
      // Parent->parent should render last (on top).
      return Number(bIsParentParent) - Number(aIsParentParent);
    });
  }, [edgeOverrides, edges, effectiveItemMap]);

  const laneHeight = useMemo(() => {
    const maxItemY = visibleItems.reduce((max, item) => Math.max(max, item.y + item.height), 0);
    const maxViaY = renderEdges.reduce((max, edge) => {
      if (!edge.via || edge.via.length === 0) return max;
      return Math.max(max, ...edge.via.map((point) => point.y));
    }, 0);

    return Math.ceil(Math.max(0, maxItemY, maxViaY));
  }, [renderEdges, visibleItems]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = `${laneHeight}px`;
  }, [laneHeight, ref]);

  useLayoutEffect(() => {
    const lane = ref.current;
    if (!lane) return;

    if (parentCardSizeOverride) {
      lane.style.setProperty(
        "--journey-parent-card-width",
        `${parentCardSizeOverride.width}px`,
      );
      lane.style.setProperty(
        "--journey-parent-card-height",
        `${parentCardSizeOverride.height}px`,
      );
    } else {
      lane.style.removeProperty("--journey-parent-card-width");
      lane.style.removeProperty("--journey-parent-card-height");
    }
  }, [parentCardSizeOverride, ref]);

  useLayoutEffect(() => {
    if (!editorEnabled || !editorActive) return;
    if (!hudRef.current) return;
    hudRef.current.style.transform = `translate(${hudPos.x}px, ${hudPos.y}px)`;
  }, [editorActive, editorEnabled, hudPos.x, hudPos.y]);

  const clampHud = useCallback(
    (next: { x: number; y: number }) => {
      const el = hudRef.current;
      if (!el || typeof window === "undefined") return next;

      const baseLeft = 16;
      const baseTop = 16;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const minX = 8 - baseLeft;
      const maxX = Math.max(minX, vw - (baseLeft + w) - 8);
      const minY = 8 - baseTop;
      const maxY = Math.max(minY, vh - (baseTop + h) - 8);

      return {
        x: Math.min(maxX, Math.max(minX, next.x)),
        y: Math.min(maxY, Math.max(minY, next.y)),
      };
    },
    [],
  );

  const clampHudToViewport = useCallback(() => {
    setHudPos((prev) => {
      const next = clampHud(prev);
      if (next.x === prev.x && next.y === prev.y) return prev;
      return next;
    });
  }, [clampHud]);

  useEffect(() => {
    if (!editorEnabled || !editorActive) return;
    if (typeof window === "undefined") return;

    // Re-clamp when the HUD's dimensions change (e.g. minimize/expand) so it never
    // ends up positioned off-screen.
    const el = hudRef.current;
    if (!el) return;

    const raf = window.requestAnimationFrame(() => clampHudToViewport());

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => clampHudToViewport());
      observer.observe(el);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [clampHudToViewport, editorActive, editorEnabled, hudMinimized, editorClickMode]);

  const handleHudPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!editorEnabled || !editorActive) return;
      if (event.button !== 0) return;
      event.preventDefault();

      hudDragRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: hudPos.x,
        startY: hudPos.y,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [editorActive, editorEnabled, hudPos.x, hudPos.y],
  );

  const handleHudPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!editorEnabled || !editorActive) return;
      const state = hudDragRef.current;
      if (!state) return;
      if (state.pointerId !== event.pointerId) return;

      const dx = event.clientX - state.startClientX;
      const dy = event.clientY - state.startClientY;
      setHudPos(clampHud({ x: Math.round(state.startX + dx), y: Math.round(state.startY + dy) }));
    },
    [clampHud, editorActive, editorEnabled],
  );

  const handleHudPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = hudDragRef.current;
      if (!state) return;
      if (state.pointerId !== event.pointerId) return;
      hudDragRef.current = null;
    },
    [],
  );

  const handleMeasureParent = useCallback(
    (id: string, size: { width: number; height: number }) => {
      setParentCardSizes((prev) => {
        const existing = prev[id];
        if (existing && existing.width === size.width && existing.height === size.height) {
          return prev;
        }
        return { ...prev, [id]: size };
      });
    },
    [],
  );

  const parentChildrenMap = useMemo(() => {
    const map = new Map<string, JourneyItemNode[]>();

    renderEdges.forEach((edge) => {
      const source = effectiveItemMap[edge.from];
      const target = effectiveItemMap[edge.to];

      if (!source || !target) return;
      if (source.type !== "parent") return;
      if (target.type === "parent") return;

      const existing = map.get(source.id) ?? [];
      existing.push(target);
      map.set(source.id, existing);
    });

    return map;
  }, [effectiveItemMap, renderEdges]);

  const handleDeleteCard = useCallback(
    (id: string) => {
      if (!editorToolsEnabled) return;
      const base = effectiveItemMap[id] ?? itemMap[id];
      if (!base) return;

      const ids: string[] = [id];
      if (base.type === "parent") {
        const children = parentChildrenMap.get(id) ?? [];
        for (const child of children) ids.push(child.id);
      }

      const uniqueIds = Array.from(new Set(ids));
      if (typeof window !== "undefined") {
        const ok = window.confirm(
          uniqueIds.length === 1
            ? `Delete ${id}? This removes it across all layouts until restored.`
            : `Delete ${uniqueIds.length} cards (parent + children)? This removes them across all layouts until restored.`,
        );
        if (!ok) return;
      }

      setDeletedIds((prev) => {
        const next = new Set(prev);
        for (const nextId of uniqueIds) next.add(nextId);
        return Array.from(next).sort();
      });

      for (const nextId of uniqueIds) clearCardTextOverride(nextId);

      if (selectedEditorCardId && uniqueIds.includes(selectedEditorCardId)) setSelectedEditorCardId(null);
      if (selectedItem && uniqueIds.includes(selectedItem.id)) setSelectedItem(null);
      if (selectedEdgeKey) {
        const [from, to] = selectedEdgeKey.split("->");
        if (from && to && (uniqueIds.includes(from) || uniqueIds.includes(to))) {
          setSelectedEdgeKey(null);
          setSelectedViaIndex(null);
        }
      }

      setNodeOverrides((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const nextId of uniqueIds) {
          if (!next[nextId]) continue;
          delete next[nextId];
          changed = true;
        }
        return changed ? next : prev;
      });

      setEdgeOverrides((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const edgeKey of Object.keys(next)) {
          const [from, to] = edgeKey.split("->");
          if (!from || !to) continue;
          if (!uniqueIds.includes(from) && !uniqueIds.includes(to)) continue;
          delete next[edgeKey];
          changed = true;
        }
        return changed ? next : prev;
      });

      scrubLayoutOverridesForDeletedIds(uniqueIds);
    },
    [
      clearCardTextOverride,
      editorToolsEnabled,
      effectiveItemMap,
      itemMap,
      parentChildrenMap,
      scrubLayoutOverridesForDeletedIds,
      selectedEditorCardId,
      selectedEdgeKey,
      selectedItem,
    ],
  );

  const handleRestoreDeleted = useCallback((id: string) => {
    setDeletedIds((prev) => prev.filter((value) => value !== id));
    setSelectedDeletedId("");
  }, []);

  const handleRestoreAllDeleted = useCallback(() => {
    setDeletedIds([]);
    setSelectedDeletedId("");
  }, []);

  const selectedParentChildren = useMemo(() => {
    if (!selectedItem || selectedItem.type !== "parent") return [];
    return parentChildrenMap.get(selectedItem.id) ?? [];
  }, [selectedItem, parentChildrenMap]);

  const childParentMap = useMemo(() => {
    const map = new Map<string, string>();

    renderEdges.forEach((edge) => {
      const source = effectiveItemMap[edge.from];
      const target = effectiveItemMap[edge.to];

      if (!source || !target) return;
      if (source.type !== "parent") return;
      if (target.type === "parent") return;

      map.set(target.id, source.id);
    });

    return map;
  }, [effectiveItemMap, renderEdges]);

  const modalNavigationItems = useMemo(
    () =>
      [...visibleItems].sort((a, b) => (a.y - b.y) || (a.x - b.x)),
    [visibleItems],
  );

  const handleCloseModal = () => {
    if (!selectedItem) {
      setSelectedItem(null);
      return;
    }

    const resolveClusterId = (item: JourneyItemNode) =>
      item.type === "parent" ? item.id : (childParentMap.get(item.id) ?? item.id);

    const anchorId =
      selectedItem.type === "parent"
        ? selectedItem.id
        : (childParentMap.get(selectedItem.id) ?? selectedItem.id);
    const anchorItem = effectiveItemMap[anchorId];
    const laneElement = ref.current;

    if (anchorItem && laneElement) {
      const laneTop = laneElement.getBoundingClientRect().top + window.scrollY;
      const viewportTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const centerBandTop = viewportTop + viewportHeight * 0.3;
      const centerBandBottom = viewportTop + viewportHeight * 0.7;

      const isItemInCenterBand = (item: JourneyItemNode) => {
        const itemTop = laneTop + item.y;
        const itemBottom = itemTop + item.height;
        return itemBottom >= centerBandTop && itemTop <= centerBandBottom;
      };

      const centeredItem = visibleItems
        .filter((item) => isItemInCenterBand(item))
        .sort((a, b) => {
          const aCenter = laneTop + a.y + a.height / 2;
          const bCenter = laneTop + b.y + b.height / 2;
          const viewportCenter = viewportTop + viewportHeight / 2;
          return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
        })[0];

      const centeredClusterId = centeredItem ? resolveClusterId(centeredItem) : null;
      const selectedInCenterBand = isItemInCenterBand(selectedItem);

      const shouldJump =
        !selectedInCenterBand && centeredClusterId !== anchorId;

      if (shouldJump) {
        const targetTop = Math.max(0, laneTop + anchorItem.y - 120);
        window.scrollTo({ top: targetTop, behavior: "smooth" });
      }
    }

    setSelectedItem(null);
  };

  const handleEditMove = useCallback((id: string, next: { x: number; y: number }) => {
    if (!ref.current || !width) {
      setNodeOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...next } }));
      return;
    }

    const base = effectiveItemMap[id] ?? itemMap[id];
    if (!base) {
      setNodeOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...next } }));
      return;
    }

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const containerW = width;
    const anchorW = base.width;
    const anchorH = base.height;

    const cardSize =
      base.type === "parent" ? parentCardSizes[id] : { width: base.width, height: base.height };

    const cardW = cardSize?.width ?? base.width;
    const cardH = cardSize?.height ?? base.height;

    const minX =
      base.type === "parent" ? Math.ceil(cardW / 2 - anchorW / 2) : 0;
    const maxX =
      base.type === "parent"
        ? Math.floor(containerW - cardW / 2 - anchorW / 2)
        : Math.floor(containerW - anchorW);

    const minY =
      base.type === "parent" ? Math.ceil(cardH / 2 - anchorH / 2) : 0;
    const maxY = Number.POSITIVE_INFINITY;

    setNodeOverrides((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {}),
        x: clamp(next.x, minX, Math.max(minX, maxX)),
        y: clamp(next.y, minY, Math.max(minY, maxY)),
      },
    }));
  }, [effectiveItemMap, itemMap, parentCardSizes, ref, width]);

  const handleEditResize = useCallback(
    (id: string, next: { x: number; y: number; width: number; height: number }) => {
      if (!ref.current || !width) return;
      const base = effectiveItemMap[id] ?? itemMap[id];
      if (!base) return;

      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

      const containerW = width;
      const minWidth = 220;
      const minHeight = 160;

      const clampedWidth = clamp(next.width, minWidth, Math.floor(containerW - next.x));
      const clampedHeight = clamp(next.height, minHeight, Number.POSITIVE_INFINITY);

      setNodeOverrides((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] ?? {}),
          x: clamp(next.x, 0, containerW - clampedWidth),
          y: clamp(next.y, 0, Number.POSITIVE_INFINITY),
          width: clampedWidth,
          height: clampedHeight,
        },
      }));
    },
    [effectiveItemMap, itemMap, ref, width],
  );

  const handleNudgeSelectedCardSize = useCallback(
    (deltaWidth: number, deltaHeight: number) => {
      if (!editorToolsEnabled) return;
      if (!selectedEditorCardId) return;
      const base = effectiveItemMap[selectedEditorCardId] ?? itemMap[selectedEditorCardId];
      if (!base) return;

      if (base.type === "parent") {
        const clamp = (value: number, min: number, max: number) =>
          Math.min(max, Math.max(min, value));

        const current =
          parentCardSizeOverride ??
          templateSize ??
          parentCardSizes[base.id] ?? { width: 315, height: 243 };

        const minWidth = 240;
        const minHeight = 180;
        const maxWidth =
          typeof window === "undefined"
            ? Number.POSITIVE_INFINITY
            : Math.floor(Math.min(width ?? Number.POSITIVE_INFINITY, window.innerWidth * 0.98));
        const maxHeight =
          typeof window === "undefined" ? Number.POSITIVE_INFINITY : Math.floor(window.innerHeight * 0.9);

        const nextWidth = clamp(Math.round(current.width + deltaWidth), minWidth, maxWidth);
        const nextHeight = clamp(Math.round(current.height + deltaHeight), minHeight, maxHeight);

        if (nextWidth === current.width && nextHeight === current.height) return;
        setParentCardSizeOverride({ width: nextWidth, height: nextHeight });
        return;
      }

      const minWidth = 220;
      const minHeight = 160;
      const maxWidth = width ? Math.floor(width - base.x) : Number.POSITIVE_INFINITY;

      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

      setNodeOverrides((prev) => {
        const current = prev[selectedEditorCardId] ?? {};
        const currentWidth = current.width ?? base.width;
        const currentHeight = current.height ?? base.height;

        const nextWidth = clamp(currentWidth + deltaWidth, minWidth, maxWidth);
        const nextHeight = Math.max(minHeight, currentHeight + deltaHeight);

        if (nextWidth === currentWidth && nextHeight === currentHeight) return prev;

        return {
          ...prev,
          [selectedEditorCardId]: {
            ...current,
            width: nextWidth,
            height: nextHeight,
          },
        };
      });
    },
    [
      editorToolsEnabled,
      effectiveItemMap,
      itemMap,
      parentCardSizeOverride,
      parentCardSizes,
      selectedEditorCardId,
      templateSize,
      width,
    ],
  );

  const handleNudgeSelectedCardPosition = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!editorToolsEnabled) return;
      if (editorClickMode !== "edit") return;
      if (!selectedEditorCardId) return;

      const base = effectiveItemMap[selectedEditorCardId] ?? itemMap[selectedEditorCardId];
      if (!base) return;

      const override = nodeOverrides[selectedEditorCardId] ?? {};
      const currentX = override.x ?? base.x;
      const currentY = override.y ?? base.y;

      handleEditMove(selectedEditorCardId, { x: currentX + deltaX, y: currentY + deltaY });
    },
    [
      editorClickMode,
      editorToolsEnabled,
      effectiveItemMap,
      handleEditMove,
      itemMap,
      nodeOverrides,
      selectedEditorCardId,
    ],
  );

  const handleNudgeSelectedEdgeViaPoints = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!editorToolsEnabled) return;
      if (editorClickMode !== "edit") return;
      if (!selectedEdgeKey) return;
      if (selectedViaIndex == null) return;

      const baseEdge = renderEdges.find((edge) => edgeKeyOf(edge) === selectedEdgeKey);
      if (!baseEdge) return;

      const baseVia = edgeOverrides[selectedEdgeKey]?.via ?? baseEdge.via ?? [];
      if (baseVia.length === 0) return;
      if (selectedViaIndex >= baseVia.length) return;

      const maxX = width ? Math.floor(width) : Number.POSITIVE_INFINITY;

      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

      const nextVia = baseVia.map((point, index) => {
        if (index !== selectedViaIndex) return point;
        return {
          x: clamp(Math.round(point.x + deltaX), 0, maxX),
          y: Math.max(0, Math.round(point.y + deltaY)),
        };
      });

      setEdgeOverrides((prev) => ({
        ...prev,
        [selectedEdgeKey]: {
          ...(prev[selectedEdgeKey] ?? {}),
          via: nextVia,
        },
      }));
    },
    [
      editorClickMode,
      editorToolsEnabled,
      edgeOverrides,
      renderEdges,
      selectedEdgeKey,
      selectedViaIndex,
      width,
    ],
  );

  useEffect(() => {
    if (!editorToolsEnabled) return;
    if (!editorActive) return;
    if (editorClickMode !== "edit") return;

    const shouldIgnoreTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (shouldIgnoreTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          handleNudgeSelectedCardPosition(1, 0);
          break;
        case "ArrowLeft":
          event.preventDefault();
          handleNudgeSelectedCardPosition(-1, 0);
          break;
        case "ArrowDown":
          event.preventDefault();
          handleNudgeSelectedCardPosition(0, 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          handleNudgeSelectedCardPosition(0, -1);
          break;
        case "w":
        case "W":
          event.preventDefault();
          if (selectedViaIndex != null) handleNudgeSelectedEdgeViaPoints(0, -1);
          else handleNudgeSelectedCardSize(0, -1);
          break;
        case "a":
        case "A":
          event.preventDefault();
          if (selectedViaIndex != null) handleNudgeSelectedEdgeViaPoints(-1, 0);
          else handleNudgeSelectedCardSize(-1, 0);
          break;
        case "s":
        case "S":
          event.preventDefault();
          if (selectedViaIndex != null) handleNudgeSelectedEdgeViaPoints(0, 1);
          else handleNudgeSelectedCardSize(0, 1);
          break;
        case "d":
        case "D":
          event.preventDefault();
          if (selectedViaIndex != null) handleNudgeSelectedEdgeViaPoints(1, 0);
          else handleNudgeSelectedCardSize(1, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    editorActive,
    editorClickMode,
    editorToolsEnabled,
    handleNudgeSelectedCardPosition,
    handleNudgeSelectedCardSize,
    handleNudgeSelectedEdgeViaPoints,
    selectedViaIndex,
  ]);

  const handleSelectEdge = useCallback(
    (edgeKey: string, event: ReactPointerEvent<SVGPathElement>) => {
      if (!editorEnabled) return;

      // Shift "focus" to edge editing so keyboard nudges affect the edge/points,
      // not the previously selected card.
      if (selectedEditorCardId) setSelectedEditorCardId(null);
      setSelectedEdgeKey(edgeKey);
      setSelectedViaIndex(null);

      // Seed overrides with base via points so they become draggable immediately.
      setEdgeOverrides((prev) => {
        if (prev[edgeKey]?.via) return prev;
        const base = edges.find((edge) => edgeKeyOf(edge) === edgeKey);
        if (!base?.via || base.via.length === 0) return prev;
        return { ...prev, [edgeKey]: { ...(prev[edgeKey] ?? {}), via: base.via.map((p) => ({ ...p })) } };
      });

      if (!event.shiftKey) return;

      const lane = ref.current;
      if (!lane) return;

      const rect = lane.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);

      setEdgeOverrides((prev) => {
        const base = prev[edgeKey] ?? {};
        const baseEdge = edges.find((edge) => edgeKeyOf(edge) === edgeKey);
        const existing = base.via ?? baseEdge?.via ?? [];
        const nextVia = [...existing, { x, y }];
        return { ...prev, [edgeKey]: { ...base, via: nextVia } };
      });
    },
    [editorEnabled, edges, ref, selectedEditorCardId],
  );

  const handleMoveViaPoint = useCallback(
    (edgeKey: string, index: number, next: { x: number; y: number }) => {
      setEdgeOverrides((prev) => {
        const base = prev[edgeKey] ?? {};
        const via = [...(base.via ?? [])];
        if (!via[index]) return prev;
        via[index] = next;
        return { ...prev, [edgeKey]: { ...base, via } };
      });
    },
    [],
  );

  const handleRemoveViaPoint = useCallback((edgeKey: string, index: number) => {
    setEdgeOverrides((prev) => {
      const base = prev[edgeKey];
      if (!base?.via) return prev;
      const nextVia = base.via.filter((_, i) => i !== index);
      return { ...prev, [edgeKey]: { ...base, via: nextVia } };
    });
  }, []);

  const selectedRenderEdge = useMemo(() => {
    if (!selectedEdgeKey) return null;
    return renderEdges.find((edge) => edgeKeyOf(edge) === selectedEdgeKey) ?? null;
  }, [renderEdges, selectedEdgeKey]);

  const selectedVia = selectedRenderEdge?.via ?? [];

  const getEdgeAnchorPoint = useCallback(
    (itemId: string, anchor: Anchor) => {
      const item = effectiveItemMap[itemId] ?? itemMap[itemId];
      if (!item) return null;

      const base = { x: item.x, y: item.y, width: item.width, height: item.height ?? 0 };
      const parentSize = item.type === "parent" ? parentCardSizes[item.id] : undefined;

      const centerX = base.x + base.width / 2;
      const centerY = base.y + base.height / 2;
      const width = parentSize?.width ?? base.width;
      const height = parentSize?.height ?? base.height;
      const x = centerX - width / 2;
      const y = centerY - height / 2;

      switch (anchor) {
        case "top":
          return { x: x + width / 2, y };
        case "bottom":
          return { x: x + width / 2, y: y + height };
        case "left":
          return { x, y: y + height / 2 };
        case "right":
          return { x: x + width, y: y + height / 2 };
      }
    },
    [effectiveItemMap, itemMap, parentCardSizes],
  );

  const handleOrthogonalizeSelectedEdge = useCallback(() => {
    if (!selectedRenderEdge || !selectedEdgeKey) return;

    const start = getEdgeAnchorPoint(selectedRenderEdge.from, selectedRenderEdge.fromAnchor);
    const end = getEdgeAnchorPoint(selectedRenderEdge.to, selectedRenderEdge.toAnchor);
    if (!start || !end) return;

    const via = selectedRenderEdge.via ?? [];
    if (via.length === 0) return;

    const snapped = via.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));

    const snapTowards = (
      point: { x: number; y: number },
      target: { x: number; y: number },
    ) => {
      const dx = point.x - target.x;
      const dy = point.y - target.y;
      // If this segment is "mostly horizontal", snap Y; otherwise snap X.
      return Math.abs(dx) >= Math.abs(dy)
        ? { x: point.x, y: target.y }
        : { x: target.x, y: point.y };
    };

    // Forward pass: make each segment from previous point axis-aligned.
    let prev = start;
    for (let i = 0; i < snapped.length; i++) {
      snapped[i] = snapTowards(snapped[i], prev);
      prev = snapped[i];
    }

    // Backward pass: also align the final segment into the end anchor cleanly.
    let next = end;
    for (let i = snapped.length - 1; i >= 0; i--) {
      snapped[i] = snapTowards(snapped[i], next);
      next = snapped[i];
    }

    setEdgeOverrides((prevOverrides) => ({
      ...prevOverrides,
      [selectedEdgeKey]: { ...(prevOverrides[selectedEdgeKey] ?? {}), via: snapped },
    }));
  }, [getEdgeAnchorPoint, selectedEdgeKey, selectedRenderEdge]);

  const handleResetEdits = useCallback(() => {
    setNodeOverrides({});
    setEdgeOverrides({});
    setSelectedEdgeKey(null);
    setParentCardSizeOverride(null);
    try {
      window.localStorage.removeItem(buildNodeOverrideKey(layout.id));
      window.localStorage.removeItem(buildEdgeOverrideKey(layout.id));
      window.localStorage.removeItem(buildParentCardSizeKey(layout.id));
    } catch {
      // ignore
    }
  }, [layout.id]);

  const selectedEditorCardSize = useMemo(() => {
    if (!selectedEditorCard) return null;

    if (selectedEditorCard.type === "parent") {
      const size =
        parentCardSizes[selectedEditorCard.id] ??
        parentCardSizeOverride ??
        templateSize ??
        { width: 315, height: 243 };
      return { width: Math.round(size.width), height: Math.round(size.height) };
    }

    return {
      width: Math.round(selectedEditorCard.width),
      height: Math.round(selectedEditorCard.height),
    };
  }, [parentCardSizeOverride, parentCardSizes, selectedEditorCard, templateSize]);

  const handleMatchAllToTemplate = useCallback(() => {
    if (!templateSize) return;

    setParentCardSizeOverride(templateSize);

    // Apply the template size to all non-parent cards. Parent cards are controlled by CSS vars.
    setNodeOverrides((prev) => {
      const next: Record<string, NodeLayoutOverride> = { ...prev };
      for (const item of items) {
        if (item.type === "parent") continue;
        next[item.id] = {
          ...(next[item.id] ?? {}),
          width: templateSize.width,
          height: templateSize.height,
        };
      }
      return next;
    });
  }, [items, templateSize]);

  const handleCopyEdits = useCallback(async () => {
    const unscaled = Object.fromEntries(
      Object.entries(nodeOverrides).map(([id, pos]) => [
        id,
        {
          x: pos.x == null ? undefined : Math.round(pos.x / scale),
          y: pos.y == null ? undefined : Math.round(pos.y / scale),
          width: pos.width == null ? undefined : Math.round(pos.width / scale),
          height: pos.height == null ? undefined : Math.round(pos.height / scale),
        },
      ]),
    );

    const edgePayload = Object.fromEntries(
      Object.entries(edgeOverrides).map(([key, value]) => [
        key,
        {
          ...value,
          via: value.via
            ? value.via.map((p) => ({
                x: Math.round(p.x / scale),
                y: Math.round(p.y / scale),
              }))
            : undefined,
        },
      ]),
    );

    const payload = {
      layoutId: layout.id,
      canvasWidth: layout.canvasWidth,
      nodes: unscaled,
      edges: edgePayload,
      parentCardSize: parentCardSizeOverride ?? undefined,
    };

    const text = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard can fail on some environments; nothing else to do without UX.
    }
  }, [edgeOverrides, layout.canvasWidth, layout.id, nodeOverrides, parentCardSizeOverride, scale]);

  const laneClickStateRef = useRef<null | {
    pointerId: number;
    startClientX: number;
    startClientY: number;
  }>(null);

  return (
    <div
      ref={ref}
      className="memory-lane relative w-full"
      onPointerDown={(event) => {
        if (!editorToolsEnabled) return;
        if (event.button !== 0) return;
        if (event.currentTarget !== event.target) return;
        laneClickStateRef.current = {
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
        };
      }}
      onPointerUp={(event) => {
        if (!editorToolsEnabled) return;
        const state = laneClickStateRef.current;
        if (!state) return;
        if (state.pointerId !== event.pointerId) return;
        laneClickStateRef.current = null;
        if (event.currentTarget !== event.target) return;

        const dx = Math.abs(event.clientX - state.startClientX);
        const dy = Math.abs(event.clientY - state.startClientY);
        if (dx > 3 || dy > 3) return;

        handleEditorClickModeChange("modal");
      }}
    >
      {editorEnabled ? <div className="journey-editor-grid" /> : null}

      <svg
        className={`absolute inset-0 z-0 w-full h-full base-text-color ${
          editorEnabled ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {renderEdges.map((edge) => (
          <MemoryPath
            key={edgeKeyOf(edge)}
            edge={edge}
            items={effectiveItemMap}
            parentCardSizes={parentCardSizes}
            editorEnabled={editorEnabled}
            isSelected={selectedEdgeKey === edgeKeyOf(edge)}
            onSelectEdge={handleSelectEdge}
          />
        ))}

        {editorEnabled && selectedEdgeKey && selectedVia.length > 0
          ? selectedVia.map((point, index) => (
              <circle
                key={`${selectedEdgeKey}-via-${index}`}
                cx={point.x}
                cy={point.y}
                r={index === selectedViaIndex ? 7 : 6}
                fill={
                  index === selectedViaIndex
                    ? "rgba(52, 211, 153, 0.5)"
                    : "rgba(52, 211, 153, 0.35)"
                }
                stroke="rgba(52, 211, 153, 0.9)"
                strokeWidth={index === selectedViaIndex ? 1.6 : 1.2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  if (selectedEditorCardId) setSelectedEditorCardId(null);
                  setSelectedViaIndex(index);
                  if (event.altKey) {
                    handleRemoveViaPoint(selectedEdgeKey, index);
                    return;
                  }

                  const lane = ref.current;
                  if (!lane) return;
                  const rect = lane.getBoundingClientRect();
                  const startX = event.clientX;
                  const startY = event.clientY;
                  const start = { x: point.x, y: point.y };

                  const move = (moveEvent: PointerEvent) => {
                    const x = Math.round(start.x + (moveEvent.clientX - startX));
                    const y = Math.round(start.y + (moveEvent.clientY - startY));
                    handleMoveViaPoint(selectedEdgeKey, index, {
                      x: Math.max(0, Math.min(rect.width, x)),
                      y: Math.max(0, y),
                    });
                  };

                  const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                  };

                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up, { once: true });
                }}
              />
            ))
          : null}
      </svg>

      {visibleItems.map((item) => (
        <MemoryItem
          key={item.id}
          {...item}
          onSelect={editorEnabled ? handleSelectCardInEditor : setSelectedItem}
          onMeasure={handleMeasureParent}
          editorEnabled={editorEnabled}
          onEditMove={handleEditMove}
          onEditResize={handleEditResize}
        />
      ))}

      {editorEnabled && editorActive && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={(node) => {
                hudRef.current = node;
              }}
              className={`journey-editor-hud ${hudMinimized ? "journey-editor-hud--minimized" : ""}`}
            >
              <div
                className="journey-editor-hud__drag-grip"
                onPointerDown={handleHudPointerDown}
                onPointerMove={handleHudPointerMove}
                onPointerUp={handleHudPointerUp}
                aria-label="Drag editor panel"
                role="presentation"
              />

              <div className="journey-editor-hud__title-row">
                <div className="journey-editor-hud__title">Journey Edit Mode</div>
                <div className="journey-editor-hud__title-actions">
                  <button
                    type="button"
                    className="journey-editor-hud__mini-toggle"
                    onClick={() => setHudMinimized((prev) => !prev)}
                    aria-label={hudMinimized ? "Expand editor panel" : "Minimize editor panel"}
                  >
                    {hudMinimized ? "Expand" : "Minimize"}
                  </button>
                </div>
              </div>

              <div className="journey-editor-hud__mode-row">
                <label className="journey-editor-hud__label" htmlFor="journey-editor-click-mode">
                  Click
                </label>
                <select
                  id="journey-editor-click-mode"
                  className="journey-editor-hud__select"
                  value={editorClickMode}
                  onChange={(event) =>
                    handleEditorClickModeChange(event.target.value as "modal" | "edit")
                  }
                >
                  <option value="modal">Modal</option>
                  <option value="edit">Edit</option>
                </select>
              </div>

              {hudMinimized ? (
                <div className="journey-editor-hud__mini-meta" aria-label="Selection summary">
                  <div className="journey-editor-hud__mini-meta-row">
                    <span className="journey-editor-hud__mini-meta-key">Card</span>
                    <span className="journey-editor-hud__mini-meta-value">
                      {selectedEditorCard?.id ?? "none"}
                    </span>
                  </div>
                  <div className="journey-editor-hud__mini-meta-row">
                    <span className="journey-editor-hud__mini-meta-key">Size</span>
                    <span className="journey-editor-hud__mini-meta-value">
                      {selectedEditorCardSize
                        ? `${selectedEditorCardSize.width}x${selectedEditorCardSize.height}`
                        : "n/a"}
                    </span>
                  </div>
                </div>
              ) : null}

              {hudMinimized && selectedRenderEdge ? (
                <div className="journey-editor-hud__mini-actions">
                  <button type="button" onClick={handleOrthogonalizeSelectedEdge}>
                    Ortho
                  </button>
                </div>
              ) : null}

              {!hudMinimized ? (
                <div className="journey-editor-hud__meta">
                  <span>layout: {layout.id}</span>
                  <span>container: {Math.round(width ?? 0)}px</span>
                  <span>scale: {scale.toFixed(3)}</span>
                  <span>
                    template:{" "}
                    {templateSize ? `${templateSize.width}x${templateSize.height}` : "n/a"}
                  </span>
                  <span>edge: {selectedEdgeKey ?? "none"}</span>
                </div>
              ) : null}

              {!hudMinimized && editorClickMode === "edit" ? (
                <div className="journey-editor-hud__card-editor">
                <div className="journey-editor-hud__card-row">
                  <label className="journey-editor-hud__label" htmlFor="journey-editor-selected-card">
                    Card
                  </label>
                  <select
                    id="journey-editor-selected-card"
                    className="journey-editor-hud__select"
                    value={selectedEditorCardId ?? ""}
                    onChange={(event) => setSelectedEditorCardId(event.target.value || null)}
                  >
                    <option value="">(click a card)</option>
                    {visibleItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id} • {item.title ?? (item.type === "parent" ? "Parent" : "Card")}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEditorCard ? (
                  <>
                    <div className="journey-editor-hud__field">
                      <label className="journey-editor-hud__label" htmlFor="journey-editor-card-title">
                        Title
                      </label>
                      <input
                        id="journey-editor-card-title"
                        className="journey-editor-hud__input"
                        value={selectedEditorCard.title ?? ""}
                        onChange={(event) =>
                          upsertCardTextOverride(selectedEditorCard.id, {
                            title: event.target.value,
                          })
                        }
                        placeholder="Title…"
                      />
                    </div>

                    {selectedEditorCard.type === "parent" ? (
                      <div className="journey-editor-hud__field">
                        <label
                          className="journey-editor-hud__label"
                          htmlFor="journey-editor-card-modal-details"
                        >
                          Summary
                        </label>
                        <textarea
                          id="journey-editor-card-modal-details"
                          className="journey-editor-hud__textarea"
                          value={selectedEditorCard.modalDetails ?? ""}
                          onChange={(event) =>
                            upsertCardTextOverride(selectedEditorCard.id, {
                              modalDetails: event.target.value,
                            })
                          }
                          placeholder="Parent summary…"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <div className="journey-editor-hud__field">
                        <label className="journey-editor-hud__label" htmlFor="journey-editor-card-details">
                          Details
                        </label>
                        <textarea
                          id="journey-editor-card-details"
                          className="journey-editor-hud__textarea"
                          value={selectedEditorCard.details ?? ""}
                          onChange={(event) =>
                            upsertCardTextOverride(selectedEditorCard.id, {
                              details: event.target.value,
                            })
                          }
                          placeholder="Child details…"
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="journey-editor-hud__card-actions">
                      <button
                        type="button"
                        onClick={() => clearCardTextOverride(selectedEditorCard.id)}
                      >
                        Clear Text
                      </button>
                      <button type="button" onClick={resetAllCardTextOverrides}>
                        Reset Text (All)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(selectedEditorCard.id)}
                      >
                        Delete Card
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="journey-editor-hud__hint">Click a card (or pick one) to edit its text.</div>
                )}
              </div>
              ) : null}

              {!hudMinimized && editorClickMode === "edit" && deletedIds.length > 0 ? (
                <div className="journey-editor-hud__deleted">
                  <div className="journey-editor-hud__card-row">
                    <label className="journey-editor-hud__label" htmlFor="journey-editor-deleted-card">
                      Deleted
                    </label>
                    <select
                      id="journey-editor-deleted-card"
                      className="journey-editor-hud__select"
                      value={selectedDeletedId}
                      onChange={(event) => setSelectedDeletedId(event.target.value)}
                    >
                      <option value="">(select)</option>
                      {deletedIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="journey-editor-hud__card-actions">
                    <button
                      type="button"
                      disabled={!selectedDeletedId}
                      onClick={() => selectedDeletedId && handleRestoreDeleted(selectedDeletedId)}
                    >
                      Restore
                    </button>
                    <button type="button" onClick={handleRestoreAllDeleted}>
                      Restore All
                    </button>
                  </div>
                </div>
              ) : null}

      {!hudMinimized && selectedRenderEdge ? (
        <div className="journey-editor-hud__edge">
          <button
            type="button"
                    onClick={() => {
                      const key = selectedEdgeKey;
                      if (!key) return;
                      const current = (selectedRenderEdge.fromAnchor as Anchor) ?? "bottom";
                      setEdgeOverrides((prev) => ({
                        ...prev,
                        [key]: { ...(prev[key] ?? {}), fromAnchor: cycleAnchor(current) },
                      }));
                    }}
                  >
                    From: {selectedRenderEdge.fromAnchor}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const key = selectedEdgeKey;
                      if (!key) return;
                      const current = (selectedRenderEdge.toAnchor as Anchor) ?? "top";
                      setEdgeOverrides((prev) => ({
                        ...prev,
                        [key]: { ...(prev[key] ?? {}), toAnchor: cycleAnchor(current) },
                      }));
                    }}
          >
            To: {selectedRenderEdge.toAnchor}
          </button>
          <button type="button" onClick={handleOrthogonalizeSelectedEdge}>
            Orthogonalize
          </button>
          <div className="journey-editor-hud__hint">
            Shift-click a line to add a point. Alt-click a point to remove. Orthogonalize snaps segments to true horizontal/vertical.
          </div>
        </div>
      ) : null}

              {!hudMinimized ? (
                <div className="journey-editor-hud__actions">
                <button type="button" onClick={handleCopyEdits}>
                  Copy Layout JSON
                </button>
                <button type="button" onClick={handleMatchAllToTemplate}>
                  Match All to node1-c1
                </button>
                <button type="button" onClick={handleResetEdits}>
                  Reset
                </button>
                <button type="button" onClick={() => setHudPos({ x: 0, y: 0 })}>
                  HUD Reset
                </button>
              </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}

      <JourneyNodeModal
        item={selectedItem}
        parentChildren={selectedParentChildren}
        navigationItems={modalNavigationItems}
        onClose={handleCloseModal}
        onSelectItem={setSelectedItem}
      />
    </div>
  );
}
