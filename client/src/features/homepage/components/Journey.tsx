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
      className={`relative flex flex-col
      min-h-screen pt-[72px]
      ${shouldShow ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {import.meta.env.DEV && editorEnabled ? (
        <div
          className="fixed inset-0 z-[1000] pointer-events-none
          border-2 border-emerald-400/65
          shadow-[inset_0_0_0_1px_rgba(52,211,153,0.18)]"
        />
      ) : null}

      <div
        className="journey-shell relative w-full
        mt-20 overflow-hidden
        border-y border-white/20"
      >
        <div className="pointer-events-none absolute inset-0 hidden" />
        <div className="pointer-events-none absolute inset-0 hidden" />
        <div className="journey-shell__inner-shadow pointer-events-none absolute inset-0" />

        <div
          ref={contentRef}
          className="relative z-[1] w-full
          mx-auto
          max-w-content-dinosaur xxsm:max-w-content-xxsm xsm:max-w-content-xsm
          sm:max-w-content-sm md:max-w-content-md lg:max-w-content-lg xl:max-w-content-xl
          pt-10 pb-24 lg:pt-12 lg:pb-32"
        >
          <div
            className="mx-auto mb-12
            max-w-[48rem]
            px-5 lg:px-0
            text-center"
          >
            <h2
              className="journey-map__title font-bruno
              text-[40px] sm:text-[47px] md:text-[55px]
              mt-[22px] sm:mt-[26px] md:mt-[30px]
              tracking-[.2px]
              text-[var(--base-text-color)]"
            >
              My Journey
            </h2>
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
