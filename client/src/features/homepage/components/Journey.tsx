import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import type { Ref } from 'react';
import MemoryLane from './Journey/MemoryLane';
import './Journey/CSS/Journey.css';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface Props {
  shouldShow: boolean;
  isEditMode?: boolean;
  contentRef?: Ref<HTMLDivElement>;
  onModalOpenChange?: (isOpen: boolean) => void;
}

export default function Journey({
  shouldShow,
  isEditMode = false,
  contentRef,
  onModalOpenChange,
}: Props) {
  return (
    <motion.section
      initial={{ y: '100vh' }}
      animate={{ y: shouldShow ? 0 : '100vh' }}
      transition={{ duration: 1.35, ease: easeSmooth, delay: 0.1 }}
      className={`journey-section ${shouldShow ? 'journey-section--visible' : 'journey-section--hidden'}`}
    >
      <div ref={contentRef} className="journey-shell section-content">
        <div className="journey-shell__layer journey-shell__layer--diagonal" />
        <div className="journey-shell__layer journey-shell__layer--vertical" />
        <div className="journey-shell__layer journey-shell__layer--inner-shadow" />
        {isEditMode ? <div className="journey-shell__edit-mask" /> : null}
        <div className="journey-shell__content responsiveness">
          <MemoryLane isEditMode={isEditMode} onModalOpenChange={onModalOpenChange} />
        </div>
      </div>
    </motion.section>
  );
}
