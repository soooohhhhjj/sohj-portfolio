import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import MemoryItem from "./MemoryItem";
import MemoryPath from "./MemoryPath";
import JourneyNodeModal from "./JourneyNodeModal";
import { journeyContent } from "./journey.content";
import { computeJourneyNodes } from "./layout/computeNodes";
import { pickLayout } from "./layout";
import { useContainerSize } from "./layout/useContainerSize";
import { useViewportWidth } from "./layout/useViewportWidth";
import type { JourneyItemNode } from "./types/journey.types";

import "./CSS/memoryLane.css";

interface MemoryLaneProps {
  onModalOpenChange?: (isOpen: boolean) => void;
}

export default function MemoryLane({ onModalOpenChange }: MemoryLaneProps) {
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const viewportWidth = useViewportWidth();
  const [selectedItem, setSelectedItem] = useState<JourneyItemNode | null>(
    null,
  );
  const [parentCardSizes, setParentCardSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});

  useEffect(() => {
    onModalOpenChange?.(Boolean(selectedItem));
    return () => onModalOpenChange?.(false);
  }, [onModalOpenChange, selectedItem]);

  const layout = useMemo(() => pickLayout(viewportWidth), [viewportWidth]);
  const { items, itemMap, edges, height } = useMemo(
    () => computeJourneyNodes(journeyContent, layout, width),
    [layout, width],
  );

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = `${height}px`;
  }, [height, ref]);

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

    edges.forEach((edge) => {
      const source = itemMap[edge.from];
      const target = itemMap[edge.to];

      if (!source || !target) return;
      if (source.type !== "parent") return;
      if (target.type === "parent") return;

      const existing = map.get(source.id) ?? [];
      existing.push(target);
      map.set(source.id, existing);
    });

    return map;
  }, [edges, itemMap]);

  const selectedParentChildren = useMemo(() => {
    if (!selectedItem || selectedItem.type !== "parent") return [];
    return parentChildrenMap.get(selectedItem.id) ?? [];
  }, [selectedItem, parentChildrenMap]);

  const childParentMap = useMemo(() => {
    const map = new Map<string, string>();

    edges.forEach((edge) => {
      const source = itemMap[edge.from];
      const target = itemMap[edge.to];

      if (!source || !target) return;
      if (source.type !== "parent") return;
      if (target.type === "parent") return;

      map.set(target.id, source.id);
    });

    return map;
  }, [edges, itemMap]);

  const modalNavigationItems = useMemo(
    () =>
      journeyContent
        .map((contentItem) => itemMap[contentItem.id])
        .filter((item): item is JourneyItemNode => Boolean(item)),
    [itemMap],
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
    const anchorItem = itemMap[anchorId];
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

      const centeredItem = items
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

  return (
    <div ref={ref} className="memory-lane relative w-full">
      <svg className="absolute inset-0 z-0 w-full h-full pointer-events-none base-text-color">
        {edges.map((edge, i) => (
          <MemoryPath key={i} edge={edge} items={itemMap} parentCardSizes={parentCardSizes} />
        ))}
      </svg>

      {items.map((item) => (
        <MemoryItem
          key={item.id}
          {...item}
          onSelect={setSelectedItem}
          onMeasure={handleMeasureParent}
        />
      ))}

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
