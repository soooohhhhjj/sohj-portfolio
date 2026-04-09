import { motion, type Easing } from 'framer-motion';
import { useRef, type Ref } from 'react';
import './Journey/CSS/Journey.css';
import MemoryLane from './Journey/MemoryLane';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface Props {
  shouldShow: boolean;
  contentRef?: Ref<HTMLDivElement>;
  editorEnabled?: boolean;
}

export default function Journey({ shouldShow, contentRef, editorEnabled }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <motion.section
      ref={sectionRef}
      initial={{ y: '100vh' }}
      animate={{ y: shouldShow ? 0 : '100vh' }}
      transition={{ duration: 1.35, ease: easeSmooth, delay: 0.1 }}
      className={`journey-section ${shouldShow ? 'journey-section--visible' : 'journey-section--hidden'}`}
    >
      {import.meta.env.DEV && editorEnabled ? <div className="journey-editor-border" /> : null}

      <div className="journey-shell">
        <div className="journey-shell__layer journey-shell__layer--diagonal" />
        <div className="journey-shell__layer journey-shell__layer--vertical" />
        <div className="journey-shell__layer journey-shell__layer--inner-shadow" />

        <div ref={contentRef} className="journey-shell__content journey-map responsiveness">
          <div className="journey-map__hero">
            <h2 className="journey-map__title">My Journey</h2>
          </div>

          <MemoryLane
            editorEnabled={import.meta.env.DEV && Boolean(editorEnabled)}
            editorActive={shouldShow}
          />
        </div>
      </div>
    </motion.section>
  );
}
