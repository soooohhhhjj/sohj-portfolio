import type { Dispatch, RefObject, SetStateAction, PointerEvent as ReactPointerEvent } from "react";

import MemoryPath from "../MemoryPath";
import type { JourneyItemNode } from "../types/journey.types";
import type { LayoutEdge } from "../layout/layout.types";

type ViaPoint = { x: number; y: number };

export type JourneyEdgeLayerProps = {
  laneRef: RefObject<HTMLDivElement | null>;
  editorEnabled?: boolean;
  renderEdges: LayoutEdge[];
  effectiveItemMap: Record<string, JourneyItemNode>;
  parentCardSizes: Record<string, { width: number; height: number }>;

  selectedEdgeKey: string | null;
  selectedVia: ViaPoint[];
  selectedViaIndex: number | null;
  setSelectedViaIndex: Dispatch<SetStateAction<number | null>>;

  selectedEditorCardId: string | null;
  setSelectedEditorCardId: Dispatch<SetStateAction<string | null>>;

  onSelectEdge: (edgeKey: string, event: ReactPointerEvent<SVGPathElement>) => void;
  handleRemoveViaPoint: (edgeKey: string, index: number) => void;
  handleMoveViaPoint: (edgeKey: string, index: number, next: ViaPoint) => void;
};

const edgeKeyOf = (edge: { from: string; to: string }) => `${edge.from}->${edge.to}`;

export function JourneyEdgeLayer({
  laneRef,
  editorEnabled,
  renderEdges,
  effectiveItemMap,
  parentCardSizes,
  selectedEdgeKey,
  selectedVia,
  selectedViaIndex,
  setSelectedViaIndex,
  selectedEditorCardId,
  setSelectedEditorCardId,
  onSelectEdge,
  handleRemoveViaPoint,
  handleMoveViaPoint,
}: JourneyEdgeLayerProps) {
  return (
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
          onSelectEdge={onSelectEdge}
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

                const lane = laneRef.current;
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
  );
}
