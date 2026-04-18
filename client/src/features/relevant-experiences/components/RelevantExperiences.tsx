import { motion, type Easing } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { BriefcaseBusiness, Check, FolderKanban, Pencil } from 'lucide-react';
import { AnimatedCloseIcon } from '../../../shared/components/AnimatedCloseIcon/AnimatedCloseIcon';
import { GlassCard } from '../../../shared/components/GlassCard';
import { OverlayModal } from '../../../shared/components/OverlayModal/OverlayModal';
import { Section, SectionContent } from '../../../shared/components/Container';
import { BREAKPOINTS, CONTENT_MAX_WIDTH } from '../../../shared/constants/breakpoints';
import { useRelevantExperiencesEditorState } from '../hooks/useRelevantExperiencesEditorState';
import { RelevantExperienceConnections } from './RelevantExperienceConnections';
import { getRenderableConnectionPoints } from './experienceConnections';
import { truncateToFit } from './truncateToFit';
import type {
  RelevantExperienceConnection,
  RelevantExperienceConnectionAnchor,
  RelevantExperienceConnectionPoint,
  RelevantExperienceNode,
  RelevantExperienceNodeLayout,
} from './relevantExperiences.types';
import './RelevantExperiences.css';

type RelevantExperiencesProps = { editorEnabled?: boolean; shouldAnimate?: boolean };

const HUD_POS_STORAGE_KEY = 'sohj.debug.relevantExperiences.hudPos.v1';
const HUD_MINIMIZED_STORAGE_KEY = 'sohj.debug.relevantExperiences.hudMinimized.v1';
const MIN_CARD_WIDTH = 200;
const MIN_CARD_HEIGHT = 170;
const MIN_CANVAS_WIDTH = 930;
const MIN_CANVAS_HEIGHT = 0;
const CONNECTION_ANCHORS: RelevantExperienceConnectionAnchor[] = ['top', 'right', 'bottom', 'left'];
const easeSmooth: Easing = [0.12, 0.7, 0.63, 0.9];
const RE_MODAL_ANIMATION_DURATION_MS = 220;

function readLocalStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function resolveAssetPath(path?: string) {
  return path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : undefined;
}

function resolveCanvasHeight(nodes: RelevantExperienceNode[]) {
  const furthestBottom = nodes.reduce((maxBottom, node) => (
    Math.max(maxBottom, node.layout.y + node.layout.height)
  ), 0);

  return Math.max(MIN_CANVAS_HEIGHT, furthestBottom);
}

function clampNodeLayoutToCanvas(layout: RelevantExperienceNodeLayout, canvasHeight: number) {
  const width = Math.min(Math.max(MIN_CARD_WIDTH, layout.width), MIN_CANVAS_WIDTH);
  const height = Math.min(Math.max(MIN_CARD_HEIGHT, layout.height), Math.max(MIN_CARD_HEIGHT, canvasHeight));

  return {
    x: Math.min(Math.max(0, layout.x), Math.max(0, MIN_CANVAS_WIDTH - width)),
    y: Math.min(Math.max(0, layout.y), Math.max(0, canvasHeight - height)),
    width,
    height,
  };
}

function clampCanvasPoint(point: RelevantExperienceConnectionPoint, canvasHeight: number) {
  return {
    x: Math.min(Math.max(0, Math.round(point.x)), MIN_CANVAS_WIDTH),
    y: Math.min(Math.max(0, Math.round(point.y)), canvasHeight),
  };
}

function snapConnectionPointTowards(
  point: RelevantExperienceConnectionPoint,
  target: RelevantExperienceConnectionPoint,
) {
  const dx = point.x - target.x;
  const dy = point.y - target.y;

  return Math.abs(dx) >= Math.abs(dy)
    ? { x: point.x, y: target.y }
    : { x: target.x, y: point.y };
}

function createConnectionId() {
  return `connection-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTagsForEditor(tags?: string[]) {
  return tags?.join(', ') ?? '';
}

function parseTagsFromEditor(value: string) {
  const nextTags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return nextTags.length > 0 ? nextTags : undefined;
}

function createItemDraft(entries?: string[]) {
  return entries?.length ? [...entries] : [''];
}

function sanitizeItemDraft(entries: string[]) {
  const nextEntries = entries
    .map((entry) => entry.trim())
    .filter(Boolean);

  return nextEntries.length > 0 ? nextEntries : undefined;
}

type EditableModalSection = 'whatIDid' | 'techStack' | null;
type RawEditorParseResult =
  | { ok: true; content: RelevantExperienceNode[] }
  | { ok: false; error: string };

const RAW_NODE_SEPARATOR = '---';

function formatRawList(items?: string[]) {
  return items?.length ? items.map((item) => `- ${item}`).join('\n') : '';
}

function formatRawSectionDivider(label: string) {
  return `# ===== ${label} =====`;
}

function formatRawTextContent(nodes: RelevantExperienceNode[]) {
  return nodes.map((node) => [
    `${node.type === 'parent' ? 'Parent' : 'Child'} - ${node.id}`,
    '',
    formatRawSectionDivider('Preview Card'),
    `Title: ${node.title}`,
    node.subtitle ? `Subtitle: ${node.subtitle}` : 'Subtitle:',
    `${node.type === 'parent' ? 'Preview Summary' : 'Preview Details'}:`,
    node.details,
    '',
    formatRawSectionDivider('Modal Content'),
    'Modal What I Did:',
    formatRawList(node.modalWhatIDid),
    '',
    formatRawSectionDivider('Tags'),
    'Preview Tags:',
    formatRawList(node.previewTags),
    'Modal Tags:',
    formatRawList(node.modalTags),
  ].join('\n')).join(`\n\n${RAW_NODE_SEPARATOR}\n\n`);
}

function normalizeRawList(lines: string[]) {
  const nextItems = lines
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);

  return nextItems.length > 0 ? nextItems : undefined;
}

function isIgnoredRawEditorLine(line: string) {
  const trimmed = line.trim();

  return /^#\s*=+.+={2,}\s*$/.test(trimmed);
}

function parseRawTextContent(rawText: string, nodes: RelevantExperienceNode[]): RawEditorParseResult {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const blocks = rawText
    .split(new RegExp(`\\n\\s*${RAW_NODE_SEPARATOR}\\s*\\n`, 'g'))
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length !== nodes.length) {
    return { ok: false, error: `Expected ${nodes.length} card blocks, but found ${blocks.length}.` };
  }

  const parsedNodes: RelevantExperienceNode[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    const header = lines[0]?.trim() ?? '';
    const headerMatch = /^(Parent|Child)\s*-\s*(.+)$/.exec(header);

    if (!headerMatch) {
      return { ok: false, error: `Invalid block header: "${header}". Use "Parent - id" or "Child - id".` };
    }

    const [, blockType, blockId] = headerMatch;
    const sourceNode = nodesById.get(blockId.trim());

    if (!sourceNode) {
      return { ok: false, error: `Unknown node id "${blockId.trim()}".` };
    }

    if ((blockType.toLowerCase() as RelevantExperienceNode['type']) !== sourceNode.type) {
      return { ok: false, error: `Node "${sourceNode.id}" type does not match its header.` };
    }

    const sections = new Map<string, string[]>();
    let currentLabel: string | null = null;

    for (const line of lines.slice(1)) {
      const labelMatch = /^(Title|Subtitle|Summary|Details|What I Did|Modal What I Did|Preview Tags|Tags|Modal Tags):(.*)$/.exec(line);
      if (labelMatch) {
        currentLabel = labelMatch[1];
        sections.set(currentLabel, []);
        const inlineValue = labelMatch[2].trim();
        if (inlineValue) {
          sections.get(currentLabel)?.push(inlineValue);
        }
        continue;
      }

      if (isIgnoredRawEditorLine(line)) {
        continue;
      }

      if (!line.trim()) {
        if (!currentLabel) {
          continue;
        }

        sections.get(currentLabel)?.push('');
        continue;
      }

      if (!currentLabel) {
        return { ok: false, error: `Unexpected content before a section label in "${sourceNode.id}".` };
      }

      sections.get(currentLabel)?.push(line);
    }

    const legacyDetailsLabel = sourceNode.type === 'parent' ? 'Summary' : 'Details';
    const previewDetailsLabel = sourceNode.type === 'parent' ? 'Preview Summary' : 'Preview Details';
    const title = (sections.get('Title') ?? []).join('\n').trim();
    const subtitle = (sections.get('Subtitle') ?? []).join('\n').trim();
    const details = (
      sections.get(previewDetailsLabel)
      ?? sections.get(legacyDetailsLabel)
      ?? []
    ).join('\n').trim();

    if (!title) {
      return { ok: false, error: `Title is required for "${sourceNode.id}".` };
    }

    if (!details) {
      return { ok: false, error: `${previewDetailsLabel} is required for "${sourceNode.id}".` };
    }

    parsedNodes.push({
      ...sourceNode,
      title,
      subtitle: subtitle || undefined,
      details,
      modalWhatIDid: normalizeRawList(sections.get('Modal What I Did') ?? sections.get('What I Did') ?? []),
      previewTags: normalizeRawList(sections.get('Preview Tags') ?? []),
      modalTags: normalizeRawList(sections.get('Modal Tags') ?? sections.get('Tags') ?? []),
    });
  }

  return { ok: true, content: parsedNodes };
}

