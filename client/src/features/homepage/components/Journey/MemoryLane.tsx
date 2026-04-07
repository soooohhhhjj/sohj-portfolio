import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import JourneyNodeModal from "./JourneyNodeModal";
import { journeyContent } from "./journey.content";
import { useJourneyEditorCardOverrides } from "./hooks/useJourneyEditorCardOverrides";
import { computeJourneyNodes } from "./layout/computeNodes";
import { pickLayout } from "./layout";
import {
  DEFAULT_MOBILE_GAPS,
  createLayoutMobile,
  type JourneyStackedGapOverrides,
} from "./layout/layout.mobile";
import {
  DEFAULT_MOBILE_SM_GAPS,
  createLayoutMobileSm,
  type JourneyStackedGapOverridesSm,
} from "./layout/layout.mobile.sm";
import { useContainerSize } from "./layout/useContainerSize";
import { useViewportWidth } from "./layout/useViewportWidth";
import type { Anchor, JourneyItemNode } from "./types/journey.types";
import { JourneyEdgeLayer } from "./ui/JourneyEdgeLayer";
import { JourneyEditorHudPortal } from "./ui/JourneyEditorHudPortal";
import { JourneyItemsLayer } from "./ui/JourneyItemsLayer";
import {
  buildEdgeOverrideKey,
  buildGapOverrideKey,
  buildNodeOverrideKey,
  buildParentCardSizeKey,
  DELETED_IDS_STORAGE_KEY,
  HUD_MINIMIZED_STORAGE_KEY,
  HUD_POS_STORAGE_KEY,
  readLocalStorageJson,
  readLocalStorageParentCardSizeOverride,
  readLocalStorageStringArray,
  type EdgeOverride,
  type NodeLayoutOverride,
} from "./utils/journeyEditorStorage";

import "./CSS/memoryLane.css";

interface MemoryLaneProps {
  onModalOpenChange?: (isOpen: boolean) => void;
  editorEnabled?: boolean;
  editorActive?: boolean;
}

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

