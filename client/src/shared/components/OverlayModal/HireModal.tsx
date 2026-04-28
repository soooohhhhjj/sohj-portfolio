import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { AnimatedCloseIcon } from '../AnimatedCloseIcon/AnimatedCloseIcon';
import { useLockedOverlayScroll } from '../../hooks/useLockedOverlayScroll';
import './hire-modal.css';

interface HireModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function HireModal({ isOpen, onClose, children }: HireModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useLockedOverlayScroll(isOpen, onClose);

  // Initialize Lenis for the modal content when it opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      lenisRef.current = new Lenis({
        wrapper: contentRef.current,
        content: contentRef.current.firstElementChild as HTMLElement,
        lerp: 0.1,
        wheelMultiplier: 1,
        touchMultiplier: 1,
      });

      let frameId: number;
      const tick = (time: number) => {
        lenisRef.current?.raf(time);
        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(frameId);
        lenisRef.current?.destroy();
        lenisRef.current = null;
      };
    }
  }, [isOpen]);

  // Forward wheel events from the outer modal to Lenis with smooth animation
  const handleWheel = (e: React.WheelEvent) => {
    if (lenisRef.current) {
      e.preventDefault();
      lenisRef.current.scrollTo(lenisRef.current.scroll + e.deltaY);
    }
  };

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="terminal-screen fixed inset-0 z-[90] flex flex-col border border-[#30363d]"
          data-lenis-prevent=""
          data-lenis-prevent-wheel=""
          data-lenis-prevent-touch=""
          onClick={onClose}
          onWheel={handleWheel}
        >
          <div
            className="mx-auto flex h-full w-full max-w-[310px] flex-col
            xxsm:max-w-[360px] xsm:max-w-[410px] sm:max-w-[580px]
            md:max-w-[700px] lg:max-w-[800px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="screen-topbar">
              <div
                className="mt-14 flex w-full items-center justify-between"
              >
                <p className="terminal-title">Subject: Role & Availability</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="group terminal-x"
                  aria-label="Close modal"
                >
                  <AnimatedCloseIcon size={22} strokeWidth={1.9} />
                </button>
              </div>
            </div>

            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hire-availability-title"
            >
              <div className="terminal-text">
                <h2 id="hire-availability-title" className="sr-only">
                  Role and Availability
                </h2>
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
