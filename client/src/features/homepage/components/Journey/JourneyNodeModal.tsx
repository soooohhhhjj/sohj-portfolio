import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useJourneyModalState } from '../../hooks/useJourneyModalState';
import { JourneyModalBody, getJourneyModalMeta } from './modal/JourneyModalBody';
import type { JourneyItemNode } from './types/journey.types';

interface JourneyNodeModalProps {
  item: JourneyItemNode | null;
  parentChildren: JourneyItemNode[];
  navigationItems: JourneyItemNode[];
  onClose: () => void;
  onSelectItem: (item: JourneyItemNode) => void;
}

interface ChevronGlyphProps {
  direction: 'left' | 'right';
  className?: string;
  strokeWidth?: number;
  wingOffset?: number;
}

const modalEase: [number, number, number, number] = [0.12, 0.7, 0.63, 0.9];

function ChevronGlyph({ direction, className, strokeWidth = 2.5, wingOffset = 20 }: ChevronGlyphProps) {
  const tipX = direction === 'left' ? 8 : 16;
  const outerX = direction === 'left' ? 16 : 8;
  const points = `${outerX},${12 - wingOffset} ${tipX},12 ${outerX},${12 + wingOffset}`;

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getNavigationState(item: JourneyItemNode, navigationItems: JourneyItemNode[]) {
  const hasSequentialNavigation = navigationItems.length > 1;
  const currentNavigationIndex = hasSequentialNavigation
    ? navigationItems.findIndex((entry) => entry.id === item.id)
    : -1;
  const prevNavigationIndex = currentNavigationIndex > 0 ? currentNavigationIndex - 1 : navigationItems.length - 1;
  const nextNavigationIndex = currentNavigationIndex >= 0 ? (currentNavigationIndex + 1) % navigationItems.length : 0;

  return {
    hasSequentialNavigation,
    currentNavigationIndex,
    prevItem: navigationItems[prevNavigationIndex],
    nextItem: navigationItems[nextNavigationIndex],
  };
}

export default function JourneyNodeModal({
  item,
  parentChildren,
  navigationItems,
  onClose,
  onSelectItem,
}: JourneyNodeModalProps) {
  const isOpen = Boolean(item);
  const { isLgViewport, showNavigationChevrons } = useJourneyModalState(isOpen, onClose);

  if (!item) return null;

  const { modalTitle, modalTypeLabel, modalFrameClass } = getJourneyModalMeta(item);
  const navigationState = getNavigationState(item, navigationItems);
  const nextItemIsParent = navigationState.nextItem?.type === 'parent';

  const handlePrevItem = () => {
    if (!navigationState.hasSequentialNavigation || navigationState.currentNavigationIndex < 0) return;
    onSelectItem(navigationState.prevItem);
  };

  const handleNextItem = () => {
    if (!navigationState.hasSequentialNavigation || navigationState.currentNavigationIndex < 0) return;
    onSelectItem(navigationState.nextItem);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] overflow-hidden"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <div className="relative flex h-full items-center justify-center px-4 py-6" onClick={onClose}>
            <div className="relative flex w-[95vw] max-w-[70rem] items-center justify-center" onClick={(event) => event.stopPropagation()}>
              <div className="z-30 flex h-12 w-10 shrink-0 items-center justify-center sm:w-12">
                {navigationState.hasSequentialNavigation && showNavigationChevrons ? (
                  <motion.button
                    type="button"
                    onClick={handlePrevItem}
                    aria-label="Previous item"
                    initial={{ opacity: 0, x: 0, scale: 0.92 }}
                    animate={{ opacity: [0.15, 0.6, 0.15], x: [0, 3, 0], scale: 1 }}
                    whileHover={{ opacity: 1, scale: 1.06, x: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-flex h-9 w-9 items-center justify-center text-white/65 transition-colors hover:text-white"
                  >
                    <ChevronGlyph direction="left" className="h-9 w-7" />
                  </motion.button>
                ) : null}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.35, ease: modalEase }}
                role="dialog"
                aria-modal="true"
                aria-label="Journey details"
                className={`relative mx-auto max-h-[86vh] w-full max-w-5xl overflow-hidden ${modalFrameClass}`}
              >
                <div className="relative z-10 max-h-[86vh] touch-pan-y overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div
                    className={`z-20 flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6 ${
                      item.type === 'parent' ? 'relative bg-transparent' : 'sticky top-0 bg-black/30 backdrop-blur-md'
                    }`}
                  >
                    <div>
                      <p className="font-jura text-[11px] uppercase tracking-[1.8px] text-white/45">{modalTypeLabel}</p>
                      <h3 className="mt-1 font-anta text-xl text-white sm:text-2xl">{modalTitle}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close modal"
                      className="group p-2 text-white/45 transition-colors hover:text-white"
                    >
                      <X className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                    </button>
                  </div>

                  <JourneyModalBody
                    item={item}
                    parentChildren={parentChildren}
                    onSelectItem={onSelectItem}
                    isLgViewport={isLgViewport}
                  />
                </div>
              </motion.div>

              <div className="z-30 flex h-12 w-10 shrink-0 items-center justify-center sm:w-12">
                {navigationState.hasSequentialNavigation && showNavigationChevrons ? (
                  <motion.button
                    type="button"
                    onClick={handleNextItem}
                    aria-label="Next item"
                    initial={{ opacity: 0, x: 0, scale: 0.92 }}
                    animate={{ opacity: [0.15, 0.6, 0.15], x: [0, -3, 0], scale: 1 }}
                    whileHover={{ opacity: 1, scale: 1.06, x: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className={`inline-flex h-9 w-9 items-center justify-center transition-colors ${
                      nextItemIsParent ? 'text-yellow-400/90 hover:text-yellow-300' : 'text-white/65 hover:text-white'
                    }`}
                  >
                    <ChevronGlyph direction="right" className="h-9 w-7" />
                  </motion.button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
