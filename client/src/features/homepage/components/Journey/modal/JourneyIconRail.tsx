import type { ReactNode } from 'react';
import { FaTag } from 'react-icons/fa';
import { getJourneyModalTechIcon } from '../ui/journeyModal.techIcons';

interface JourneyIconRailProps {
  techTags: string[];
  highlightTags: string[];
  isLgViewport: boolean;
}

interface RailItemProps {
  label: string;
  children: ReactNode;
  tooltipSide: 'left' | 'top';
}

function RailItem({ label, children, tooltipSide }: RailItemProps) {
  return (
    <div className="journey-rail-item group relative inline-flex">
      <span
        className="journey-rail-trigger inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 bg-white/5 text-white/80 transition hover:border-white/35 hover:text-white"
        aria-label={label}
      >
        {children}
      </span>
      <span
        className={`journey-rail-tooltip journey-rail-tooltip--${tooltipSide} pointer-events-none absolute whitespace-nowrap rounded border border-white/25 bg-black px-2 py-1 font-jura text-[11px] tracking-[0.4px] text-white opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.75)] transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {label}
      </span>
    </div>
  );
}

export function JourneyIconRail({ techTags, highlightTags, isLgViewport }: JourneyIconRailProps) {
  const tooltipSide = isLgViewport ? 'left' : 'top';
  const hasTechTags = techTags.length > 0;
  const hasHighlightTags = highlightTags.length > 0;

  return (
    <div className="relative z-30 w-full rounded-[6px] border border-white/10 bg-white/5 px-2 py-2 md:col-start-1 md:row-start-2 lg:col-start-3 lg:row-start-1 lg:w-fit lg:sticky lg:top-4">
      <div className="flex-1 overflow-x-auto overflow-y-visible overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible">
        <div className="flex flex-row items-center justify-start gap-2 lg:flex-col lg:justify-center">
          {hasTechTags
            ? techTags.map((tag) => (
                <RailItem key={`tech-${tag}`} label={tag} tooltipSide={tooltipSide}>
                  {getJourneyModalTechIcon(tag)}
                </RailItem>
              ))
            : null}

          {hasTechTags && hasHighlightTags ? (
            <>
              <span className="h-7 w-px bg-white/15 lg:hidden" />
              <span className="hidden h-px w-7 bg-white/15 lg:block" />
            </>
          ) : null}

          {hasHighlightTags
            ? highlightTags.map((tag, index) => (
                <RailItem key={`tag-${tag}`} label={tag} tooltipSide={tooltipSide}>
                  <span className="relative inline-flex">
                    <FaTag className="h-3.5 w-3.5 text-white/90" />
                    <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-white/20 bg-black/90 px-1 font-jura text-[9px] leading-none text-white/90">
                      {index + 1}
                    </span>
                  </span>
                </RailItem>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
