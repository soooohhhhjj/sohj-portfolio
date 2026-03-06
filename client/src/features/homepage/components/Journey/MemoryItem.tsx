import { motion } from 'framer-motion';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { JourneyItemNode } from './types/journey.types';

interface MemoryItemProps extends JourneyItemNode {
  onSelect?: (item: JourneyItemNode) => void;
  isEditMode?: boolean;
  isDragging?: boolean;
  onStarPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>, item: JourneyItemNode) => void;
}

export default function MemoryItem(props: MemoryItemProps) {
  const { id, title, type, x, y, onSelect, isEditMode = false, isDragging = false, onStarPointerDown } = props;
  const isParentStar = type === 'parent';

  const handleItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(props);
    }
  };

  return (
    <motion.button
      type="button"
      className={`memory-node absolute left-0 top-0 flex items-center justify-center ${
        isParentStar ? 'memory-node--parent' : 'memory-node--child'
      } ${isEditMode ? 'memory-node--editable' : ''} ${isDragging ? 'memory-node--dragging' : ''}`}
      initial={false}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.55 }}
      onClick={() => onSelect?.(props)}
      onKeyDown={handleItemKeyDown}
      onPointerDown={(event) => onStarPointerDown?.(event, props)}
      aria-label={`Open ${title ?? id} details`}
    >
      <span className="memory-node__halo" aria-hidden="true" />
      <span className="memory-node__glow" aria-hidden="true" />
      <span className="memory-node__core" aria-hidden="true" />
      {isParentStar && title ? <span className="memory-node__label">{title}</span> : null}
    </motion.button>
  );
}
