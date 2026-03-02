// src/features/home/components/Journey.tsx
import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import type { Ref } from "react";
import "./Journey/CSS/Journey.css";
import MemoryLane from "./Journey/MemoryLane";

const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];

interface Props {
  shouldShow: boolean;
  contentRef?: Ref<HTMLDivElement>;
  onModalOpenChange?: (isOpen: boolean) => void;
}

export default function Journey({
  shouldShow,
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
      {/* Fade-in buffer (adjust stops here) */}
      <div
        className="
          h-52 w-full
          bg-gradient-to-b
          from-transparent from-[0%]
          to-[#0b0b0fc9] to-[100%]
        "
      />

      {/* Content area */}
      <div
        ref={contentRef}
        className="section-content bg-[#0b0b0fc9] flex flex-col relative z-10"
      >
        <div className="responsiveness">
          {/* TITLE */}
          <div className="text-center">
            <h1 className="font-bruno 
            lg:mt-[90px]
            text-[35px] sm:text-[38px] lg:text-5xl
            font-bold
            tracking-[2px] 
            text-white journey-header">
              My Journey
            </h1>

            <p className="lg:mt-[12px] 
            text-[13px] sm:text-[16px] lg:text-[17px]
            max-w-[80%] md:max-w-[100%] mx-auto
             text-white tracking-[.3px] font-jura journey-subheader">
              A timeline of my growth, learning process, and projects over the years.
            </p>
          </div>

          {/* <MemoryLane /> */}
          <div className="mt-0 lg:mt-24">
            <MemoryLane onModalOpenChange={onModalOpenChange} />
          </div>

        </div>
      </div>
      
    {/* Fade-in buffer (adjust stops here) */}
      <div
        className="
          h-52 w-full
          bg-gradient-to-b
          from-[#0b0b0fc9] from-[0%]
          to-transparent to-[100%]
        "
      />
    </motion.section>
  );
}