function TruncatedText({ as = 'p', text, className }: { as?: 'p' | 'span'; text: string; className: string }) {
  const textRef = useRef<HTMLParagraphElement | HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    truncateToFit(textRef.current, text);
  }, [text]);
  return as === 'span'
    ? <span ref={textRef as React.RefObject<HTMLSpanElement>} className={className} />
    : <p ref={textRef as React.RefObject<HTMLParagraphElement>} className={className} />;
}

function RelevantExperienceIconGlyph({ icon }: { icon?: RelevantExperienceNode['icon'] }) {
  if (icon === 'briefcase-business') {
    return <BriefcaseBusiness className="journey-map-card__icon" strokeWidth={1.3} />;
  }

  if (icon === 'folder-kanban') {
    return <FolderKanban className="journey-map-card__icon" strokeWidth={1.3} />;
  }

  return null;
}

function ChildCardTag({ label }: { label: string }) {
  return <span className="relevant-experiences-card__tag font-jura">{label}</span>;
}

function RelevantExperienceModal({
  node,
  editorEnabled = false,
  useVerticalMobileAnimation = false,
  onUpdateNode,
  onSave,
  isSaving = false,
  onClose,
}: {
  node: RelevantExperienceNode | null;
  editorEnabled?: boolean;
  useVerticalMobileAnimation?: boolean;
  onUpdateNode?: (nodeId: string, transform: (node: RelevantExperienceNode) => RelevantExperienceNode) => void;
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
  onClose: () => void;
}) {
  const closeTimeoutRef = useRef<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [editingSection, setEditingSection] = useState<EditableModalSection>(null);
  const [whatIDidDraft, setWhatIDidDraft] = useState(() => createItemDraft(node?.modalWhatIDid));
  const [techStackDraft, setTechStackDraft] = useState(() => formatTagsForEditor(node?.modalTags));

  const imageSrc = resolveAssetPath(node?.image);
  const whatIDid = node?.modalWhatIDid ?? [];
  const techStack = node?.modalTags ?? [];
  const modalOriginStyle = useMemo(() => {
    if (!node) {
      return undefined;
    }

    const normalizedX = ((node.layout.x + (node.layout.width / 2)) / MIN_CANVAS_WIDTH) * 100;
    const normalizedY = ((node.layout.y + (node.layout.height / 2)) / Math.max(node.layout.y + node.layout.height, 1)) * 100;

    return {
      transformOrigin: `${Math.min(Math.max(normalizedX, 18), 82)}% ${Math.min(Math.max(normalizedY, 18), 82)}%`,
    };
  }, [node]);

  const modalGrowInitial = useMemo(() => {
    if (useVerticalMobileAnimation) {
      return {
        opacity: 1,
        scale: 0.88,
        x: 0,
        y: 56,
      };
    }

    if (!node) {
      return { scale: 0.88, y: 0 };
    }

    const nodeCenterX = node.layout.x + (node.layout.width / 2);
    const xOffset = ((nodeCenterX / MIN_CANVAS_WIDTH) - 0.5) * 28;

    return {
      opacity: 1,
      scale: 0.88,
      x: xOffset,
      y: 0,
    };
  }, [node, useVerticalMobileAnimation]);

  const handleToggleSectionEditor = useCallback((section: Exclude<EditableModalSection, null>) => {
    setEditingSection((prev) => {
      if (prev === section) {
        return null;
      }

      if (section === 'whatIDid') {
        setWhatIDidDraft(createItemDraft(node?.modalWhatIDid));
      }

      if (section === 'techStack') {
        setTechStackDraft(formatTagsForEditor(node?.modalTags));
      }

      return section;
    });
  }, [node]);

  const handleSaveSection = useCallback(async (section: Exclude<EditableModalSection, null>) => {
    if (!node || !onUpdateNode) {
      return;
    }

    if (section === 'whatIDid') {
      onUpdateNode(node.id, (currentNode) => ({
        ...currentNode,
        modalWhatIDid: sanitizeItemDraft(whatIDidDraft),
      }));
    }

    if (section === 'techStack') {
      onUpdateNode(node.id, (currentNode) => ({
        ...currentNode,
        modalTags: parseTagsFromEditor(techStackDraft),
      }));
    }

    await onSave?.();
    setEditingSection(null);
  }, [node, onSave, onUpdateNode, whatIDidDraft, techStackDraft]);

  const handleWhatIDidItemChange = useCallback((index: number, value: string) => {
    setWhatIDidDraft((prev) => {
      const next = [...prev];
      next[index] = value;

      if (index === next.length - 1 && value.trim()) {
        next.push('');
      }

      while (next.length > 1 && !next[next.length - 1].trim() && !next[next.length - 2].trim()) {
        next.pop();
      }

      return next;
    });
  }, []);

  useEffect(() => () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
  }, []);

  const handleRequestClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      return;
    }

    setIsModalOpen(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, RE_MODAL_ANIMATION_DURATION_MS);
  }, [onClose]);

  if (!node) {
    return null;
  }

  return (
    <OverlayModal
      isOpen={isModalOpen}
      onClose={handleRequestClose}
      rootClassName="relevant-experiences-modal"
      backdropClassName="relevant-experiences-modal__backdrop"
      dialogClassName="relevant-experiences-modal__dialog"
      bodyClassName="relevant-experiences-modal__body"
      titleId="relevant-experiences-modal-title"
      rootKey={node.id}
      ease={easeSmooth}
      dialogInitial={modalGrowInitial}
      dialogAnimate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      dialogExit={{ ...modalGrowInitial, opacity: 0 }}
      dialogDuration={RE_MODAL_ANIMATION_DURATION_MS / 1000}
      dialogStyle={modalOriginStyle}
      header={(
          <div className="relevant-experiences-modal__header">
            <div className="relevant-experiences-modal__header-copy">
              <h3 id="relevant-experiences-modal-title" className="relevant-experiences-modal__title font-anta">
                {node.title}
              </h3>
              {node.subtitle ? (
                <p className="relevant-experiences-modal__subtitle font-jura">{node.subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="group relevant-experiences-modal__close"
              aria-label="Close modal"
              onClick={handleRequestClose}
            >
              <AnimatedCloseIcon size={18} strokeWidth={1.8} />
            </button>
          </div>
      )}
    >
      {imageSrc ? (
        <section className="relevant-experiences-modal__section">
          <GlassCard
            width="w-full"
            corner="rounded-[3px]"
            shadow=""
            className="overflow-hidden relevant-experiences-modal__media"
          >
            <img
              src={imageSrc}
              alt={node.title}
              className="relevant-experiences-modal__image"
              loading="lazy"
              draggable={false}
            />
          </GlassCard>
        </section>
      ) : null}

      <section className="relevant-experiences-modal__section">
                <div className="relevant-experiences-modal__section-header">
                  <p className="relevant-experiences-modal__label relevant-experiences-modal__label--primary font-jura">What I Did</p>
                  {editorEnabled ? (
                    <button
                      type="button"
                      className="relevant-experiences-modal__section-action"
                      aria-label="Edit what I did"
                      onClick={() => handleToggleSectionEditor('whatIDid')}
                    >
                      <Pencil size={14} strokeWidth={1.7} />
                    </button>
                  ) : null}
                </div>
                {editorEnabled && editingSection === 'whatIDid' ? (
                  <div className="relevant-experiences-modal__input-row">
                    <div className="relevant-experiences-modal__item-editor">
                      {whatIDidDraft.map((item, index) => (
                        <label key={`${node.id}-what-i-did-input-${index}`} className="relevant-experiences-modal__item-row font-jura">
                          <span className="relevant-experiences-modal__item-label">{`Item ${index + 1}`}</span>
                          <input
                            className="relevant-experiences-modal__item-input font-jura"
                            type="text"
                            value={item}
                            onChange={(event) => handleWhatIDidItemChange(index, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="relevant-experiences-modal__confirm"
                      aria-label="Save what I did"
                      onClick={() => void handleSaveSection('whatIDid')}
                      disabled={isSaving}
                    >
                      <Check size={16} strokeWidth={2} />
                    </button>
                  </div>
                ) : null}
                {whatIDid.length > 0 ? (
                  <ul className="relevant-experiences-modal__list">
                    {whatIDid.map((item, index) => (
                      <li key={`${node.id}-what-i-did-${index}`} className="relevant-experiences-modal__list-item font-jura">
                        <span className="relevant-experiences-modal__list-bullet">
                          &bull;
                        </span>
                        <span className="relevant-experiences-modal__list-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="relevant-experiences-modal__empty font-jura">No details added yet.</p>
                )}
      </section>

      <section className="relevant-experiences-modal__section">
                <div className="relevant-experiences-modal__section-header">
                  <p className="relevant-experiences-modal__label font-jura">Tags</p>
                  {editorEnabled ? (
                    <button
                      type="button"
                      className="relevant-experiences-modal__section-action"
                      aria-label="Edit tags"
                      onClick={() => handleToggleSectionEditor('techStack')}
                    >
                      <Pencil size={14} strokeWidth={1.7} />
                    </button>
                  ) : null}
                </div>
                {editorEnabled && editingSection === 'techStack' ? (
                  <div className="relevant-experiences-modal__input-row">
                    <textarea
                      className="relevant-experiences-modal__input font-jura"
                      rows={3}
                      value={techStackDraft}
                      onChange={(event) => setTechStackDraft(event.target.value)}
                    />
                    <button
                      type="button"
                      className="relevant-experiences-modal__confirm"
                      aria-label="Save tags"
                      onClick={() => void handleSaveSection('techStack')}
                      disabled={isSaving}
                    >
                      <Check size={16} strokeWidth={2} />
                    </button>
                  </div>
                ) : null}
                {techStack.length > 0 ? (
                  <div className="relevant-experiences-modal__tags">
                    {techStack.map((tag) => <ChildCardTag key={`${node.id}-modal-${tag}`} label={tag} />)}
                  </div>
                ) : (
                  <p className="relevant-experiences-modal__empty font-jura">No tags added yet.</p>
                )}
      </section>
    </OverlayModal>
  );
}
function RelevantExperienceCardContent({
  node,
  truncateParentDetails = false,
}: {
  node: RelevantExperienceNode;
  truncateParentDetails?: boolean;
}) {
  const imageSrc = resolveAssetPath(node.image);

  if (node.type === 'parent' && node.icon) {
    return (
      <article className="relevant-experiences-card__surface relevant-experiences-card__surface--framed relevant-experiences-card__surface--parent journey-map-card journey-showcase__card journey-showcase__card--parent">
        <div className="journey-map-card__parent-header">
          <div className="journey-map-card__icon-shell"><RelevantExperienceIconGlyph icon={node.icon} /></div>
          <h3 className="journey-map-card__title font-jura">{node.title}</h3>
        </div>
        {truncateParentDetails ? (
          <TruncatedText text={node.details} className="journey-map-card__details journey-map-card__details--truncate font-jura text-sm leading-relaxed" />
        ) : (
          <p className="journey-map-card__details font-jura text-sm leading-relaxed">{node.details}</p>
        )}
      </article>
    );
  }

  return (
    <article className="relevant-experiences-card__surface relevant-experiences-card__surface--framed relevant-experiences-card__surface--child journey-map-card journey-showcase__card journey-showcase__card--child">
      {imageSrc ? (
        <GlassCard width="w-full" corner="rounded-[2px]" shadow="" className="overflow-hidden journey-map-card__media">
          <img src={imageSrc} alt={node.title} className="journey-map-card__image" loading="lazy" draggable={false} />
        </GlassCard>
      ) : null}
      <div className="relevant-experiences-card__body">
        <h4 className="journey-map-card__child-title font-jura">{node.title}</h4>
        <p className="journey-map-card__child-details font-jura">{node.details}</p>
        {node.previewTags?.length ? (
          <div className="relevant-experiences-card__tags" aria-label={`${node.title} tags`}>
            {node.previewTags.map((tag) => <ChildCardTag key={`${node.id}-${tag}`} label={tag} />)}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RelevantExperienceCard({ node, selected, editorEnabled, canvasElement, onMeasure, onActivate, onOpenEditMenu, onMove, onResize }: {
  node: RelevantExperienceNode;
  selected: boolean;
  editorEnabled: boolean;
  canvasElement: HTMLDivElement | null;
  onMeasure: (nodeId: string, layout: RelevantExperienceNodeLayout) => void;
  onActivate: (nodeId: string) => void;
  onOpenEditMenu: (nodeId: string, position: { x: number; y: number }) => void;
  onMove: (nodeId: string, next: { x: number; y: number }) => void;
  onResize: (nodeId: string, next: { x: number; y: number; width: number; height: number }) => void;
}) {
  const layout = node.layout;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; startLeft: number; startTop: number; scaleX: number; scaleY: number } | null>(null);
  const resizeStateRef = useRef<{ pointerId: number; handle: 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; startLeft: number; startTop: number; startWidth: number; startHeight: number } | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasElement;
    const card = cardRef.current;
    if (!canvas || !card) {
      return;
    }

    const measure = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scaleX = canvas.offsetWidth > 0 ? canvasRect.width / canvas.offsetWidth : 1;
      const scaleY = canvas.offsetHeight > 0 ? canvasRect.height / canvas.offsetHeight : 1;

      onMeasure(node.id, {
        x: Math.round((cardRect.left - canvasRect.left) / (scaleX || 1)),
        y: Math.round((cardRect.top - canvasRect.top) / (scaleY || 1)),
        width: Math.round(cardRect.width / (scaleX || 1)),
        height: Math.round(cardRect.height / (scaleY || 1)),
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(card);
    window.addEventListener('resize', measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [canvasElement, layout.height, layout.width, layout.x, layout.y, node.details, node.id, node.previewTags, node.title, node.type, onMeasure]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!editorEnabled || event.button !== 0) return;
    event.preventDefault();
    const canvas = canvasElement;
    const canvasRect = canvas?.getBoundingClientRect();
    const scaleX = canvas && canvas.offsetWidth > 0 && canvasRect ? canvasRect.width / canvas.offsetWidth : 1;
    const scaleY = canvas && canvas.offsetHeight > 0 && canvasRect ? canvasRect.height / canvas.offsetHeight : 1;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: layout.x,
      startTop: layout.y,
      scaleX: scaleX || 1,
      scaleY: scaleY || 1,
    };
    onActivate(node.id);

    const move = (moveEvent: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== moveEvent.pointerId) return;
      onMove(node.id, {
        x: Math.round(dragState.startLeft + (moveEvent.clientX - dragState.startX) / dragState.scaleX),
        y: Math.round(dragState.startTop + (moveEvent.clientY - dragState.startY) / dragState.scaleY),
      });
    };

    const up = (upEvent: PointerEvent) => {
      if (dragStateRef.current?.pointerId === upEvent.pointerId) {
        dragStateRef.current = null;
      }
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const handleResizePointerDown = (handle: 'nw' | 'ne' | 'sw' | 'se', event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!editorEnabled || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = { pointerId: event.pointerId, handle, startX: event.clientX, startY: event.clientY, startLeft: layout.x, startTop: layout.y, startWidth: layout.width, startHeight: layout.height };
    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate(node.id);
  };
  const handleResizePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState || resizeState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - resizeState.startX;
    const deltaY = event.clientY - resizeState.startY;
    let nextX = resizeState.startLeft;
    let nextY = resizeState.startTop;
    let nextWidth = resizeState.startWidth;
    let nextHeight = resizeState.startHeight;
    if (resizeState.handle.includes('e')) nextWidth = resizeState.startWidth + deltaX;
    if (resizeState.handle.includes('s')) nextHeight = resizeState.startHeight + deltaY;
    if (resizeState.handle.includes('w')) { nextWidth = resizeState.startWidth - deltaX; nextX = resizeState.startLeft + deltaX; }
    if (resizeState.handle.includes('n')) { nextHeight = resizeState.startHeight - deltaY; nextY = resizeState.startTop + deltaY; }
    onResize(node.id, { x: Math.round(nextX), y: Math.round(nextY), width: Math.round(nextWidth), height: Math.round(nextHeight) });
  };
  const handleResizePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (resizeStateRef.current?.pointerId === event.pointerId) resizeStateRef.current = null;
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onActivate(node.id); }
  };
  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!editorEnabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onOpenEditMenu(node.id, { x: event.clientX, y: event.clientY });
  };
  return (
    <div
      ref={cardRef}
      className={`relevant-experiences-card relevant-experiences-card--${node.type} ${editorEnabled ? 'relevant-experiences-card--editable' : 'relevant-experiences-card--interactive'} ${selected ? 'relevant-experiences-card--selected' : ''}`}
      style={{ left: `${layout.x}px`, top: `${layout.y}px`, width: `${layout.width}px`, height: `${layout.height}px` }}
      role="button"
      tabIndex={0}
        aria-label={`${node.title} card`}
        onClick={() => onActivate(node.id)}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
      >
      {editorEnabled ? (
        <>
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--nw" onPointerDown={(event) => handleResizePointerDown('nw', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--ne" onPointerDown={(event) => handleResizePointerDown('ne', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--sw" onPointerDown={(event) => handleResizePointerDown('sw', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--se" onPointerDown={(event) => handleResizePointerDown('se', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
        </>
      ) : null}
      <RelevantExperienceCardContent node={node} truncateParentDetails />
    </div>
  );
}

export function RelevantExperiences({ editorEnabled = false, shouldAnimate = false }: RelevantExperiencesProps) {
  const laneRef = useRef<HTMLDivElement | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(MIN_CANVAS_WIDTH);
  const [measuredNodeLayouts, setMeasuredNodeLayouts] = useState<Record<string, RelevantExperienceNodeLayout>>({});
  const [hudMinimized, setHudMinimized] = useState<boolean>(() => readLocalStorageJson(HUD_MINIMIZED_STORAGE_KEY, false));
  const [hudPos, setHudPos] = useState<{ x: number; y: number }>(() => readLocalStorageJson(HUD_POS_STORAGE_KEY, { x: 0, y: 0 }));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedViaIndex, setSelectedViaIndex] = useState<number | null>(null);
  const [isAddCornerMode, setIsAddCornerMode] = useState(false);
  const [pendingConnectionTargetId, setPendingConnectionTargetId] = useState<string>('');
  const [tagEditorDraft, setTagEditorDraft] = useState<{ nodeId: string | null; value: string }>({ nodeId: null, value: '' });
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [editMenuState, setEditMenuState] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [isRawEditorOpen, setIsRawEditorOpen] = useState(false);
  const [rawEditorValue, setRawEditorValue] = useState('');
  const [rawEditorError, setRawEditorError] = useState<string | null>(null);
  const rawEditorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === 'undefined' ? BREAKPOINTS.lg : window.innerWidth,
  );
  const activeLayoutKey = viewportWidth >= BREAKPOINTS.lg ? 'lg' : 'md';
  const {
    content,
    rawContent,
    isLoading,
    loadError,
    replaceContent,
    updateNode,
    updateConnection,
    addConnection,
    removeConnection,
    resetNodeToPersisted,
    resetToPersisted,
    save,
    isSaving,
    saveFeedback,
  } = useRelevantExperiencesEditorState(activeLayoutKey);

  useEffect(() => {
    const lane = laneRef.current;
    if (!lane) return;
    const resizeObserver = new ResizeObserver((entries) => {
      setCanvasWidth(entries[0]?.contentRect.width ?? MIN_CANVAS_WIDTH);
    });
    resizeObserver.observe(lane);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(HUD_POS_STORAGE_KEY, JSON.stringify(hudPos));
  }, [hudPos]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(HUD_MINIMIZED_STORAGE_KEY, JSON.stringify(hudMinimized));
  }, [hudMinimized]);

  const nodes = useMemo(() => content?.nodes ?? [], [content]);
  const connections = useMemo(() => content?.connections ?? [], [content]);
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const activeSelectedNodeId = editorEnabled ? selectedNodeId : null;
  const activeSelectedConnectionId = editorEnabled ? selectedConnectionId : null;
  const activeSelectedViaIndex = editorEnabled ? selectedViaIndex : null;
  const selectedNode = useMemo(() => nodes.find((node) => node.id === activeSelectedNodeId) ?? null, [activeSelectedNodeId, nodes]);
  const modalNode = useMemo(() => (
    editorEnabled && !modalNodeId ? null : nodes.find((node) => node.id === modalNodeId) ?? null
  ), [editorEnabled, modalNodeId, nodes]);
  const selectedConnection = useMemo(() => connections.find((connection) => connection.id === activeSelectedConnectionId) ?? null, [activeSelectedConnectionId, connections]);
  const selectedNodeLayout = selectedNode?.layout ?? null;
  const measuredNodeLayoutsById = useMemo(() => new Map(Object.entries(measuredNodeLayouts)), [measuredNodeLayouts]);
  const tagEditorValue = selectedNode?.type === 'child'
    ? (tagEditorDraft.nodeId === selectedNode.id ? tagEditorDraft.value : formatTagsForEditor(selectedNode.previewTags))
    : '';
  const availableConnectionTargets = useMemo(() => (
    selectedNode
      ? nodes.filter((node) => node.id !== selectedNode.id)
      : []
  ), [nodes, selectedNode]);
  const layoutMode = useMemo<'desktop' | 'linear'>(() => {
    if (viewportWidth >= BREAKPOINTS.md) {
      return 'desktop';
    }

    return 'linear';
  }, [viewportWidth]);
  const canvasHeight = useMemo(() => resolveCanvasHeight(nodes), [nodes]);
  const activeCanvasWidth = useMemo(() => {
    if (viewportWidth >= BREAKPOINTS.lg) {
      return MIN_CANVAS_WIDTH;
    }

    if (viewportWidth >= BREAKPOINTS.md) {
      return CONTENT_MAX_WIDTH.md;
    }

    return MIN_CANVAS_WIDTH;
  }, [viewportWidth]);
  const displayNodes = nodes;
  const displayConnections = connections;
  const displayCanvasHeight = useMemo(() => resolveCanvasHeight(displayNodes), [displayNodes]);
  const scale = useMemo(() => {
    if (!canvasWidth || canvasWidth >= activeCanvasWidth) {
      return 1;
    }

    return canvasWidth / activeCanvasWidth;
  }, [activeCanvasWidth, canvasWidth]);
  const parentNodes = useMemo(() => (
    nodes
      .filter((node) => node.type === 'parent')
      .sort((left, right) => (
        left.layout.y - right.layout.y || left.layout.x - right.layout.x
      ))
  ), [nodes]);
  const childNodesByParentId = useMemo(() => {
    const grouped = new Map<string, RelevantExperienceNode[]>();

    parentNodes.forEach((parent) => {
      grouped.set(parent.id, []);
    });

    const orphanChildren: RelevantExperienceNode[] = [];

    nodes
      .filter((node) => node.type === 'child')
      .sort((left, right) => (
        left.layout.y - right.layout.y || left.layout.x - right.layout.x
      ))
      .forEach((child) => {
        if (child.parentId && grouped.has(child.parentId)) {
          grouped.get(child.parentId)?.push(child);
          return;
        }

        orphanChildren.push(child);
      });

    if (orphanChildren.length > 0) {
      grouped.set('orphans', orphanChildren);
    }

    return grouped;
  }, [nodes, parentNodes]);

  const updateNodeLayout = useCallback((nodeId: string, transform: (layout: RelevantExperienceNodeLayout) => RelevantExperienceNodeLayout) => {
    updateNode(nodeId, (node) => {
      const nextLayout = transform(node.layout);
      const nextCanvasHeight = Math.max(
        canvasHeight,
        nextLayout.y + Math.max(MIN_CARD_HEIGHT, nextLayout.height),
      );

      return {
        ...node,
        layout: clampNodeLayoutToCanvas(nextLayout, nextCanvasHeight),
      };
    });
  }, [canvasHeight, updateNode]);

  const handleMoveNode = useCallback((nodeId: string, next: { x: number; y: number }) => {
    updateNodeLayout(nodeId, (layout) => ({ ...layout, x: next.x, y: next.y }));
  }, [updateNodeLayout]);

  const handleResizeNode = useCallback((nodeId: string, next: { x: number; y: number; width: number; height: number }) => {
    updateNodeLayout(nodeId, () => ({ x: next.x, y: next.y, width: next.width, height: next.height }));
  }, [updateNodeLayout]);

  const handleMeasureNode = useCallback((nodeId: string, layout: RelevantExperienceNodeLayout) => {
    setMeasuredNodeLayouts((prev) => {
      const current = prev[nodeId];
      if (
        current &&
        current.x === layout.x &&
        current.y === layout.y &&
        current.width === layout.width &&
        current.height === layout.height
      ) {
        return prev;
      }

      return {
        ...prev,
        [nodeId]: layout,
      };
    });
  }, []);

  const getCanvasPointFromPointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasElement;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const nextScale = canvas.offsetWidth > 0 ? rect.width / canvas.offsetWidth : scale || 1;

    return clampCanvasPoint({
      x: (clientX - rect.left) / nextScale,
      y: (clientY - rect.top) / nextScale,
    }, canvasHeight);
  }, [canvasElement, canvasHeight, scale]);

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
    setSelectedViaIndex(null);
    setIsAddCornerMode(false);
    setTagEditorDraft((prev) => (prev.nodeId === nodeId ? prev : { nodeId: null, value: '' }));
  }, []);

  const handleActivateNode = useCallback((nodeId: string) => {
    setEditMenuState(null);
    if (editorEnabled) {
      handleSelectNode(nodeId);
      return;
    }

    setModalNodeId(nodeId);
  }, [editorEnabled, handleSelectNode]);

  const handleCanvasRef = useCallback((node: HTMLDivElement | null) => {
    setCanvasElement(node);
  }, []);

  const handleClearSelection = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setSelectedViaIndex(null);
    setIsAddCornerMode(false);
    setTagEditorDraft({ nodeId: null, value: '' });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalNodeId(null);
  }, []);

  const handleOpenEditMenu = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
    setSelectedViaIndex(null);
    setTagEditorDraft({ nodeId: null, value: '' });
    setEditMenuState({ nodeId, ...position });
  }, []);

  const handleOpenModalFromEditMenu = useCallback(() => {
    if (!editMenuState) {
      return;
    }

    setModalNodeId(editMenuState.nodeId);
    setEditMenuState(null);
  }, [editMenuState]);

  useEffect(() => {
    if (!editMenuState) {
      return;
    }

    const handlePointerDown = () => setEditMenuState(null);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [editMenuState]);

  const handleSelectConnection = useCallback((connectionId: string, event: ReactPointerEvent<SVGPathElement>) => {
    event.stopPropagation();
    setSelectedConnectionId(connectionId);
    setSelectedNodeId(null);
    setSelectedViaIndex(null);
    setTagEditorDraft({ nodeId: null, value: '' });

    if (!isAddCornerMode && !event.shiftKey) {
      return;
    }

    const point = getCanvasPointFromPointer(event.clientX, event.clientY);
    updateConnection(connectionId, (connection) => {
      const nextViaPoints = [...connection.viaPoints, point];
      setSelectedViaIndex(nextViaPoints.length - 1);
      setIsAddCornerMode(false);
      return {
        ...connection,
        viaPoints: nextViaPoints,
      };
    });
  }, [getCanvasPointFromPointer, isAddCornerMode, updateConnection]);

  const handleSelectViaPoint = useCallback((
    connectionId: string,
    viaIndex: number,
    event: ReactPointerEvent<SVGCircleElement>,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    setSelectedConnectionId(connectionId);
    setSelectedNodeId(null);
    setSelectedViaIndex(viaIndex);
    setTagEditorDraft({ nodeId: null, value: '' });

    if (event.altKey) {
      updateConnection(connectionId, (connection) => ({
        ...connection,
        viaPoints: connection.viaPoints.filter((_, index) => index !== viaIndex),
      }));
      setSelectedViaIndex(null);
      setIsAddCornerMode(false);
      return;
    }

    const startPointer = getCanvasPointFromPointer(event.clientX, event.clientY);
    const startPoint = connections.find((connection) => connection.id === connectionId)?.viaPoints[viaIndex];
    if (!startPoint) {
      return;
    }

    const move = (moveEvent: PointerEvent) => {
      const nextPointer = getCanvasPointFromPointer(moveEvent.clientX, moveEvent.clientY);
      updateConnection(connectionId, (connection) => ({
        ...connection,
        viaPoints: connection.viaPoints.map((point, index) => (
          index === viaIndex
            ? clampCanvasPoint({
              x: startPoint.x + (nextPointer.x - startPointer.x),
              y: startPoint.y + (nextPointer.y - startPointer.y),
            }, canvasHeight)
            : point
        )),
      }));
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }, [canvasHeight, connections, getCanvasPointFromPointer, updateConnection]);

  const handleAddConnection = useCallback(() => {
    if (!selectedNode || selectedNode.type !== 'parent') {
      return;
    }

    const targetNode = nodes.find((node) => node.id === pendingConnectionTargetId);
    if (!targetNode || targetNode.id === selectedNode.id) {
      return;
    }

    const connection: RelevantExperienceConnection = {
      id: createConnectionId(),
      from: selectedNode.id,
      to: targetNode.id,
      fromAnchor: 'bottom',
      toAnchor: 'top',
      viaPoints: [],
      variant: targetNode.type === 'parent' ? 'group' : 'detail',
    };

    addConnection(connection);
    setSelectedConnectionId(connection.id);
    setSelectedViaIndex(null);
    setSelectedNodeId(null);
    setIsAddCornerMode(false);
    setPendingConnectionTargetId('');
  }, [addConnection, nodes, pendingConnectionTargetId, selectedNode]);

  const handleRemoveConnection = useCallback((connectionId: string) => {
    removeConnection(connectionId);
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null);
      setSelectedViaIndex(null);
      setIsAddCornerMode(false);
    }
  }, [removeConnection, selectedConnectionId]);

  const handleAddViaPoint = useCallback(() => {
    if (!selectedConnection) {
      return;
    }

    updateConnection(selectedConnection.id, (connection) => {
      const nextPoint = connection.viaPoints.length > 0
        ? connection.viaPoints[connection.viaPoints.length - 1]
        : { x: MIN_CANVAS_WIDTH / 2, y: canvasHeight / 2 };
      const nextViaPoints = [
        ...connection.viaPoints,
        clampCanvasPoint({ x: nextPoint.x + 32, y: nextPoint.y + 32 }, canvasHeight),
      ];
      setSelectedViaIndex(nextViaPoints.length - 1);
      setIsAddCornerMode(false);
      return {
        ...connection,
        viaPoints: nextViaPoints,
      };
    });
  }, [canvasHeight, selectedConnection, updateConnection]);

  const handleRemoveSelectedViaPoint = useCallback(() => {
    if (!selectedConnection || selectedViaIndex === null) {
      return;
    }

    updateConnection(selectedConnection.id, (connection) => ({
      ...connection,
      viaPoints: connection.viaPoints.filter((_, index) => index !== selectedViaIndex),
    }));
    setSelectedViaIndex(null);
    setIsAddCornerMode(false);
  }, [selectedConnection, selectedViaIndex, updateConnection]);

  const handleClearSelectedConnectionCorners = useCallback(() => {
    if (!selectedConnection || selectedConnection.viaPoints.length === 0) {
      return;
    }

    updateConnection(selectedConnection.id, (connection) => ({
      ...connection,
      viaPoints: [],
    }));
    setSelectedViaIndex(null);
    setIsAddCornerMode(false);
  }, [selectedConnection, updateConnection]);

  const handleOrthogonalizeSelectedConnection = useCallback(() => {
    if (!selectedConnection || selectedConnection.viaPoints.length === 0) {
      return;
    }

    const points = getRenderableConnectionPoints(selectedConnection, nodesById, measuredNodeLayoutsById);
    const start = points[0];
    const end = points[points.length - 1];
    if (!start || !end) {
      return;
    }

    const snapped = selectedConnection.viaPoints.map((point) => ({
      x: Math.round(point.x),
      y: Math.round(point.y),
    }));

    let previousPoint = start;
    for (let index = 0; index < snapped.length; index += 1) {
      snapped[index] = snapConnectionPointTowards(snapped[index], previousPoint);
      previousPoint = snapped[index];
    }

    let nextPoint = end;
    for (let index = snapped.length - 1; index >= 0; index -= 1) {
      snapped[index] = snapConnectionPointTowards(snapped[index], nextPoint);
      nextPoint = snapped[index];
    }

    updateConnection(selectedConnection.id, (connection) => ({
      ...connection,
      viaPoints: snapped,
    }));
  }, [measuredNodeLayoutsById, nodesById, selectedConnection, updateConnection]);

  const handleHudPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startX = hudPos.x;
    const startY = hudPos.y;
    const move = (moveEvent: PointerEvent) => setHudPos({ x: Math.round(startX + moveEvent.clientX - startClientX), y: Math.round(startY + moveEvent.clientY - startClientY) });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  };

  const handleCopyEdits = useCallback(async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
      setCopyFeedback('success');
    } catch {
      setCopyFeedback('error');
    }
    window.setTimeout(() => setCopyFeedback('idle'), 1400);
  }, [content]);

  const handleResetEdits = useCallback(() => {
    resetToPersisted();
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setSelectedViaIndex(null);
    setIsAddCornerMode(false);
    setPendingConnectionTargetId('');
    setTagEditorDraft({ nodeId: null, value: '' });
  }, [resetToPersisted]);

  const handleOpenRawEditor = useCallback(() => {
    if (!rawContent) {
      return;
    }

    setRawEditorValue(formatRawTextContent(rawContent.nodes));
    setRawEditorError(null);
    setIsRawEditorOpen(true);
  }, [rawContent]);

  const handleCloseRawEditor = useCallback(() => {
    setIsRawEditorOpen(false);
    setRawEditorError(null);
  }, []);

  const handleApplyRawEditor = useCallback(async () => {
    if (!rawContent) {
      return;
    }

    const parsed = parseRawTextContent(rawEditorValue, rawContent.nodes);
    if (!parsed.ok) {
      setRawEditorError(parsed.error);
      return;
    }

    replaceContent({
      ...rawContent,
      nodes: parsed.content,
    });
    setRawEditorError(null);
    await save();
    setIsRawEditorOpen(false);
  }, [rawContent, rawEditorValue, replaceContent, save]);

  useLayoutEffect(() => {
    if (!isRawEditorOpen || !rawEditorTextareaRef.current) {
      return;
    }

    const textarea = rawEditorTextareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 448)}px`;
  }, [isRawEditorOpen, rawEditorValue]);

  const statusBody = isLoading ? (
    <div className="relevant-experiences-intro text-center">
      <h2 className="relevant-experiences-intro__title font-anta">Relevant Experiences</h2>
      <p className="relevant-experiences-intro__copy font-jura">Loading relevant experiences from the database...</p>
    </div>
  ) : loadError || !content ? (
    <div className="relevant-experiences-intro text-center">
      <h2 className="relevant-experiences-intro__title font-anta">Relevant Experiences</h2>
      <p className="relevant-experiences-intro__copy font-jura">Unable to load relevant experiences from the database right now.</p>
    </div>
  ) : null;

  return (
    <>
      <motion.div
        initial={{ y: '100vh' }}
        animate={{ y: shouldAnimate ? 0 : '100vh' }}
        transition={{ duration: 1.7, ease: easeSmooth, delay: 0.11 }}
      >
        <Section className="relevant-experiences-section relative z-10 mt-24 text-[rgb(247,247,217)]">
          <div className="relevant-experiences-shell">
            <div className="relevant-experiences-shell__layer relevant-experiences-shell__layer--diagonal" />
            <div className="relevant-experiences-shell__layer relevant-experiences-shell__layer--vertical" />
            <div className="relevant-experiences-shell__layer relevant-experiences-shell__layer--inner-shadow" />
            <SectionContent className="relevant-experiences-shell__content relative z-[1]">
              {statusBody ?? (
                <>
                  <div className="relevant-experiences-intro text-center"><h2 className="relevant-experiences-intro__title font-anta">Relevant Experiences</h2></div>
                  <div ref={laneRef} className="relevant-experiences-editor-lane">
                    {layoutMode === 'desktop' ? (
                      <div className="relevant-experiences-map" style={{ height: `${displayCanvasHeight * scale}px` }}>
                        <div ref={handleCanvasRef} className="relevant-experiences-map__canvas" style={{ width: `${activeCanvasWidth}px`, height: `${displayCanvasHeight}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }} onPointerDown={editorEnabled ? handleClearSelection : undefined}>
                          {editorEnabled ? <div className="relevant-experiences-editor-grid" /> : null}
                          <RelevantExperienceConnections
                            canvasHeight={displayCanvasHeight}
                            canvasWidth={activeCanvasWidth}
                            connections={displayConnections}
                            nodes={displayNodes}
                            measuredNodeLayouts={measuredNodeLayoutsById}
                            editorEnabled={editorEnabled}
                            isAddCornerMode={isAddCornerMode}
                            selectedConnectionId={activeSelectedConnectionId}
                            selectedViaIndex={activeSelectedViaIndex}
                            onSelectConnection={handleSelectConnection}
                            onSelectViaPoint={handleSelectViaPoint}
                          />
                          {displayNodes.map((node) => <RelevantExperienceCard key={node.id} node={node} selected={activeSelectedNodeId === node.id} editorEnabled={editorEnabled} canvasElement={canvasElement} onMeasure={handleMeasureNode} onActivate={handleActivateNode} onOpenEditMenu={handleOpenEditMenu} onMove={handleMoveNode} onResize={handleResizeNode} />)}
                        </div>
                      </div>
                    ) : (
                      <div className="relevant-experiences-responsive relevant-experiences-responsive--linear">
                        {parentNodes.map((parent) => {
                          const childNodes = childNodesByParentId.get(parent.id) ?? [];

                          return (
                            <section key={parent.id} className="relevant-experiences-group">
                              <div
                                className={`relevant-experiences-group__parent relevant-experiences-card-shell ${editorEnabled ? '' : 'relevant-experiences-card-shell--interactive'}`}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`${parent.title} card`}
                                  onClick={() => handleActivateNode(parent.id)}
                                  onContextMenu={(event) => {
                                    if (!editorEnabled) return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleOpenEditMenu(parent.id, { x: event.clientX, y: event.clientY });
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                    handleActivateNode(parent.id);
                                  }
                                }}
                              >
                                <RelevantExperienceCardContent node={parent} />
                              </div>
                              {childNodes.length > 0 ? (
                                <div className="relevant-experiences-group__children relevant-experiences-group__children--linear">
                                  {childNodes.map((child) => (
                                    <div
                                      key={child.id}
                                      className={`relevant-experiences-responsive-card relevant-experiences-responsive-card--child relevant-experiences-card-shell ${editorEnabled ? '' : 'relevant-experiences-card-shell--interactive'}`}
                                      role="button"
                                        tabIndex={0}
                                        aria-label={`${child.title} card`}
                                        onClick={() => handleActivateNode(child.id)}
                                        onContextMenu={(event) => {
                                          if (!editorEnabled) return;
                                          event.preventDefault();
                                          event.stopPropagation();
                                          handleOpenEditMenu(child.id, { x: event.clientX, y: event.clientY });
                                        }}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                          handleActivateNode(child.id);
                                        }
                                      }}
                                    >
                                      <RelevantExperienceCardContent node={child} />
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </section>
                          );
                        })}
                        {(childNodesByParentId.get('orphans') ?? []).length > 0 ? (
                          <section className="relevant-experiences-group relevant-experiences-group--orphans">
                            <div className="relevant-experiences-group__children relevant-experiences-group__children--linear">
                                {(childNodesByParentId.get('orphans') ?? []).map((child) => (
                                  <div
                                    key={child.id}
                                    className="relevant-experiences-responsive-card relevant-experiences-responsive-card--child relevant-experiences-card-shell"
                                    onContextMenu={(event) => {
                                      if (!editorEnabled) return;
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleOpenEditMenu(child.id, { x: event.clientX, y: event.clientY });
                                    }}
                                  >
                                    <RelevantExperienceCardContent node={child} />
                                  </div>
                                ))}
                            </div>
                          </section>
                        ) : null}
                      </div>
                    )}
                  </div>
                </>
              )}
            </SectionContent>
          </div>
        </Section>
      </motion.div>
        <RelevantExperienceModal
          key={modalNodeId ?? 'closed'}
          node={modalNode}
          editorEnabled={editorEnabled}
          useVerticalMobileAnimation={viewportWidth < BREAKPOINTS.lg}
          onUpdateNode={updateNode}
          onSave={save}
          isSaving={isSaving}
          onClose={handleCloseModal}
        />
        {editorEnabled && editMenuState && typeof document !== 'undefined' ? createPortal(
          <div
            className="relevant-experiences-edit-menu"
            style={{ left: `${editMenuState.x}px`, top: `${editMenuState.y}px` }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="relevant-experiences-edit-menu__action font-jura" onClick={handleOpenModalFromEditMenu}>
              Edit Details
            </button>
            </div>,
          document.body,
        ) : null}
        {editorEnabled ? (
          <OverlayModal
            isOpen={isRawEditorOpen}
            onClose={handleCloseRawEditor}
            rootClassName="relevant-experiences-raw-editor"
            backdropClassName="relevant-experiences-raw-editor__backdrop"
            dialogClassName="relevant-experiences-raw-editor__dialog"
            bodyClassName="relevant-experiences-raw-editor__body"
            titleId="relevant-experiences-raw-editor-title"
            rootKey="relevant-experiences-raw-editor"
            header={(
              <div className="relevant-experiences-raw-editor__header">
                <div>
                  <h3 id="relevant-experiences-raw-editor-title" className="relevant-experiences-raw-editor__title font-anta">Raw Content Editor</h3>
                  <p className="relevant-experiences-raw-editor__subtitle font-jura">
                    Preview and modal fields are grouped separately here. Extra spacing and `# ===== section =====` divider lines are safe to keep when you paste edits back in.
                  </p>
                </div>
                <button type="button" className="group relevant-experiences-raw-editor__close" onClick={handleCloseRawEditor}>
                  <AnimatedCloseIcon size={18} strokeWidth={1.8} />
                </button>
              </div>
            )}
            footer={(
              <div className="relevant-experiences-raw-editor__actions">
                <button type="button" className="relevant-experiences-raw-editor__button" onClick={handleCloseRawEditor}>
                  Cancel
                </button>
                <button type="button" className="relevant-experiences-raw-editor__button" onClick={() => setRawEditorValue(rawContent ? formatRawTextContent(rawContent.nodes) : '')}>
                  Reset Text
                </button>
                <button type="button" className="relevant-experiences-raw-editor__button relevant-experiences-raw-editor__button--primary" onClick={() => void handleApplyRawEditor()} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Apply & Save'}
                </button>
              </div>
            )}
          >
            <textarea
              ref={rawEditorTextareaRef}
              className="relevant-experiences-raw-editor__textarea font-jura"
              value={rawEditorValue}
              onChange={(event) => setRawEditorValue(event.target.value)}
              spellCheck={false}
            />
            {rawEditorError ? (
              <p className="relevant-experiences-raw-editor__error font-jura">{rawEditorError}</p>
            ) : null}
          </OverlayModal>
        ) : null}
        {editorEnabled && content && typeof document !== 'undefined' ? createPortal(
          <div className={`relevant-experiences-editor-hud ${hudMinimized ? 'relevant-experiences-editor-hud--minimized' : ''}`} style={{ transform: `translate(${hudPos.x}px, ${hudPos.y}px)` }}>
            <div className="relevant-experiences-editor-hud__drag-grip" onPointerDown={handleHudPointerDown} aria-label="Drag relevant experiences editor panel" role="presentation" />
            <div className="relevant-experiences-editor-hud__title-row">
              <div className="relevant-experiences-editor-hud__title">Relevant Experiences Edit Mode</div>
            <div className="relevant-experiences-editor-hud__title-actions">
              <button type="button" className="relevant-experiences-editor-hud__mini-toggle" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                <button type="button" className="relevant-experiences-editor-hud__mini-toggle" onClick={() => setHudMinimized((prev) => !prev)}>{hudMinimized ? 'Expand' : 'Minimize'}</button>
              </div>
            </div>
          {hudMinimized ? (
            <div className="relevant-experiences-editor-hud__mini-actions">
              <button type="button" className="relevant-experiences-editor-hud__mini-toggle" onClick={handleOpenRawEditor}>
                Raw Content
              </button>
              {selectedConnection ? (
                <>
                  <button
                    type="button"
                    className={`relevant-experiences-editor-hud__mini-toggle ${isAddCornerMode ? 'relevant-experiences-editor-hud__mini-toggle--active' : ''}`}
                    onClick={() => setIsAddCornerMode((prev) => !prev)}
                  >
                    {isAddCornerMode ? 'Pick Line...' : 'Add Corner'}
                  </button>
                  <button
                    type="button"
                    className="relevant-experiences-editor-hud__mini-toggle"
                    onClick={handleOrthogonalizeSelectedConnection}
                    disabled={selectedConnection.viaPoints.length === 0}
                  >
                    Ortho
                  </button>
                  <button
                    type="button"
                    className="relevant-experiences-editor-hud__mini-toggle"
                    onClick={handleClearSelectedConnectionCorners}
                    disabled={selectedConnection.viaPoints.length === 0}
                  >
                    Remove Corners
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__meta"><span>canvas: {Math.round(activeCanvasWidth)} x {displayCanvasHeight}</span><span>scale: {scale.toFixed(3)}</span><span>card: {selectedNode?.id ?? 'none'}</span><span>connector: {selectedConnection?.id ?? 'none'}</span></div> : null}
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__card-editor"><div className="relevant-experiences-editor-hud__card-row"><label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-selected-card">Card</label><select id="relevant-experiences-editor-selected-card" className="relevant-experiences-editor-hud__select" value={activeSelectedNodeId ?? ''} onChange={(event) => { const nextNodeId = event.target.value || null; setSelectedNodeId(nextNodeId); setSelectedConnectionId(null); setSelectedViaIndex(null); setTagEditorDraft({ nodeId: null, value: '' }); }}><option value="">(click a card)</option>{nodes.map((node) => <option key={node.id} value={node.id}>{`${node.id} - ${node.title}`}</option>)}</select></div>
            {selectedNode && selectedNodeLayout ? (
              <>
                <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-card-title">Title</label><input id="relevant-experiences-editor-card-title" className="relevant-experiences-editor-hud__input" value={selectedNode.title} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, title: event.target.value }))} /></div>
                <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-card-details">{selectedNode.type === 'parent' ? 'Summary' : 'Details'}</label><textarea id="relevant-experiences-editor-card-details" className="relevant-experiences-editor-hud__textarea" rows={selectedNode.type === 'parent' ? 4 : 3} value={selectedNode.details} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, details: event.target.value }))} /></div>
                {selectedNode.type === 'child' ? (
                  <div className="relevant-experiences-editor-hud__field">
                    <label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-card-tags">Preview Tags</label>
                    <textarea
                      id="relevant-experiences-editor-card-tags"
                      className="relevant-experiences-editor-hud__textarea"
                      rows={3}
                      value={tagEditorValue}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setTagEditorDraft({ nodeId: selectedNode.id, value: nextValue });
                        updateNode(selectedNode.id, (node) => ({ ...node, previewTags: parseTagsFromEditor(nextValue) }));
                      }}
                    />
                  </div>
                ) : null}
                <div className="relevant-experiences-editor-hud__grid">
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">X</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.x} onChange={(event) => handleMoveNode(selectedNode.id, { x: Number(event.target.value), y: selectedNodeLayout.y })} /></div>
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">Y</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.y} onChange={(event) => handleMoveNode(selectedNode.id, { x: selectedNodeLayout.x, y: Number(event.target.value) })} /></div>
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">W</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.width} onChange={(event) => handleResizeNode(selectedNode.id, { x: selectedNodeLayout.x, y: selectedNodeLayout.y, width: Number(event.target.value), height: selectedNodeLayout.height })} /></div>
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">H</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.height} onChange={(event) => handleResizeNode(selectedNode.id, { x: selectedNodeLayout.x, y: selectedNodeLayout.y, width: selectedNodeLayout.width, height: Number(event.target.value) })} /></div>
                </div>
                {selectedNode.type === 'parent' ? (
                  <div className="relevant-experiences-editor-hud__field">
                    <label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-connection-target">Connect To</label>
                    <select
                      id="relevant-experiences-editor-connection-target"
                      className="relevant-experiences-editor-hud__select"
                      value={pendingConnectionTargetId}
                      onChange={(event) => setPendingConnectionTargetId(event.target.value)}
                    >
                      <option value="">(choose a card)</option>
                      {availableConnectionTargets.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
                    </select>
                  </div>
                ) : null}
                <div className="relevant-experiences-editor-hud__card-actions">
                  {selectedNode.type === 'parent' ? <button type="button" onClick={handleAddConnection} disabled={!pendingConnectionTargetId}>Add Connector</button> : null}
                  <button type="button" onClick={() => resetNodeToPersisted(selectedNode.id)}>Reset Card</button>
                </div>
              </>
            ) : <div className="relevant-experiences-editor-hud__hint">Click a parent or child card to move, resize, or edit its content.</div>}

            <div className="relevant-experiences-editor-hud__connection-editor">
              <div className="relevant-experiences-editor-hud__card-row">
                <label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-selected-connection">Connector</label>
                <select
                  id="relevant-experiences-editor-selected-connection"
                  className="relevant-experiences-editor-hud__select"
                  value={selectedConnectionId ?? ''}
                  onChange={(event) => {
                    const nextConnectionId = event.target.value || null;
                    setSelectedConnectionId(nextConnectionId);
                    setSelectedNodeId(null);
                    setSelectedViaIndex(null);
                    setTagEditorDraft({ nodeId: null, value: '' });
                  }}
                >
                  <option value="">(click a line)</option>
                  {connections.map((connection) => <option key={connection.id} value={connection.id}>{`${connection.id} - ${connection.from} -> ${connection.to}`}</option>)}
                </select>
              </div>

              {selectedConnection ? (
                <>
                  <div className="relevant-experiences-editor-hud__grid">
                    <div className="relevant-experiences-editor-hud__field">
                      <label className="relevant-experiences-editor-hud__label">From</label>
                      <select className="relevant-experiences-editor-hud__select" value={selectedConnection.from} onChange={(event) => updateConnection(selectedConnection.id, (connection) => ({ ...connection, from: event.target.value }))}>
                        {nodes.filter((node) => node.type === 'parent').map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
                      </select>
                    </div>
                    <div className="relevant-experiences-editor-hud__field">
                      <label className="relevant-experiences-editor-hud__label">To</label>
                      <select className="relevant-experiences-editor-hud__select" value={selectedConnection.to} onChange={(event) => {
                        const nextTo = event.target.value;
                        const targetNode = nodes.find((node) => node.id === nextTo);
                        updateConnection(selectedConnection.id, (connection) => ({
                          ...connection,
                          to: nextTo,
                          variant: targetNode?.type === 'parent' ? 'group' : 'detail',
                        }));
                      }}>
                        {nodes.filter((node) => node.id !== selectedConnection.from).map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
                      </select>
                    </div>
                    <div className="relevant-experiences-editor-hud__field">
                      <label className="relevant-experiences-editor-hud__label">From Side</label>
                      <select className="relevant-experiences-editor-hud__select" value={selectedConnection.fromAnchor} onChange={(event) => updateConnection(selectedConnection.id, (connection) => ({ ...connection, fromAnchor: event.target.value as RelevantExperienceConnectionAnchor }))}>
                        {CONNECTION_ANCHORS.map((anchor) => <option key={anchor} value={anchor}>{anchor}</option>)}
                      </select>
                    </div>
                    <div className="relevant-experiences-editor-hud__field">
                      <label className="relevant-experiences-editor-hud__label">To Side</label>
                      <select className="relevant-experiences-editor-hud__select" value={selectedConnection.toAnchor} onChange={(event) => updateConnection(selectedConnection.id, (connection) => ({ ...connection, toAnchor: event.target.value as RelevantExperienceConnectionAnchor }))}>
                        {CONNECTION_ANCHORS.map((anchor) => <option key={anchor} value={anchor}>{anchor}</option>)}
                      </select>
                    </div>
                    <div className="relevant-experiences-editor-hud__field">
                      <label className="relevant-experiences-editor-hud__label">Style</label>
                      <select className="relevant-experiences-editor-hud__select" value={selectedConnection.variant} onChange={(event) => updateConnection(selectedConnection.id, (connection) => ({ ...connection, variant: event.target.value as RelevantExperienceConnection['variant'] }))}>
                        <option value="group">group</option>
                        <option value="detail">detail</option>
                      </select>
                    </div>
                    <div className="relevant-experiences-editor-hud__field">
                      <label className="relevant-experiences-editor-hud__label">Corners</label>
                      <input className="relevant-experiences-editor-hud__input" value={selectedConnection.viaPoints.length} readOnly />
                    </div>
                  </div>
                  <div className="relevant-experiences-editor-hud__card-actions">
                    <button type="button" onClick={handleAddViaPoint}>Add Corner</button>
                    <button type="button" onClick={handleOrthogonalizeSelectedConnection} disabled={selectedConnection.viaPoints.length === 0}>Orthogonalize</button>
                    <button type="button" onClick={handleRemoveSelectedViaPoint} disabled={selectedViaIndex === null}>Remove Selected Corner</button>
                    <button type="button" onClick={() => handleRemoveConnection(selectedConnection.id)}>Delete Connector</button>
                  </div>
                  <div className="relevant-experiences-editor-hud__hint">Shift-click a connector to add a corner. Drag a corner to move it. Alt-click a corner to remove it. Orthogonalize snaps connector segments to true horizontal/vertical.</div>
                </>
              ) : <div className="relevant-experiences-editor-hud__hint">Connectors are empty by default. Select a parent card and use Add Connector to create one.</div>}
            </div>
          </div> : null}
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__actions"><button type="button" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>{saveFeedback === 'success' ? <span className="relevant-experiences-editor-hud__hint">Saved</span> : null}{saveFeedback === 'error' ? <span className="relevant-experiences-editor-hud__hint">Save failed</span> : null}<button type="button" onClick={handleCopyEdits}>Copy Layout JSON</button>{copyFeedback === 'success' ? <span className="relevant-experiences-editor-hud__hint">Copied</span> : null}{copyFeedback === 'error' ? <span className="relevant-experiences-editor-hud__hint">Copy failed</span> : null}<button type="button" onClick={handleResetEdits}>Reset All</button><button type="button" onClick={() => setHudPos({ x: 0, y: 0 })}>HUD Reset</button></div> : null}
        </div>,
        document.body,
      ) : null}
    </>
  );
}
