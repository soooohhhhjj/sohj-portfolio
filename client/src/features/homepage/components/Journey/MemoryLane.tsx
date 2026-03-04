import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import MemoryItem from "./MemoryItem";
import MemoryPath from "./MemoryPath";
import JourneyNodeModal from "./JourneyNodeModal";
import { journeyContent } from "./journey.content";
import { useContainerSize } from "./layout/useContainerSize";
import type { LayoutEdge } from "./layout/layout.types";
import type { Anchor, JourneyItemContent, JourneyItemNode } from "./types/journey.types";

import "./CSS/memoryLane.css";

interface MemoryLaneProps {
  isEditMode?: boolean;
  onModalOpenChange?: (isOpen: boolean) => void;
}

interface ConstellationPoint {
  x: number;
  y: number;
}

interface DragState {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
}

const STORAGE_KEY = "sohj.journey.constellation.positions.v1";

const CONSTELLATION_PARENT_IDS = [
  "node1",
  "node2",
  "node3",
  "node4",
  "node5",
  "node6",
] as const;

const CONSTELLATION_POINTS: Record<string, ConstellationPoint> = {
  node1: { x: 0.09, y: 0.16 },
  node2: { x: 0.24, y: 0.44 },
  node3: { x: 0.47, y: 0.23 },
  node4: { x: 0.58, y: 0.58 },
  node5: { x: 0.8, y: 0.3 },
  node6: { x: 0.86, y: 0.72 },
};

const CONSTELLATION_EDGE_BLUEPRINTS: LayoutEdge[] = [
  { from: "node1", to: "node2", fromAnchor: "right", toAnchor: "left" },
  {
    from: "node2",
    to: "node3",
    fromAnchor: "right",
    toAnchor: "left",
    via: [{ x: 0.35, y: 0.34 }],
  },
  { from: "node3", to: "node4", fromAnchor: "bottom", toAnchor: "top" },
  { from: "node3", to: "node5", fromAnchor: "right", toAnchor: "left" },
  {
    from: "node4",
    to: "node6",
    fromAnchor: "right",
    toAnchor: "left",
    via: [{ x: 0.73, y: 0.68 }],
  },
  { from: "node5", to: "node6", fromAnchor: "bottom", toAnchor: "top" },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseStoredPositions = (): Record<string, ConstellationPoint> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { x?: unknown; y?: unknown }>;

    return Object.fromEntries(
      Object.entries(parsed).filter(([, point]) => {
        return (
          typeof point?.x === "number" &&
          Number.isFinite(point.x) &&
          typeof point?.y === "number" &&
          Number.isFinite(point.y)
        );
      }),
    ) as Record<string, ConstellationPoint>;
  } catch {
    return {};
  }
};

const resolveAnchor = (
  from: JourneyItemNode,
  to: JourneyItemNode,
): { fromAnchor: Anchor; toAnchor: Anchor } => {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const deltaX = toCenterX - fromCenterX;
  const deltaY = toCenterY - fromCenterY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { fromAnchor: "right", toAnchor: "left" }
      : { fromAnchor: "left", toAnchor: "right" };
  }

  return deltaY >= 0
    ? { fromAnchor: "bottom", toAnchor: "top" }
    : { fromAnchor: "top", toAnchor: "bottom" };
};

