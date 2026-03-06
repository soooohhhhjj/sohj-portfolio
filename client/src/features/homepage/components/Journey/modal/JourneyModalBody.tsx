import { FolderKanban, Sparkles } from 'lucide-react';
import { GlassCard } from '../../../../../shared/components/GlassCard';
import BouncingImage from '../ui/BouncingImage';
import type { JourneyItemNode } from '../types/journey.types';
import { JourneyIconRail } from './JourneyIconRail';

interface JourneyModalBodyProps {
  item: JourneyItemNode;
  parentChildren: JourneyItemNode[];
  onSelectItem: (item: JourneyItemNode) => void;
  isLgViewport: boolean;
}

const normalizeParentLabel = (id: string) => `Milestone ${id.replace('node', '#')}`;

function ParentBody({ item, parentChildren, onSelectItem }: JourneyModalBodyProps) {
  const ParentIcon = item.icon;
  const modalStory = item.modalDetails ?? item.details;

  return (
    <div className="relative p-5 sm:p-6">
      <div className="relative memory-node rounded-[6px] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-white/5">
            {ParentIcon ? (
              <ParentIcon className="h-7 w-7 text-white/85" strokeWidth={1.35} />
            ) : (
              <Sparkles className="h-7 w-7 text-white/85" />
            )}
          </div>

          <div>
            {modalStory ? <p className="font-jura text-sm leading-relaxed text-white/70">{modalStory}</p> : null}
            <p className="mt-1 font-jura text-xs text-white/45">
              {parentChildren.length} connected item{parentChildren.length === 1 ? '' : 's'}
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
            className="group relative memory-card rounded-[7px] p-4 text-left transition-all duration-200 hover:bg-white/10 hover:shadow-[0_0_16px_rgba(255,255,255,0.22),0_0_44px_rgba(120,220,255,0.16)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-anta text-lg leading-tight text-white/90">{child.title ?? child.id}</p>
                {child.details ? <p className="mt-2 line-clamp-2 font-jura text-xs text-white/55">{child.details}</p> : null}
              </div>
              <FolderKanban className="mt-1 h-4 w-4 text-white/35 transition-colors group-hover:text-yellow-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlaceholderBody({ item }: JourneyModalBodyProps) {
  const problemToAddress = item.modalProblemToAddress ?? item.details ?? 'Problem statement to be defined.';
  const planSummarySource = item.modalPlannedFeatureSummary ?? item.modalDetails ?? '';
  const planSummaryItems = Array.isArray(planSummarySource)
    ? planSummarySource.map((entry) => entry.trim()).filter(Boolean)
    : planSummarySource
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);

  return (
    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 sm:p-5">
          <p className="font-jura text-[11px] uppercase tracking-[1.7px] text-white/45">Problem to Address</p>
          <p className="mt-3 font-jura text-sm leading-relaxed text-white/75 sm:text-[14px]">{problemToAddress}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4 sm:p-5">
          <p className="font-jura text-[11px] uppercase tracking-[1.7px] text-white/45">Planned Feature Summary</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-jura text-sm leading-relaxed text-white/75 sm:text-[14px]">
            {(planSummaryItems.length > 0 ? planSummaryItems : ['Planned feature summary to be defined.']).map((point, index) => (
              <li key={`placeholder-plan-${index}`}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProjectBody({ item, isLgViewport }: JourneyModalBodyProps) {
  const isInternship = item.type === 'internship';
  const techTags = item.techTags ?? [];
  const highlightTags = item.highlightTags ?? [];
  const summarySource = item.projectExperienceSummary ?? item.modalDetails ?? item.details;
  const summaryStanzas = Array.isArray(summarySource) ? summarySource : summarySource ? [summarySource] : [];

  return (
    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:[grid-template-columns:minmax(0,1fr)_300px] lg:[grid-template-columns:minmax(0,1fr)_300px_max-content]">
        <div className="relative z-10 md:sticky md:top-4 md:h-full">
          {item.image ? (
            <GlassCard
              corner="rounded-[3px]"
              shadow="shadow-[0_0_10px_rgba(255,255,255,0.15)]"
              className={`w-full overflow-hidden bg-black/30 ${isInternship ? 'h-[240px] sm:h-[280px] md:h-[334px]' : 'h-full'}`}
            >
              {isInternship ? (
                <BouncingImage src={item.image} />
              ) : (
                <img
                  src={item.image}
                  alt={item.title ?? 'Journey preview'}
                  className="h-full w-full object-cover object-top"
                  draggable={false}
                />
              )}
            </GlassCard>
          ) : null}
        </div>

        <div className="flex min-h-0 max-h-[52vh] flex-col overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4 overscroll-contain touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:col-start-2 md:row-span-2 lg:col-start-2 lg:row-span-1">
          <p className="font-jura text-[11px] uppercase tracking-[1.7px] text-white/45">Project Experience Summary</p>

          {summaryStanzas.length > 0 ? (
            <div className="mt-3 space-y-3">
              {summaryStanzas.map((stanza, index) => (
                <p key={`summary-stanza-${index}`} className="font-jura text-sm leading-relaxed text-white/75 sm:text-[14px]">
                  {stanza}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 font-jura text-sm leading-relaxed text-white/45">
              Add `projectExperienceSummary` in the journey data to show a concise overview here.
            </p>
          )}
        </div>

        <JourneyIconRail techTags={techTags} highlightTags={highlightTags} isLgViewport={isLgViewport} />
      </div>
    </div>
  );
}

export function JourneyModalBody(props: JourneyModalBodyProps) {
  if (props.item.type === 'parent') {
    return <ParentBody {...props} />;
  }

  if (props.item.type === 'placeholder') {
    return <PlaceholderBody {...props} />;
  }

  return <ProjectBody {...props} />;
}

export function getJourneyModalMeta(item: JourneyItemNode) {
  const isParent = item.type === 'parent';

  return {
    isParent,
    modalTitle: isParent ? item.title ?? normalizeParentLabel(item.id) : item.title ?? 'Journey Entry',
    modalTypeLabel: isParent ? 'Parent Node' : 'Child Node',
    modalFrameClass: isParent ? 'journey-modal-frame journey-modal-frame-parent' : 'journey-modal-frame journey-modal-frame-child',
  };
}