function MemoryLaneImpl({
  onModalOpenChange,
  editorEnabled,
  editorActive = true,
  layout,
}: MemoryLaneProps & { layout: ReturnType<typeof pickLayout> }) {
  const isDev = import.meta.env.DEV;
  const editorToolsEnabled = Boolean(editorEnabled) && isDev;
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const isStackedMobileLayout = layout.id === "mobile" || layout.id === "mobile-sm";

  const parentIdSet = useMemo(() => {
    return new Set(journeyContent.filter((item) => item.type === "parent").map((item) => item.id));
  }, []);

  const [deletedIds, setDeletedIds] = useState<string[]>(() =>
    readLocalStorageStringArray(DELETED_IDS_STORAGE_KEY),
  );

  const deletedIdSet = useMemo(() => {
    if (deletedIds.length === 0) return new Set<string>();

    const expanded = new Set(deletedIds);

    for (const id of deletedIds) {
      if (!parentIdSet.has(id)) continue;
      const prefix = `${id}-`;
      for (const item of journeyContent) {
        if (item.type === "parent") continue;
        if (!item.id.startsWith(prefix)) continue;
        expanded.add(item.id);
      }
    }

    return expanded;
  }, [deletedIds, parentIdSet]);

  const gapDefaults = useMemo(() => {
    if (layout.id === "mobile") return DEFAULT_MOBILE_GAPS;
    if (layout.id === "mobile-sm") return DEFAULT_MOBILE_SM_GAPS;
    return null;
  }, [layout.id]);

  const [gapOverrides, setGapOverrides] = useState<
    Partial<Pick<JourneyStackedGapOverrides, "parentToChildGap" | "parentToParentGap">>
  >(() => {
    if (!isStackedMobileLayout) return {};

    const raw = readLocalStorageJson<Record<string, unknown>>(
      buildGapOverrideKey(layout.id),
      {},
    );

    const normalize = (value: unknown) => {
      const next = Number(value);
      if (!Number.isFinite(next) || next < 0) return undefined;
      return Math.round(next);
    };

    const next: Partial<Pick<JourneyStackedGapOverrides, "parentToChildGap" | "parentToParentGap">> =
      {};

    const parentToChildGap = normalize(raw.parentToChildGap);
    const parentToParentGap = normalize(raw.parentToParentGap);

    if (parentToChildGap !== undefined) next.parentToChildGap = parentToChildGap;
    if (parentToParentGap !== undefined) next.parentToParentGap = parentToParentGap;

    return next;
  });

  useEffect(() => {
    if (!isStackedMobileLayout) return;
    if (typeof window === "undefined") return;

    const key = buildGapOverrideKey(layout.id);
    const payload: Record<string, number> = {};

    if (gapOverrides.parentToChildGap !== undefined) {
      payload.parentToChildGap = gapOverrides.parentToChildGap;
    }
    if (gapOverrides.parentToParentGap !== undefined) {
      payload.parentToParentGap = gapOverrides.parentToParentGap;
    }

    try {
      if (Object.keys(payload).length === 0) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [gapOverrides.parentToChildGap, gapOverrides.parentToParentGap, isStackedMobileLayout, layout.id]);

  const resolvedLayout = useMemo(() => {
    if (layout.id === "mobile") {
      const parentToChildGap =
        gapOverrides.parentToChildGap ?? (editorToolsEnabled ? 0 : undefined);
      const parentToParentGap =
        gapOverrides.parentToParentGap ?? (editorToolsEnabled ? 0 : undefined);
      return createLayoutMobile({
        parentToChildGap,
        childToChildGap: parentToChildGap,
        parentToParentGap,
      }, { excludedIds: deletedIdSet });
    }

    if (layout.id === "mobile-sm") {
      const parentToChildGap =
        gapOverrides.parentToChildGap ?? (editorToolsEnabled ? 0 : undefined);
      const parentToParentGap =
        gapOverrides.parentToParentGap ?? (editorToolsEnabled ? 0 : undefined);
      return createLayoutMobileSm({
        parentToChildGap,
        childToChildGap: parentToChildGap,
        parentToParentGap,
      } satisfies JourneyStackedGapOverridesSm, { excludedIds: deletedIdSet });
    }

    return layout;
  }, [deletedIdSet, editorToolsEnabled, gapOverrides.parentToChildGap, gapOverrides.parentToParentGap, layout]);

  const effectiveParentToChildGap = useMemo(() => {
    if (!gapDefaults) return null;
    if (gapOverrides.parentToChildGap !== undefined) return gapOverrides.parentToChildGap;
    return editorToolsEnabled ? 0 : gapDefaults.parentToChildGap;
  }, [editorToolsEnabled, gapDefaults, gapOverrides.parentToChildGap]);

  const effectiveParentToParentGap = useMemo(() => {
    if (!gapDefaults) return null;
    if (gapOverrides.parentToParentGap !== undefined) return gapOverrides.parentToParentGap;
    return editorToolsEnabled ? 0 : gapDefaults.parentToParentGap;
  }, [editorToolsEnabled, gapDefaults, gapOverrides.parentToParentGap]);
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
  >(() => (isStackedMobileLayout ? null : readLocalStorageParentCardSizeOverride(layout.id)));
  const [selectedDeletedId, setSelectedDeletedId] = useState<string>("");

  useEffect(() => {
    onModalOpenChange?.(Boolean(selectedItem));
    return () => onModalOpenChange?.(false);
  }, [onModalOpenChange, selectedItem]);

  const { items, itemMap, edges } = useMemo(
    () => computeJourneyNodes(journeyContent, resolvedLayout, width),
    [resolvedLayout, width],
  );
  const scale = useMemo(() => {
    if (!resolvedLayout.scaleWithContainer) return 1;
    if (!width) return 1;
    return width / resolvedLayout.canvasWidth;
  }, [resolvedLayout.canvasWidth, resolvedLayout.scaleWithContainer, width]);

  const [nodeOverrides, setNodeOverrides] = useState<Record<string, NodeLayoutOverride>>(() => {
    const raw = readLocalStorageJson<Record<string, NodeLayoutOverride>>(
      buildNodeOverrideKey(layout.id),
      {},
    );

    if (!isStackedMobileLayout) return raw;

    const parentIds = new Set(journeyContent.filter((item) => item.type === "parent").map((item) => item.id));
    const next: Record<string, NodeLayoutOverride> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (parentIds.has(key)) continue;
      next[key] = value;
    }
    return next;
  });

  useEffect(() => {
    if (!isStackedMobileLayout) return;
    if (typeof window === "undefined") return;

    const key = buildNodeOverrideKey(layout.id);
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;

      const parentIds = new Set(
        journeyContent.filter((item) => item.type === "parent").map((item) => item.id),
      );

      let changed = false;
      const record = { ...(parsed as Record<string, unknown>) };
      for (const id of parentIds) {
        if (!(id in record)) continue;
        delete record[id];
        changed = true;
      }

      if (!changed) return;
      window.localStorage.setItem(key, JSON.stringify(record));
    } catch {
      // ignore bad localStorage
    }
  }, [isStackedMobileLayout, layout.id]);
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
      if (isStackedMobileLayout) {
        const parentIds = new Set(
          journeyContent.filter((item) => item.type === "parent").map((item) => item.id),
        );
        const next: Record<string, NodeLayoutOverride> = {};
        for (const [key, value] of Object.entries(nodeOverrides)) {
          if (parentIds.has(key)) continue;
          next[key] = value;
        }
        window.localStorage.setItem(buildNodeOverrideKey(layout.id), JSON.stringify(next));
        return;
      }

      window.localStorage.setItem(buildNodeOverrideKey(layout.id), JSON.stringify(nodeOverrides));
    } catch {
      // ignore write failures
    }
  }, [isStackedMobileLayout, layout.id, nodeOverrides]);

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
      if (isStackedMobileLayout) return;
      window.localStorage.setItem(
        buildParentCardSizeKey(layout.id),
        JSON.stringify(parentCardSizeOverride),
      );
    } catch {
      // ignore write failures
    }
  }, [isStackedMobileLayout, layout.id, parentCardSizeOverride]);

  const effectiveItems = useMemo(() => {
    return items.map((item) => {
      const override = nodeOverrides[item.id];
      const textOverride = cardTextOverrides[item.id];

      const base = override
        ? {
            ...item,
            x: override.x ?? item.x,
            y: override.y ?? item.y,
            width: override.width ?? item.width,
            height: override.height ?? item.height,
          }
        : item;

      const merged = textOverride ? { ...base, ...textOverride } : base;
      return merged;
    });
  }, [cardTextOverrides, items, nodeOverrides]);

  const visibleItemsBase = useMemo(() => {
    if (deletedIdSet.size === 0) return effectiveItems;
    return effectiveItems.filter((item) => !deletedIdSet.has(item.id));
  }, [deletedIdSet, effectiveItems]);

  const visibleItems = useMemo(() => {
    if (!isStackedMobileLayout) return visibleItemsBase;
    if (visibleItemsBase.length === 0) return visibleItemsBase;

    const sorted = [...visibleItemsBase].sort((a, b) => (a.y - b.y) || (a.x - b.x));

    const baseGapAfter: Record<string, number> = {};
    for (let idx = 1; idx < sorted.length; idx++) {
      const prev = sorted[idx - 1];
      const next = sorted[idx];
      baseGapAfter[prev.id] = next.y - (prev.y + prev.height);
    }

    const computed = new Map<string, JourneyItemNode>();
    let cursorY = sorted[0].y;
    for (let idx = 0; idx < sorted.length; idx++) {
      const item = sorted[idx];
      if (idx === 0) cursorY = item.y;
      else {
        const prev = sorted[idx - 1];
        const prevComputed = computed.get(prev.id) ?? prev;
        const gap = baseGapAfter[prev.id] ?? 0;
        cursorY = prevComputed.y + prevComputed.height + gap;
      }

      let nextHeight = item.height;
      if (item.type === "parent") {
        const measured = parentCardSizes[item.id]?.height;
        if (Number.isFinite(measured) && measured) {
          nextHeight = Math.max(0, Math.round(measured));
        }
      }

      computed.set(item.id, { ...item, y: cursorY, height: nextHeight });
    }

    return visibleItemsBase.map((item) => computed.get(item.id) ?? item);
  }, [isStackedMobileLayout, parentCardSizes, visibleItemsBase]);

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

  const handleItemSelect = useCallback(
    (item: JourneyItemNode) => {
      if (editorEnabled) {
        handleSelectCardInEditor(item);
        return;
      }
      setSelectedItem(item);
    },
    [editorEnabled, handleSelectCardInEditor],
  );

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

    if (isStackedMobileLayout) {
      lane.style.removeProperty("--journey-parent-card-width");
      lane.style.removeProperty("--journey-parent-card-height");
      return;
    }

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
  }, [isStackedMobileLayout, parentCardSizeOverride, ref]);

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

  const childParentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of Object.values(effectiveItemMap)) {
      if (item.type === "parent") continue;
      const parentId = item.id.split("-")[0];
      if (!parentId || !parentIdSet.has(parentId)) continue;
      map.set(item.id, parentId);
    }
    return map;
  }, [effectiveItemMap, parentIdSet]);

  const parentChildrenMap = useMemo(() => {
    const map = new Map<string, JourneyItemNode[]>();

    for (const item of Object.values(effectiveItemMap)) {
      if (item.type === "parent") continue;
      const parentId = childParentMap.get(item.id);
      if (!parentId) continue;
      const existing = map.get(parentId) ?? [];
      existing.push(item);
      map.set(parentId, existing);
    }

    for (const [key, children] of map.entries()) {
      map.set(key, [...children].sort((a, b) => (a.y - b.y) || (a.x - b.x)));
    }

    return map;
  }, [childParentMap, effectiveItemMap]);

  const handleDeleteCard = useCallback(
    (id: string) => {
      if (!editorToolsEnabled) return;
      const base = effectiveItemMap[id] ?? itemMap[id];
      if (!base) return;

      const ids: string[] = [id];
      if (base.type === "parent") {
        const prefix = `${id}-`;
        for (const item of journeyContent) {
          if (item.type === "parent") continue;
          if (!item.id.startsWith(prefix)) continue;
          ids.push(item.id);
        }
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
    if (isStackedMobileLayout && base.type === "parent") return;

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
  }, [effectiveItemMap, isStackedMobileLayout, itemMap, parentCardSizes, ref, width]);

  const handleEditResize = useCallback(
    (id: string, next: { x: number; y: number; width: number; height: number }) => {
      if (!ref.current || !width) return;
      const base = effectiveItemMap[id] ?? itemMap[id];
      if (!base) return;
      if (isStackedMobileLayout && base.type === "parent") return;

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
    [effectiveItemMap, isStackedMobileLayout, itemMap, ref, width],
  );

  const handleNudgeSelectedCardSize = useCallback(
    (deltaWidth: number, deltaHeight: number) => {
      if (!editorToolsEnabled) return;
      if (!selectedEditorCardId) return;
      const base = effectiveItemMap[selectedEditorCardId] ?? itemMap[selectedEditorCardId];
      if (!base) return;

      if (base.type === "parent") {
        if (isStackedMobileLayout) return;
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
      isStackedMobileLayout,
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
      if (isStackedMobileLayout && base.type === "parent") return;

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
      isStackedMobileLayout,
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
    if (isStackedMobileLayout) return;
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
  }, [isStackedMobileLayout, items, templateSize]);

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

  const handleLanePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!editorToolsEnabled) return;
      if (event.button !== 0) return;
      if (event.currentTarget !== event.target) return;
      laneClickStateRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
      };
    },
    [editorToolsEnabled],
  );

  const handleLanePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
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
    },
    [editorToolsEnabled, handleEditorClickModeChange],
  );

  return (
    <div
      ref={ref}
      className="memory-lane isolate relative w-full"
      data-journey-layout={layout.id}
      onPointerDown={handleLanePointerDown}
      onPointerUp={handleLanePointerUp}
    >
      {editorEnabled ? (
        <div
          className="journey-editor-grid absolute inset-0 z-0
          pointer-events-none opacity-[0.26]"
        />
      ) : null}

      <JourneyEdgeLayer
        laneRef={ref}
        editorEnabled={editorEnabled}
        renderEdges={renderEdges}
        effectiveItemMap={effectiveItemMap}
        parentCardSizes={parentCardSizes}
        selectedEdgeKey={selectedEdgeKey}
        selectedVia={selectedVia}
        selectedViaIndex={selectedViaIndex}
        setSelectedViaIndex={setSelectedViaIndex}
        selectedEditorCardId={selectedEditorCardId}
        setSelectedEditorCardId={setSelectedEditorCardId}
        onSelectEdge={handleSelectEdge}
        handleRemoveViaPoint={handleRemoveViaPoint}
        handleMoveViaPoint={handleMoveViaPoint}
      />

      <JourneyItemsLayer
        visibleItems={visibleItems}
        layoutId={layout.id}
        editorEnabled={editorEnabled}
        onSelect={handleItemSelect}
        onMeasure={handleMeasureParent}
        onEditMove={handleEditMove}
        onEditResize={handleEditResize}
      />

      <JourneyEditorHudPortal
        editorEnabled={Boolean(editorEnabled)}
        editorActive={editorActive}
        editorToolsEnabled={editorToolsEnabled}
        hudMinimized={hudMinimized}
        setHudMinimized={setHudMinimized}
        hudRefCallback={(node) => {
          hudRef.current = node;
        }}
        onHudPointerDown={handleHudPointerDown}
        onHudPointerMove={handleHudPointerMove}
        onHudPointerUp={handleHudPointerUp}
        editorClickMode={editorClickMode}
        onEditorClickModeChange={handleEditorClickModeChange}
        layoutId={layout.id}
        containerWidth={width ?? null}
        scale={scale}
        templateSize={templateSize}
        selectedEdgeKey={selectedEdgeKey}
        selectedRenderEdge={selectedRenderEdge}
        isStackedMobileLayout={isStackedMobileLayout}
        effectiveParentToChildGap={effectiveParentToChildGap}
        effectiveParentToParentGap={effectiveParentToParentGap}
        gapDefaults={gapDefaults}
        gapOverrides={gapOverrides}
        setGapOverrides={setGapOverrides}
        visibleItems={visibleItems}
        selectedEditorCardId={selectedEditorCardId}
        setSelectedEditorCardId={setSelectedEditorCardId}
        selectedEditorCard={selectedEditorCard}
        selectedEditorCardSize={selectedEditorCardSize}
        upsertCardTextOverride={upsertCardTextOverride}
        clearCardTextOverride={clearCardTextOverride}
        resetAllCardTextOverrides={resetAllCardTextOverrides}
        handleDeleteCard={handleDeleteCard}
        deletedIds={deletedIds}
        selectedDeletedId={selectedDeletedId}
        setSelectedDeletedId={setSelectedDeletedId}
        handleRestoreDeleted={handleRestoreDeleted}
        handleRestoreAllDeleted={handleRestoreAllDeleted}
        setEdgeOverrides={setEdgeOverrides}
        cycleAnchor={cycleAnchor}
        handleOrthogonalizeSelectedEdge={handleOrthogonalizeSelectedEdge}
        handleCopyEdits={handleCopyEdits}
        handleMatchAllToTemplate={handleMatchAllToTemplate}
        handleResetEdits={handleResetEdits}
        setHudPos={setHudPos}
      />


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

