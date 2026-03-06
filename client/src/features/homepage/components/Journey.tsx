import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import type { Ref } from 'react';
import './Journey/CSS/Journey.css';

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface Props {
  shouldShow: boolean;
  contentRef?: Ref<HTMLDivElement>;
}

export default function Journey({ shouldShow, contentRef }: Props) {
  return (
    <motion.section
      initial={{ y: '100vh' }}
      animate={{ y: shouldShow ? 0 : '100vh' }}
      transition={{ duration: 1.35, ease: easeSmooth, delay: 0.1 }}
      className={`journey-section ${shouldShow ? 'journey-section--visible' : 'journey-section--hidden'}`}
    >
      <div ref={contentRef} className="journey-placeholder section-content responsiveness" />
    </motion.section>
  );
}
