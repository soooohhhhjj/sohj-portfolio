import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderKanban, Sparkles, X } from "lucide-react";
import { FaTag } from "react-icons/fa";
import { createPortal } from "react-dom";
import { GlassCard } from "../../../../shared/components/GlassCard";
import BouncingImage from "./ui/BouncingImage";
import type { JourneyItemNode } from "./types/journey.types";
import { getJourneyModalTechIcon } from "./ui/journeyModal.techIcons";

import "./CSS/journeyNodeModal.css";

interface JourneyNodeModalProps {
  item: JourneyItemNode | null;
  parentChildren: JourneyItemNode[];
  navigationItems: JourneyItemNode[];
  onClose: () => void;
  onSelectItem: (item: JourneyItemNode) => void;
}

interface IconRailItemProps {
  label: string;
  children: ReactNode;
  href?: string;
  disabled?: boolean;
  tooltipSide?: "left" | "right" | "top";
}

interface ChevronGlyphProps {
  direction: "left" | "right";
  className?: string;
  strokeWidth?: number;
  wingOffset?: number;
}

const modalEase: [number, number, number, number] = [0.12, 0.7, 0.63, 0.9];

const normalizeParentLabel = (id: string) =>
  `Milestone ${id.replace("node", "#")}`;

function ChevronGlyph({
  direction,
  className,
  strokeWidth = 2.5,
  wingOffset = 20,
}: ChevronGlyphProps) {
  const tipX = direction === "left" ? 8 : 16;
  const outerX = direction === "left" ? 16 : 8;
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

function IconRailItem({
  label,
  children,
  href,
  disabled,
  tooltipSide = "right",
}: IconRailItemProps) {
  const commonClassName =
    `journey-modal-rail-item inline-flex
    h-9 w-9
    items-center justify-center
    rounded
    border border-white/15
    bg-white/[0.03]
    text-white/80`;
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const updateTooltipPosition = () => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const offset = 10;
    const x =
      tooltipSide === "left"
        ? rect.left - offset
        : tooltipSide === "top"
          ? rect.left + rect.width / 2
          : rect.right + offset;
    const y =
      tooltipSide === "top" ? rect.top - offset : rect.top + rect.height / 2;
    setTooltipPos({ x, y });
  };

  return (
    <div
      ref={triggerRef}
      className="relative z-[420]"
      onMouseEnter={() => {
        updateTooltipPosition();
        setTooltipVisible(true);
      }}
      onMouseMove={updateTooltipPosition}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => {
        updateTooltipPosition();
        setTooltipVisible(true);
      }}
      onBlur={() => setTooltipVisible(false)}
    >
      {href && !disabled ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={commonClassName}
          aria-label={label}
        >
          {children}
        </a>
      ) : (
        <span
          className={`${commonClassName} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
          aria-label={label}
        >
          {children}
        </span>
      )}

      {tooltipVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[9999]
            whitespace-nowrap
            rounded border border-white/25
            bg-black
            px-2 py-1
            font-jura text-[11px] tracking-[0.4px] text-white
            shadow-[0_12px_28px_rgba(0,0,0,0.75)]"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform:
                tooltipSide === "left"
                  ? "translate(-100%, -50%)"
                  : tooltipSide === "top"
                    ? "translate(-50%, -100%)"
                    : "translate(0, -50%)",
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </div>
  );
}
export default function JourneyNodeModal({
  item,
  parentChildren,
  navigationItems,
  onClose,
  onSelectItem,
}: JourneyNodeModalProps) {
  const isOpen = Boolean(item);
  const [isLgViewport, setIsLgViewport] = useState(false);
  const [showNavigationChevrons, setShowNavigationChevrons] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const lockTargets = [html, body, root].filter(
      (node): node is HTMLElement => Boolean(node),
    );

    const previousStyles = new Map<
      HTMLElement,
      { overflow: string; overscrollBehavior: string }
    >();

    lockTargets.forEach((target) => {
      previousStyles.set(target, {
        overflow: target.style.overflow,
        overscrollBehavior: target.style.overscrollBehavior,
      });
      target.style.overflow = "hidden";
      target.style.overscrollBehavior = "none";
    });

    const scrollbarCompensation =
      window.innerWidth - document.documentElement.clientWidth;
    const originalBodyPaddingRight = body.style.paddingRight;
    if (scrollbarCompensation > 0) {
      body.style.paddingRight = `${scrollbarCompensation}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousStyles.forEach((styles, target) => {
        target.style.overflow = styles.overflow;
        target.style.overscrollBehavior = styles.overscrollBehavior;
      });
      body.style.paddingRight = originalBodyPaddingRight;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLgViewport(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setShowNavigationChevrons(false);
      return;
    }

    setShowNavigationChevrons(false);
    const timer = window.setTimeout(() => setShowNavigationChevrons(true), 360);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!item) return null;

  const isParent = item.type === "parent";
  const isInternship = item.type === "internship";
  const isPlaceholder = item.type === "placeholder";
  const ParentIcon = isParent ? item.icon : null;
  const modalTitle = isParent
    ? (item.title ?? normalizeParentLabel(item.id))
    : (item.title ?? "Journey Entry");
  const modalStory = item.modalDetails ?? item.details;
  const projectExperienceSummary =
    item.projectExperienceSummary ?? item.modalDetails ?? item.details;
  const projectExperienceSummaryStanzas = Array.isArray(projectExperienceSummary)
    ? projectExperienceSummary
    : projectExperienceSummary
      ? [projectExperienceSummary]
      : [];
  const placeholderProblemToAddress =
    item.modalProblemToAddress ?? item.details ?? "Problem statement to be defined.";
  const placeholderPlanSummarySource =
    item.modalPlannedFeatureSummary ?? item.modalDetails ?? "";
  const placeholderPlanSummaryItems = Array.isArray(placeholderPlanSummarySource)
    ? placeholderPlanSummarySource.map((entry) => entry.trim()).filter(Boolean)
    : placeholderPlanSummarySource
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean);
  const resolvedPlaceholderPlanSummaryItems =
    placeholderPlanSummaryItems.length > 0
      ? placeholderPlanSummaryItems
      : ["Planned feature summary to be defined."];
  const modalFrameClass = isParent
    ? "journey-modal-frame journey-modal-frame-parent"
    : "journey-modal-frame journey-modal-frame-child";
  const modalRadiusClass = isParent ? "rounded-[6px]" : "rounded-[7px]";
  const techTags = item.techTags ?? [];
  const highlightTags = item.highlightTags ?? [];
  const hasTechTags = techTags.length > 0;
  const hasHighlightTags = highlightTags.length > 0;
  const railTooltipSide: "left" | "top" = isLgViewport ? "left" : "top";
  const hasSequentialNavigation = navigationItems.length > 1;
  const currentNavigationIndex = hasSequentialNavigation
    ? navigationItems.findIndex((entry) => entry.id === item.id)
    : -1;
  const prevNavigationIndex =
    currentNavigationIndex > 0
      ? currentNavigationIndex - 1
      : navigationItems.length - 1;
  const nextNavigationIndex =
    currentNavigationIndex >= 0
      ? (currentNavigationIndex + 1) % navigationItems.length
      : 0;
  const nextItemIsParent =
    hasSequentialNavigation &&
    currentNavigationIndex >= 0 &&
    navigationItems[nextNavigationIndex]?.type === "parent";

  const handlePrevItem = () => {
    if (!hasSequentialNavigation || currentNavigationIndex < 0) return;
    onSelectItem(navigationItems[prevNavigationIndex]);
  };

  const handleNextItem = () => {
    if (!hasSequentialNavigation || currentNavigationIndex < 0) return;
    onSelectItem(navigationItems[nextNavigationIndex]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] overflow-hidden"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div
            className="relative flex h-full items-center justify-center px-4 py-6"
            onClick={onClose}
          >
            <div
              className="relative flex w-[95vw] max-w-[70rem] items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="z-30 flex h-12 w-10 shrink-0 items-center justify-center sm:w-12">
                {hasSequentialNavigation && showNavigationChevrons && (
                  <motion.button
                    type="button"
                    onClick={handlePrevItem}
                    aria-label="Previous item"
                    initial={{ opacity: 0, x: 0, scale: 0.92 }}
                    animate={{ opacity: [0.15, 0.6, 0.15], x: [0, 3, 0], scale: 1 }}
                    whileHover={{ opacity: 1, scale: 1.06, x: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="journey-modal-nav-btn inline-flex
                    h-9 w-9
                    items-center justify-center
                    text-white/65"
                  >
                    <ChevronGlyph direction="left" className="h-9 w-7" />
                  </motion.button>
                )}
              </div>

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.35, ease: modalEase }}
              role="dialog"
              aria-modal="true"
              aria-label="Journey details"
              className={`relative z-[140]
              mx-auto w-full
              max-w-5xl max-h-[86vh]
              overflow-hidden
              ${modalRadiusClass}
              ${modalFrameClass}`}
            >
              <div
                className="relative z-10
                max-h-[86vh]
                touch-pan-y overflow-y-auto overscroll-contain
                [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
              <div
                className={`z-20 flex items-center justify-between
                border-b border-white/10
                px-5 py-4 sm:px-6
                ${
                  isParent
                    ? "relative bg-transparent backdrop-blur-0"
                    : "sticky top-0 bg-black/30 backdrop-blur-md"
                }`}
              >
                <div>
                  <p className="font-jura text-[11px] uppercase tracking-[1.8px] text-white/45">
                    {isParent ? "Parent Node" : "Child Node"}
                  </p>
                  <h3 className="mt-1 font-anta text-xl text-white sm:text-2xl">
                    {modalTitle}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="journey-modal-close-btn p-2 text-white/45"
                >
                  <X className="journey-modal-close-icon h-5 w-5" />
                </button>
              </div>

              {isParent ? (
                <div className="relative p-5 sm:p-6">
                  <div className="relative rounded-[6px] p-5 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-white/[0.03]">
                        {ParentIcon ? (
                          <ParentIcon
                            className="h-7 w-7 text-white/85"
                            strokeWidth={1.35}
                          />
                        ) : (
                          <Sparkles className="h-7 w-7 text-white/85" />
                        )}
                      </div>

                      <div>
                        {modalStory && (
                          <p className="font-jura text-sm leading-relaxed text-white/70">
                            {modalStory}
                          </p>
                        )}
                        <p className="mt-1 font-jura text-xs text-white/45">
                          {parentChildren.length} connected item
                          {parentChildren.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {parentChildren.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectItem(child)}
                        className="journey-modal-child-link relative memory-card
                        rounded-[7px] p-4
                        text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-anta text-lg leading-tight text-white/90">
                              {child.title ?? child.id}
                            </p>
                            {child.details && (
                              <p className="mt-2 line-clamp-2 font-jura text-xs text-white/55">
                                {child.details}
                              </p>
                            )}
                          </div>
                          <FolderKanban className="journey-modal-child-icon mt-1 h-4 w-4 text-white/35" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : isPlaceholder ? (
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                      <p className="font-jura text-[11px] uppercase tracking-[1.7px] text-white/45">
                        Problem to Address
                      </p>
                      <p className="mt-3 font-jura text-sm leading-relaxed text-white/75 sm:text-[14px]">
                        {placeholderProblemToAddress}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                      <p className="font-jura text-[11px] uppercase tracking-[1.7px] text-white/45">
                        Planned Feature Summary
                      </p>
                      <ul className="mt-3 list-disc space-y-2 pl-5 font-jura text-sm leading-relaxed text-white/75 sm:text-[14px]">
                        {resolvedPlaceholderPlanSummaryItems.map((point, index) => (
                          <li key={`placeholder-plan-${index}`}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 md:[grid-template-columns:minmax(0,1fr)_300px] lg:[grid-template-columns:minmax(0,1fr)_300px_max-content]">
                    <div className="relative z-10 md:sticky md:top-4 md:h-full">
                      {item.image && (
                        <GlassCard
                          corner="rounded-[3px]"
                          shadow="shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                          className={`w-full h-full overflow-hidden bg-black/30 ${
                            isInternship ? "h-[240px] sm:h-[280px] md:h-[334px]" : ""
                          }`}
                        >
                          {isInternship ? (
                            <BouncingImage src={item.image} />
                          ) : (
                            <img
                              src={item.image}
                              alt={item.title ?? "Journey preview"}
                              className="h-full w-full object-cover object-top"
                              draggable={false}
                            />
                          )}
                        </GlassCard>
                      )}
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex min-h-0 max-h-[52vh] flex-col overflow-y-auto overscroll-contain touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:col-start-2 md:row-span-2 lg:col-start-2 lg:row-span-1">
                      <p className="font-jura text-[11px] uppercase tracking-[1.7px] text-white/45">
                        Project Experience Summary
                      </p>

                      {projectExperienceSummaryStanzas.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {projectExperienceSummaryStanzas.map((stanza, index) => (
                            <p
                              key={`summary-stanza-${index}`}
                              className="font-jura text-sm leading-relaxed text-white/75 sm:text-[14px]"
                            >
                              {stanza}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 font-jura text-sm leading-relaxed text-white/45">
                          Add `projectExperienceSummary` in the journey data to
                          show a concise overview here.
                        </p>
                      )}
                    </div>

                    <div className="relative z-[430] w-full rounded-[6px] border border-white/10 bg-white/[0.02] px-2 py-2 flex flex-row items-center justify-between gap-3 md:col-start-1 md:row-start-2 md:w-full md:max-h-[72vh] md:flex md:flex-row md:items-center md:justify-between md:gap-3 md:overflow-visible lg:col-start-3 lg:row-start-1 lg:w-fit lg:sticky lg:top-4 lg:max-h-[72vh] lg:flex-col lg:items-stretch lg:justify-start lg:gap-0">
                      <div className="flex-1 overflow-x-auto overflow-y-visible overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible">
                        <div className="flex flex-row items-center justify-start gap-2 flex-nowrap lg:flex-col lg:flex-nowrap lg:justify-center">
                          {hasTechTags &&
                            techTags.map((tag) => (
                              <IconRailItem
                                key={`tech-${tag}`}
                                label={tag}
                                tooltipSide={railTooltipSide}
                              >
                                {getJourneyModalTechIcon(tag)}
                              </IconRailItem>
                            ))}

                          {hasTechTags && hasHighlightTags && (
                            <>
                              <span className="h-7 w-px bg-white/15 lg:hidden" />
                              <span className="hidden h-px w-7 bg-white/15 lg:block" />
                            </>
                          )}

                          {hasHighlightTags &&
                            highlightTags.map((tag, index) => (
                              <IconRailItem
                                key={`tag-${tag}`}
                                label={tag}
                                tooltipSide={railTooltipSide}
                              >
                                <span className="relative inline-flex">
                                  <FaTag className="h-3.5 w-3.5 text-white/90" />
                                  <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-white/20 bg-black/90 px-1 font-jura text-[9px] leading-none text-white/90">
                                    {index + 1}
                                  </span>
                                </span>
                              </IconRailItem>
                            ))}
                        </div>
                      </div>

                      {/* Temporarily hidden project action buttons:
                          - View Live
                          - See Project Details
                          Keep this block for easy re-enable later.
                      */}
                      {/*
                        {!isInternship && (
                          <div className="mt-0 border-l border-white/15 pl-3 pt-0 md:mt-0 md:border-t-0 md:border-l md:pl-3 md:pt-0 lg:mt-3 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-[7px] ">
                            <div className="flex flex-row items-center justify-end gap-2 flex-nowrap lg:flex-col lg:justify-center">
                              <IconRailItem
                                label="View Live"
                                href={item.viewLiveUrl}
                                disabled={!item.viewLiveUrl}
                                tooltipSide={railTooltipSide}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </IconRailItem>

                              <IconRailItem
                                label="See Project Details"
                                href={item.projectDetailsUrl}
                                disabled={!item.projectDetailsUrl}
                                tooltipSide={railTooltipSide}
                              >
                                <FileText className="h-4 w-4" />
                              </IconRailItem>
                            </div>
                          </div>
                        )}
                      */}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </motion.div>

            <div className="z-30 flex h-12 w-10 shrink-0 items-center justify-center sm:w-12">
              {hasSequentialNavigation && showNavigationChevrons && (
                <motion.button
                  type="button"
                  onClick={handleNextItem}
                  aria-label="Next item"
                  initial={{ opacity: 0, x: 0, scale: 0.92 }}
                  animate={{ opacity: [0.15, 0.6, 0.15], x: [0, -3, 0], scale: 1 }}
                  whileHover={{ opacity: 1, scale: 1.06, x: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className={`journey-modal-nav-btn inline-flex
                  h-9 w-9
                  items-center justify-center
                  ${nextItemIsParent ? "journey-modal-nav-btn--parent" : ""}
                  ${
                    nextItemIsParent
                      ? "text-yellow-400/90"
                      : "text-white/65"
                  }`}
                >
                  <ChevronGlyph direction="right" className="h-9 w-7" />
                </motion.button>
              )}
            </div>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


