import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { journeyContent } from '../components/Journey/journey.content';
import { useContainerSize } from '../components/Journey/layout/useContainerSize';
import type { LayoutEdge } from '../components/Journey/layout/layout.types';
import type { JourneyItemContent, JourneyItemNode } from '../components/Journey/types/journey.types';
import {
  clamp,
  CONSTELLATION_EDGE_BLUEPRINTS,
  CONSTELLATION_PARENT_IDS,
  CONSTELLATION_POINTS,
  getLaneSizeKey,
  getNodeSizes,
  JOURNEY_STORAGE_KEY,
  parseStoredPositions,
  resolveAnchor,
  type DragState,
  type ConstellationPoint,
} from './journeyConstellation.config';

interface UseJourneyConstellationOptions {
  isEditMode: boolean;
  onModalOpenChange?: (isOpen: boolean) => void;
}

export function useJourneyConstellation({
  isEditMode,
  onModalOpenChange,
}: UseJourneyConstellationOptions) {
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const [selectedItem, setSelectedItem] = useState<JourneyItemNode | null>(null);
  const [positionOverrides, setPositionOverrides] = useState<Record<string, ConstellationPoint>>(() =>
    parseStoredPositions(),
  );
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
    if (!isEditMode) {
      dragStateRef.current = null;
      setDraggingId(null);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wasEditMode = previousEditModeRef.current;
    if (wasEditMode && !isEditMode) {
      window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(positionOverrides));
    }

    previousEditModeRef.current = isEditMode;
  }, [isEditMode, positionOverrides]);

  const parentContentById = useMemo(() => {
    const map = new Map<string, JourneyItemContent>();

    journeyContent.forEach((item) => {
      if (item.type === 'parent') {
        map.set(item.id, item);
      }
    });

    return map;
  }, []);

  const laneWidth = useMemo(() => clamp(Math.round(width ?? 720), 320, 940), [width]);
  const laneHeight = useMemo(() => clamp(Math.round(laneWidth * 0.92), 460, 860), [laneWidth]);
  const laneSizeKey = getLaneSizeKey(laneWidth);
  const nodeSizes = getNodeSizes(laneSizeKey);

  const parentItems = useMemo(() => {
    return CONSTELLATION_PARENT_IDS.map((id) => {
      const base = parentContentById.get(id);
      if (!base) return null;

      const point = CONSTELLATION_POINTS[id];
      const baseX = Math.round((laneWidth - nodeSizes.parent) * point.x);
      const baseY = Math.round((laneHeight - nodeSizes.parent) * point.y);
      const override = positionOverrides[id];

      return {
        ...base,
        x: override ? clamp(Math.round(override.x), 0, laneWidth - nodeSizes.parent) : baseX,
        y: override ? clamp(Math.round(override.y), 0, laneHeight - nodeSizes.parent) : baseY,
        width: nodeSizes.parent,
        height: nodeSizes.parent,
      } as JourneyItemNode;
    }).filter((item): item is JourneyItemNode => Boolean(item));
  }, [laneHeight, laneWidth, nodeSizes.parent, parentContentById, positionOverrides]);

  const parentItemMap = useMemo(() => {
    return Object.fromEntries(parentItems.map((item) => [item.id, item])) as Record<string, JourneyItemNode>;
  }, [parentItems]);

  const childItems = useMemo(() => {
    const built: JourneyItemNode[] = [];

    CONSTELLATION_PARENT_IDS.forEach((parentId) => {
      const parentNode = parentItemMap[parentId];
      if (!parentNode) return;

      const group = journeyContent.filter((item) => item.type !== 'parent' && item.id.startsWith(`${parentId}-`));
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
        const baseX = clamp(Math.round(centerX - nodeSizes.child / 2), 0, laneWidth - nodeSizes.child);
        const baseY = clamp(Math.round(centerY - nodeSizes.child / 2), 0, laneHeight - nodeSizes.child);
        const override = positionOverrides[entry.id];

        built.push({
          ...entry,
          x: override ? clamp(Math.round(override.x), 0, laneWidth - nodeSizes.child) : baseX,
          y: override ? clamp(Math.round(override.y), 0, laneHeight - nodeSizes.child) : baseY,
          width: nodeSizes.child,
          height: nodeSizes.child,
        } as JourneyItemNode);
      });
    });

    return built;
  }, [laneHeight, laneWidth, nodeSizes.child, parentItemMap, positionOverrides]);

  const items = useMemo(() => [...parentItems, ...childItems], [childItems, parentItems]);

  const itemMap = useMemo(() => {
    return Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, JourneyItemNode>;
  }, [items]);

  useEffect(() => {
    itemMapRef.current = itemMap;
  }, [itemMap]);

  const selectedParentChildren = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'parent') return [];

    return childItems.filter((child) => child.id.startsWith(`${selectedItem.id}-`));
  }, [childItems, selectedItem]);

  const edges = useMemo(() => {
    const nextEdges: LayoutEdge[] = [];

    CONSTELLATION_EDGE_BLUEPRINTS.forEach((edge) => {
      if (!itemMap[edge.from] || !itemMap[edge.to]) return;

      nextEdges.push({
        ...edge,
        via: edge.via?.map((point) => ({
          x: Math.round(point.x * laneWidth),
          y: Math.round(point.y * laneHeight),
        })),
      });
    });

    childItems.forEach((child) => {
      const parentId = CONSTELLATION_PARENT_IDS.find((id) => child.id.startsWith(`${id}-`));
      if (!parentId) return;

      const parentNode = itemMap[parentId];
      if (!parentNode) return;

      const anchor = resolveAnchor(parentNode, child);
      nextEdges.push({
        from: parentId,
        to: child.id,
        fromAnchor: anchor.fromAnchor,
        toAnchor: anchor.toAnchor,
      });
    });

    return nextEdges;
  }, [childItems, itemMap, laneHeight, laneWidth]);

  const handleItemSelect = (item: JourneyItemNode) => {
    if (isEditMode) return;

    const suppressed = suppressSelectRef.current;
    if (suppressed && suppressed.id === item.id && Date.now() <= suppressed.until) {
      return;
    }

    setSelectedItem(item);
  };

  const handleStarPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, item: JourneyItemNode) => {
    if (!isEditMode || event.button !== 0) return;

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
      if (!drag || !laneElement || event.pointerId !== drag.pointerId) return;

      const item = itemMapRef.current[drag.id];
      if (!item) return;

      const laneRect = laneElement.getBoundingClientRect();
      const x = clamp(Math.round(event.clientX - laneRect.left - drag.offsetX), 0, laneWidth - item.width);
      const y = clamp(Math.round(event.clientY - laneRect.top - drag.offsetY), 0, laneHeight - item.height);

      setPositionOverrides((prev) => {
        const existing = prev[drag.id];
        if (existing && existing.x === x && existing.y === y) return prev;
        return { ...prev, [drag.id]: { x, y } };
      });

      if (!drag.moved && Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) > 4) {
        dragStateRef.current = { ...drag, moved: true };
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      if (drag.moved) {
        suppressSelectRef.current = { id: drag.id, until: Date.now() + 250 };
      }

      dragStateRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isEditMode, laneHeight, laneWidth, ref]);

  return {
    items,
    itemMap,
    edges,
    laneRef: ref,
    laneSizeClassName: `constellation-lane--${laneSizeKey}`,
    draggingId,
    selectedItem,
    selectedParentChildren,
    handleItemSelect,
    handleStarPointerDown,
    handleCloseModal: () => setSelectedItem(null),
    handleSelectModalItem: setSelectedItem,
  };
}
