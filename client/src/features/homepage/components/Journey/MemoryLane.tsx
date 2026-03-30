import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import MemoryItem from "./MemoryItem";
import MemoryPath from "./MemoryPath";
import JourneyNodeModal from "./JourneyNodeModal";
import { journeyContent } from "./journey.content";
import { computeJourneyNodes } from "./layout/computeNodes";
import { pickLayout } from "./layout";
import { useContainerSize } from "./layout/useContainerSize";
import { useViewportWidth } from "./layout/useViewportWidth";
import type { Anchor, JourneyItemNode } from "./types/journey.types";

import "./CSS/memoryLane.css";

interface MemoryLaneProps {
  onModalOpenChange?: (isOpen: boolean) => void;
  editorEnabled?: boolean;
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
const edgeKeyOf = (edge: { from: string; to: string }) => `${edge.from}->${edge.to}`;

const anchorOrder: Anchor[] = ["top", "right", "bottom", "left"];
const cycleAnchor = (value: Anchor) => {
  const idx = anchorOrder.indexOf(value);
  return anchorOrder[(idx + 1) % anchorOrder.length];
};

export default function MemoryLane({ onModalOpenChange, editorEnabled }: MemoryLaneProps) {
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const viewportWidth = useViewportWidth();
  const [selectedItem, setSelectedItem] = useState<JourneyItemNode | null>(
    null,
  );
  const [parentCardSizes, setParentCardSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [parentCardSizeOverride, setParentCardSizeOverride] = useState<
    { width: number; height: number } | null
  >(null);

  useEffect(() => {
    onModalOpenChange?.(Boolean(selectedItem));
    return () => onModalOpenChange?.(false);
  }, [onModalOpenChange, selectedItem]);

  const layout = useMemo(() => pickLayout(viewportWidth), [viewportWidth]);
  const { items, itemMap, edges, height } = useMemo(
    () => computeJourneyNodes(journeyContent, layout, width),
    [layout, width],
  );
  const scale = useMemo(() => {
    if (!layout.scaleWithContainer) return 1;
    if (!width) return 1;
    return width / layout.canvasWidth;
  }, [layout.canvasWidth, layout.scaleWithContainer, width]);

  const [nodeOverrides, setNodeOverrides] = useState<Record<string, NodeLayoutOverride>>({});
  const [edgeOverrides, setEdgeOverrides] = useState<Record<string, EdgeOverride>>({});
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);
  const hudRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);
  const hudDragRef = useMemo(
    () =>
      ({
        current: null as null | {
          pointerId: number;
          startClientX: number;
          startClientY: number;
          startX: number;
          startY: number;
        },
      }),
    [],
  );
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HUD_POS_STORAGE_KEY, JSON.stringify(hudPos));
    } catch {
      // ignore
    }
  }, [hudPos]);

  useEffect(() => {
    setNodeOverrides({});
    try {
      const raw = window.localStorage.getItem(buildNodeOverrideKey(layout.id));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, NodeLayoutOverride>;
      if (parsed && typeof parsed === "object") {
        setNodeOverrides(parsed);
      }
    } catch {
      // ignore bad localStorage
    }
  }, [layout.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(buildNodeOverrideKey(layout.id), JSON.stringify(nodeOverrides));
    } catch {
      // ignore write failures
    }
  }, [layout.id, nodeOverrides]);

  useEffect(() => {
    setEdgeOverrides({});
    setSelectedEdgeKey(null);
    try {
      const raw = window.localStorage.getItem(buildEdgeOverrideKey(layout.id));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, EdgeOverride>;
      if (parsed && typeof parsed === "object") {
        setEdgeOverrides(parsed);
      }
    } catch {
      // ignore bad localStorage
    }
  }, [layout.id]);

  useEffect(() => {
    setParentCardSizeOverride(null);
    try {
      const raw = window.localStorage.getItem(buildParentCardSizeKey(layout.id));
      if (!raw) return;
      const parsed = JSON.parse(raw) as { width?: number; height?: number };
      const nextW = Number(parsed?.width);
      const nextH = Number(parsed?.height);
      if (!Number.isFinite(nextW) || !Number.isFinite(nextH)) return;
      setParentCardSizeOverride({ width: nextW, height: nextH });
    } catch {
      // ignore bad localStorage
    }
  }, [layout.id]);

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
      if (!override) return item;
      return {
        ...item,
        x: override.x ?? item.x,
        y: override.y ?? item.y,
        width: override.width ?? item.width,
        height: override.height ?? item.height,
      };
    });
  }, [items, nodeOverrides]);

  const effectiveItemMap = useMemo(() => {
    if (effectiveItems === items) return itemMap;
    return Object.fromEntries(effectiveItems.map((item) => [item.id, item]));
  }, [effectiveItems, itemMap, items]);

  const renderEdges = useMemo(() => {
    return edges.map((edge) => {
      const key = edgeKeyOf(edge);
      const override = edgeOverrides[key];
      if (!override) return edge;
      return {
        ...edge,
        ...override,
        via: override.via ?? edge.via,
      };
    });
  }, [edgeOverrides, edges]);

  const laneHeight = useMemo(() => {
    const maxY = effectiveItems.reduce(
      (max, item) => Math.max(max, item.y + item.height),
      0,
    );
    return Math.max(height, maxY + 180);
  }, [effectiveItems, height]);

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
    if (!editorEnabled) return;
    if (!hudRef.current) return;
    hudRef.current.style.transform = `translate(${hudPos.x}px, ${hudPos.y}px)`;
  }, [editorEnabled, hudPos.x, hudPos.y, hudRef]);

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
    [hudRef],
  );

  const handleHudPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!editorEnabled) return;
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
    [editorEnabled, hudDragRef, hudPos.x, hudPos.y],
  );

  const handleHudPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!editorEnabled) return;
      const state = hudDragRef.current;
      if (!state) return;
      if (state.pointerId !== event.pointerId) return;

      const dx = event.clientX - state.startClientX;
      const dy = event.clientY - state.startClientY;
      setHudPos(clampHud({ x: Math.round(state.startX + dx), y: Math.round(state.startY + dy) }));
    },
    [clampHud, editorEnabled, hudDragRef],
  );

  const handleHudPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = hudDragRef.current;
      if (!state) return;
      if (state.pointerId !== event.pointerId) return;
      hudDragRef.current = null;
    },
    [hudDragRef],
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
      [...effectiveItems].sort((a, b) => (a.y - b.y) || (a.x - b.x)),
    [effectiveItems],
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

      const centeredItem = effectiveItems
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
    const containerH = laneHeight;

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
    const maxY =
      base.type === "parent"
        ? Math.floor(containerH - cardH / 2 - anchorH / 2)
        : Math.floor(containerH - anchorH);

    setNodeOverrides((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {}),
        x: clamp(next.x, minX, Math.max(minX, maxX)),
        y: clamp(next.y, minY, Math.max(minY, maxY)),
      },
    }));
  }, [effectiveItemMap, itemMap, laneHeight, parentCardSizes, ref, width]);

  const handleEditResize = useCallback(
    (id: string, next: { x: number; y: number; width: number; height: number }) => {
      if (!ref.current || !width) return;
      const base = effectiveItemMap[id] ?? itemMap[id];
      if (!base) return;

      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

      const containerW = width;
      const containerH = laneHeight;

      const minWidth = 220;
      const minHeight = 160;

      const clampedWidth = clamp(next.width, minWidth, Math.floor(containerW - next.x));
      const clampedHeight = clamp(next.height, minHeight, Math.floor(containerH - next.y));

      setNodeOverrides((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] ?? {}),
          x: clamp(next.x, 0, containerW - clampedWidth),
          y: clamp(next.y, 0, containerH - clampedHeight),
          width: clampedWidth,
          height: clampedHeight,
        },
      }));
    },
    [effectiveItemMap, itemMap, laneHeight, ref, width],
  );

  const handleSelectEdge = useCallback(
    (edgeKey: string, event: ReactPointerEvent<SVGPathElement>) => {
      if (!editorEnabled) return;

      setSelectedEdgeKey(edgeKey);

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
    [editorEnabled, edges, ref],
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

  const templateSize = useMemo(() => {
    const template = effectiveItemMap["node1-c1"] ?? itemMap["node1-c1"];
    if (!template) return null;
    return { width: template.width, height: template.height };
  }, [effectiveItemMap, itemMap]);

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

  return (
    <div ref={ref} className="memory-lane relative w-full">
      {editorEnabled ? <div className="journey-editor-grid" /> : null}

      <svg
        className={`absolute inset-0 z-0 w-full h-full base-text-color ${
          editorEnabled ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {renderEdges.map((edge, i) => (
          <MemoryPath
            key={i}
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
                r={6}
                fill="rgba(52, 211, 153, 0.35)"
                stroke="rgba(52, 211, 153, 0.9)"
                strokeWidth={1.2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
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
                      y: Math.max(0, Math.min(rect.height, y)),
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

      {effectiveItems.map((item) => (
        <MemoryItem
          key={item.id}
          {...item}
          onSelect={editorEnabled ? undefined : setSelectedItem}
          onMeasure={handleMeasureParent}
          editorEnabled={editorEnabled}
          onEditMove={handleEditMove}
          onEditResize={handleEditResize}
        />
      ))}

      {editorEnabled ? (
        <div
          ref={(node) => {
            hudRef.current = node;
          }}
          className="journey-editor-hud"
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
          </div>
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

          {editorEnabled && selectedRenderEdge ? (
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
              <div className="journey-editor-hud__hint">
                Shift-click a line to add a point. Alt-click a point to remove.
              </div>
            </div>
          ) : null}

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
        </div>
      ) : null}

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