export default function MemoryLane({
  isEditMode = false,
  onModalOpenChange,
}: MemoryLaneProps) {
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const [selectedItem, setSelectedItem] = useState<JourneyItemNode | null>(
    null,
  );
  const [positionOverrides, setPositionOverrides] = useState<
    Record<string, ConstellationPoint>
  >(() => parseStoredPositions());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const itemMapRef = useRef<Record<string, JourneyItemNode>>({});
  const suppressSelectRef = useRef<{ id: string; until: number } | null>(null);
  const previousEditModeRef = useRef(isEditMode);

  useEffect(() => {
    onModalOpenChange?.(Boolean(selectedItem) && !isEditMode);
    return () => onModalOpenChange?.(false);
  }, [isEditMode, onModalOpenChange, selectedItem]);

  useEffect(() => {
    if (isEditMode) return;
    dragStateRef.current = null;
  }, [isEditMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const wasEditMode = previousEditModeRef.current;
    if (wasEditMode && !isEditMode) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positionOverrides));
    }

    previousEditModeRef.current = isEditMode;
  }, [isEditMode, positionOverrides]);

  const parentContentById = useMemo(() => {
    const map = new Map<string, JourneyItemContent>();

    journeyContent.forEach((item) => {
      if (item.type !== "parent") return;
      map.set(item.id, item);
    });

    return map;
  }, []);

  const laneWidth = useMemo(
    () => clamp(Math.round(width ?? 720), 320, 940),
    [width],
  );
  const laneHeight = useMemo(
    () => clamp(Math.round(laneWidth * 0.92), 460, 860),
    [laneWidth],
  );
  const parentStarSize = useMemo(
    () => clamp(Math.round(laneWidth * 0.055), 28, 52),
    [laneWidth],
  );
  const childStarSize = useMemo(
    () => clamp(Math.round(parentStarSize * 0.62), 16, 30),
    [parentStarSize],
  );

  const parentItems = useMemo(() => {
    return CONSTELLATION_PARENT_IDS.map((id) => {
      const base = parentContentById.get(id);
      if (!base) return null;

      const point = CONSTELLATION_POINTS[id];
      const baseX = Math.round((laneWidth - parentStarSize) * point.x);
      const baseY = Math.round((laneHeight - parentStarSize) * point.y);
      const override = positionOverrides[id];
      const x = override
        ? clamp(Math.round(override.x), 0, laneWidth - parentStarSize)
        : baseX;
      const y = override
        ? clamp(Math.round(override.y), 0, laneHeight - parentStarSize)
        : baseY;

      return {
        ...base,
        x,
        y,
        width: parentStarSize,
        height: parentStarSize,
      } as JourneyItemNode;
    }).filter((item): item is JourneyItemNode => Boolean(item));
  }, [laneHeight, laneWidth, parentContentById, parentStarSize, positionOverrides]);

  const parentItemMap = useMemo(() => {
    return Object.fromEntries(
      parentItems.map((item) => [item.id, item]),
    ) as Record<string, JourneyItemNode>;
  }, [parentItems]);

  const childItems = useMemo(() => {
    const built: JourneyItemNode[] = [];

    CONSTELLATION_PARENT_IDS.forEach((parentId) => {
      const parentNode = parentItemMap[parentId];
      if (!parentNode) return;

      const group = journeyContent.filter((item) => {
        return item.type !== "parent" && item.id.startsWith(`${parentId}-`);
      });
      if (group.length === 0) return;

      const parentCenterX = parentNode.x + parentNode.width / 2;
      const parentCenterY = parentNode.y + parentNode.height / 2;
      const isOnLeftSide = parentCenterX < laneWidth * 0.5;
      const startAngle = isOnLeftSide ? -65 : 115;
      const endAngle = isOnLeftSide ? 65 : 245;
      const angleStep = group.length === 1 ? 0 : (endAngle - startAngle) / (group.length - 1);
      const radius = clamp(Math.round(laneWidth * 0.09), 54, 112);

      group.forEach((entry, index) => {
        const angleDeg = startAngle + angleStep * index;
        const angleRad = (angleDeg * Math.PI) / 180;
        const centerX = parentCenterX + Math.cos(angleRad) * radius;
        const centerY = parentCenterY + Math.sin(angleRad) * radius;
        const baseX = clamp(
          Math.round(centerX - childStarSize / 2),
          0,
          laneWidth - childStarSize,
        );
        const baseY = clamp(
          Math.round(centerY - childStarSize / 2),
          0,
          laneHeight - childStarSize,
        );
        const override = positionOverrides[entry.id];
        const x = override
          ? clamp(Math.round(override.x), 0, laneWidth - childStarSize)
          : baseX;
        const y = override
          ? clamp(Math.round(override.y), 0, laneHeight - childStarSize)
          : baseY;

        built.push({
          ...entry,
          x,
          y,
          width: childStarSize,
          height: childStarSize,
        } as JourneyItemNode);
      });
    });

    return built;
  }, [childStarSize, laneHeight, laneWidth, parentItemMap, positionOverrides]);

  const constellationItems = useMemo(
    () => [...parentItems, ...childItems],
    [childItems, parentItems],
  );

  const constellationItemMap = useMemo(() => {
    return Object.fromEntries(
      constellationItems.map((item) => [item.id, item]),
    ) as Record<string, JourneyItemNode>;
  }, [constellationItems]);

  useEffect(() => {
    itemMapRef.current = constellationItemMap;
  }, [constellationItemMap]);

  const parentChildrenMap = useMemo(() => {
    const map = new Map<string, JourneyItemNode[]>();

    childItems.forEach((child) => {
      const parentId = CONSTELLATION_PARENT_IDS.find((id) =>
        child.id.startsWith(`${id}-`),
      );
      if (!parentId) return;
      const existing = map.get(parentId) ?? [];
      existing.push(child);
      map.set(parentId, existing);
    });

    return map;
  }, [childItems]);

  const selectedParentChildren = useMemo(() => {
    if (!selectedItem || selectedItem.type !== "parent") return [];
    return parentChildrenMap.get(selectedItem.id) ?? [];
  }, [parentChildrenMap, selectedItem]);

  const constellationEdges = useMemo(() => {
    const edges: LayoutEdge[] = [];

    CONSTELLATION_EDGE_BLUEPRINTS.forEach((edge) => {
      if (!constellationItemMap[edge.from] || !constellationItemMap[edge.to]) return;

      edges.push({
        ...edge,
        via: edge.via?.map((point) => ({
          x: Math.round(point.x * laneWidth),
          y: Math.round(point.y * laneHeight),
        })),
      });
    });

    childItems.forEach((child) => {
      const parentId = CONSTELLATION_PARENT_IDS.find((id) =>
        child.id.startsWith(`${id}-`),
      );
      if (!parentId) return;
      const parentNode = constellationItemMap[parentId];
      if (!parentNode) return;
      const anchor = resolveAnchor(parentNode, child);

      edges.push({
        from: parentId,
        to: child.id,
        fromAnchor: anchor.fromAnchor,
        toAnchor: anchor.toAnchor,
      });
    });

    return edges;
  }, [childItems, constellationItemMap, laneHeight, laneWidth]);

  const handleItemSelect = (item: JourneyItemNode) => {
    if (isEditMode) return;

    const suppressed = suppressSelectRef.current;
    if (
      suppressed &&
      suppressed.id === item.id &&
      Date.now() <= suppressed.until
    ) {
      return;
    }

    setSelectedItem(item);
  };

  const handleStarPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    item: JourneyItemNode,
  ) => {
    if (!isEditMode) return;
    if (event.button !== 0) return;
    const target = itemMapRef.current[item.id];
    const laneElement = ref.current;
    if (!target || !laneElement) return;

    event.preventDefault();
    event.stopPropagation();
    const laneRect = laneElement.getBoundingClientRect();

    dragStateRef.current = {
      id: item.id,
      pointerId: event.pointerId,
      offsetX: event.clientX - (laneRect.left + target.x),
      offsetY: event.clientY - (laneRect.top + target.y),
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
    };
    setDraggingId(item.id);
  };

  useEffect(() => {
    if (!isEditMode) return;

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      const laneElement = ref.current;
      if (!drag || !laneElement) return;
      if (event.pointerId !== drag.pointerId) return;

      const item = itemMapRef.current[drag.id];
      if (!item) return;

      const laneRect = laneElement.getBoundingClientRect();
      const rawX = event.clientX - laneRect.left - drag.offsetX;
      const rawY = event.clientY - laneRect.top - drag.offsetY;
      const x = clamp(Math.round(rawX), 0, laneWidth - item.width);
      const y = clamp(Math.round(rawY), 0, laneHeight - item.height);

      setPositionOverrides((prev) => {
        const existing = prev[drag.id];
        if (existing && existing.x === x && existing.y === y) return prev;
        return {
          ...prev,
          [drag.id]: { x, y },
        };
      });

      if (
        !drag.moved &&
        Math.hypot(
          event.clientX - drag.startClientX,
          event.clientY - drag.startClientY,
        ) > 4
      ) {
        dragStateRef.current = { ...drag, moved: true };
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      if (event.pointerId !== drag.pointerId) return;

      if (drag.moved) {
        suppressSelectRef.current = {
          id: drag.id,
          until: Date.now() + 250,
        };
      }

      dragStateRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isEditMode, laneHeight, laneWidth, ref]);

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  return (
    <div
      ref={ref}
      className="memory-lane constellation-lane relative w-full"
      style={{ height: laneHeight }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {constellationEdges.map((edge, index) => (
          <MemoryPath key={`${edge.from}-${edge.to}-${index}`} edge={edge} items={constellationItemMap} />
        ))}
      </svg>

      {constellationItems.map((item) => (
        <MemoryItem
          key={item.id}
          {...item}
          renderAsStar={item.type !== "parent"}
          isEditMode={isEditMode}
          isDragging={isEditMode && draggingId === item.id}
          onStarPointerDown={handleStarPointerDown}
          onSelect={handleItemSelect}
        />
      ))}

      {!isEditMode ? (
        <JourneyNodeModal
          item={selectedItem}
          parentChildren={selectedParentChildren}
          navigationItems={constellationItems}
          onClose={handleCloseModal}
          onSelectItem={setSelectedItem}
        />
      ) : null}
    </div>
  );
}
