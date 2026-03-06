import MemoryItem from './MemoryItem';
import MemoryPath from './MemoryPath';
import JourneyNodeModal from './JourneyNodeModal';
import { useJourneyConstellation } from '../../hooks/useJourneyConstellation';

import './CSS/memoryLane.css';

interface MemoryLaneProps {
  isEditMode?: boolean;
  onModalOpenChange?: (isOpen: boolean) => void;
}

export default function MemoryLane({ isEditMode = false, onModalOpenChange }: MemoryLaneProps) {
  const {
    items,
    itemMap,
    edges,
    laneRef,
    laneSizeClassName,
    draggingId,
    selectedItem,
    selectedParentChildren,
    handleItemSelect,
    handleStarPointerDown,
    handleCloseModal,
    handleSelectModalItem,
  } = useJourneyConstellation({
    isEditMode,
    onModalOpenChange,
  });

  return (
    <div ref={laneRef} className={`memory-lane constellation-lane relative w-full ${laneSizeClassName}`}>
      <svg className="absolute inset-0 h-full w-full pointer-events-none">
        {edges.map((edge, index) => (
          <MemoryPath key={`${edge.from}-${edge.to}-${index}`} edge={edge} items={itemMap} />
        ))}
      </svg>

      {items.map((item) => (
        <MemoryItem
          key={item.id}
          {...item}
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
          navigationItems={items}
          onClose={handleCloseModal}
          onSelectItem={handleSelectModalItem}
        />
      ) : null}
    </div>
  );
}
