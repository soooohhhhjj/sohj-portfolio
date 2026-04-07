import MemoryItem from "../MemoryItem";
import type { JourneyItemNode } from "../types/journey.types";

type MeasureSize = { width: number; height: number };

export type JourneyItemsLayerProps = {
  visibleItems: JourneyItemNode[];
  layoutId: string;
  editorEnabled?: boolean;
  onSelect: (item: JourneyItemNode) => void;
  onMeasure: (id: string, size: MeasureSize) => void;
  onEditMove: (id: string, next: { x: number; y: number }) => void;
  onEditResize: (id: string, next: { x: number; y: number; width: number; height: number }) => void;
};

export function JourneyItemsLayer({
  visibleItems,
  layoutId,
  editorEnabled,
  onSelect,
  onMeasure,
  onEditMove,
  onEditResize,
}: JourneyItemsLayerProps) {
  return (
    <>
      {visibleItems.map((item) => (
        <MemoryItem
          key={item.id}
          {...item}
          layoutId={layoutId}
          onSelect={onSelect}
          onMeasure={onMeasure}
          editorEnabled={editorEnabled}
          onEditMove={onEditMove}
          onEditResize={onEditResize}
        />
      ))}
    </>
  );
}

