// src/features/home/components/Journey.tsx
import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import type { Ref } from "react";
import MemoryLane from "./Journey/MemoryLane";

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
      initial={{ y: "100vh" }}
      animate={{ y: shouldShow ? 0 : "100vh" }}
      transition={{ duration: 1.35, ease: easeSmooth, delay: 0.1 }}
      className={`section-style relative flex flex-col ${
        shouldShow ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        ref={contentRef}
        className="section-content relative mt-20 min-h-[90vh] overflow-hidden border-t border-b border-white/20 bg-white/[0.03] backdrop-blur-md"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.09] via-white/[0.03] to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.12),inset_0_0_36px_rgba(255,255,255,0.05)]" />
        {isEditMode ? (
          <div className="pointer-events-none absolute inset-0 z-[11] bg-white/5" />
        ) : null}
        <div className="responsiveness relative z-10 h-full w-full py-8 lg:py-12">
          <MemoryLane
            isEditMode={isEditMode}
            onModalOpenChange={onModalOpenChange}
          />
        </div>
      </div>
    </motion.section>
  );
}
