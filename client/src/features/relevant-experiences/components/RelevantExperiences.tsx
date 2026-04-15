import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { BriefcaseBusiness, FolderKanban } from 'lucide-react';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Section, SectionContent } from '../../../shared/components/Container';
import { useRelevantExperiencesEditorState } from '../hooks/useRelevantExperiencesEditorState';
import { truncateToFit } from './truncateToFit';
import type { RelevantExperienceNode, RelevantExperienceNodeLayout } from './relevantExperiences.types';
import './RelevantExperiences.css';

type RelevantExperiencesProps = { editorEnabled?: boolean };

const HUD_POS_STORAGE_KEY = 'sohj.debug.relevantExperiences.hudPos.v1';
const HUD_MINIMIZED_STORAGE_KEY = 'sohj.debug.relevantExperiences.hudMinimized.v1';
const MIN_CARD_WIDTH = 200;
const MIN_CARD_HEIGHT = 170;
const MIN_CANVAS_WIDTH = 930;
const MIN_CANVAS_HEIGHT = 1840;

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

function clampNodeLayoutToCanvas(layout: RelevantExperienceNodeLayout) {
  const width = Math.min(Math.max(MIN_CARD_WIDTH, layout.width), MIN_CANVAS_WIDTH);
  const height = Math.min(Math.max(MIN_CARD_HEIGHT, layout.height), MIN_CANVAS_HEIGHT);

  return {
    x: Math.min(Math.max(0, layout.x), Math.max(0, MIN_CANVAS_WIDTH - width)),
    y: Math.min(Math.max(0, layout.y), Math.max(0, MIN_CANVAS_HEIGHT - height)),
    width,
    height,
  };
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

function RelevantExperienceCard({ node, selected, editorEnabled, onSelect, onMove, onResize }: {
  node: RelevantExperienceNode;
  selected: boolean;
  editorEnabled: boolean;
  onSelect: (nodeId: string) => void;
  onMove: (nodeId: string, next: { x: number; y: number }) => void;
  onResize: (nodeId: string, next: { x: number; y: number; width: number; height: number }) => void;
}) {
  const layout = node.layout;
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const resizeStateRef = useRef<{ pointerId: number; handle: 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; startLeft: number; startTop: number; startWidth: number; startHeight: number } | null>(null);
  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!editorEnabled || event.button !== 0) return;
    event.preventDefault();
    dragStateRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startLeft: layout.x, startTop: layout.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(node.id);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    onMove(node.id, { x: Math.round(dragState.startLeft + event.clientX - dragState.startX), y: Math.round(dragState.startTop + event.clientY - dragState.startY) });
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) dragStateRef.current = null;
  };
  const handleResizePointerDown = (handle: 'nw' | 'ne' | 'sw' | 'se', event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!editorEnabled || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = { pointerId: event.pointerId, handle, startX: event.clientX, startY: event.clientY, startLeft: layout.x, startTop: layout.y, startWidth: layout.width, startHeight: layout.height };
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(node.id);
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
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node.id); }
  };
  const imageSrc = resolveAssetPath(node.image);
  return (
    <div className={`relevant-experiences-card relevant-experiences-card--${node.type} ${node.type === 'parent' ? 'memory-node' : 'journey-map-card journey-showcase__card journey-showcase__card--child'} ${editorEnabled ? 'relevant-experiences-card--editable' : ''} ${selected ? 'relevant-experiences-card--selected' : ''}`} style={{ left: `${layout.x}px`, top: `${layout.y}px`, width: `${layout.width}px`, height: `${layout.height}px` }} role="button" tabIndex={0} aria-label={`${node.title} card`} onClick={() => onSelect(node.id)} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {editorEnabled ? (
        <>
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--nw" onPointerDown={(event) => handleResizePointerDown('nw', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--ne" onPointerDown={(event) => handleResizePointerDown('ne', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--sw" onPointerDown={(event) => handleResizePointerDown('sw', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--se" onPointerDown={(event) => handleResizePointerDown('se', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
        </>
      ) : null}
      {node.type === 'parent' && node.icon ? (
        <article className="journey-memory-parent-card journey-map-card journey-showcase__card journey-showcase__card--parent">
          <div className="journey-map-card__parent-header">
            <div className="journey-map-card__icon-shell"><RelevantExperienceIconGlyph icon={node.icon} /></div>
            <h3 className="journey-map-card__title font-jura">{node.title}</h3>
          </div>
          <TruncatedText text={node.details} className="journey-map-card__details journey-map-card__details--truncate font-jura text-sm leading-relaxed" />
        </article>
      ) : (
        <>
          {imageSrc ? <GlassCard width="w-full" corner="rounded-[2px]" shadow="" className="overflow-hidden journey-map-card__media"><img src={imageSrc} alt={node.title} className="journey-map-card__image" loading="lazy" draggable={false} /></GlassCard> : null}
          <h4 className="journey-map-card__child-title font-jura">{node.title}</h4>
          <div className="ml-1 flex flex-col gap-0 font-jura text-xs base-text-color"><div className="mt-1 flex items-center leading-none"><span className="mb-1 select-none opacity-55">L</span><TruncatedText as="span" text={node.details} className="ml-1 truncate opacity-70" /></div></div>
        </>
      )}
    </div>
  );
}

export function RelevantExperiences({ editorEnabled = false }: RelevantExperiencesProps) {
  const laneRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(MIN_CANVAS_WIDTH);
  const [hudMinimized, setHudMinimized] = useState<boolean>(() => readLocalStorageJson(HUD_MINIMIZED_STORAGE_KEY, false));
  const [hudPos, setHudPos] = useState<{ x: number; y: number }>(() => readLocalStorageJson(HUD_POS_STORAGE_KEY, { x: 0, y: 0 }));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const { content, isLoading, loadError, updateNode, resetNodeToPersisted, resetToPersisted, save, isSaving, saveFeedback } = useRelevantExperiencesEditorState();

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
    if (typeof window !== 'undefined') window.localStorage.setItem(HUD_POS_STORAGE_KEY, JSON.stringify(hudPos));
  }, [hudPos]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(HUD_MINIMIZED_STORAGE_KEY, JSON.stringify(hudMinimized));
  }, [hudMinimized]);

  const nodes = useMemo(() => content?.nodes ?? [], [content]);
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedNodeLayout = selectedNode?.layout ?? null;
  const baseCanvasWidth = MIN_CANVAS_WIDTH;
  const scale = useMemo(() => (canvasWidth ? canvasWidth / baseCanvasWidth : 1), [baseCanvasWidth, canvasWidth]);
  const canvasHeight = MIN_CANVAS_HEIGHT;

  const updateNodeLayout = useCallback((nodeId: string, transform: (layout: RelevantExperienceNodeLayout) => RelevantExperienceNodeLayout) => {
    updateNode(nodeId, (node) => ({ ...node, layout: clampNodeLayoutToCanvas(transform(node.layout)) }));
  }, [updateNode]);

  const handleMoveNode = useCallback((nodeId: string, next: { x: number; y: number }) => {
    updateNodeLayout(nodeId, (layout) => ({ ...layout, x: next.x, y: next.y }));
  }, [updateNodeLayout]);

  const handleResizeNode = useCallback((nodeId: string, next: { x: number; y: number; width: number; height: number }) => {
    updateNodeLayout(nodeId, () => ({ x: next.x, y: next.y, width: next.width, height: next.height }));
  }, [updateNodeLayout]);

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
  }, [resetToPersisted]);

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
                <div className="relevant-experiences-map" style={{ height: `${canvasHeight * scale}px` }}>
                  <div className="relevant-experiences-map__canvas" style={{ width: `${baseCanvasWidth}px`, height: `${canvasHeight}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    {editorEnabled ? <div className="relevant-experiences-editor-grid" /> : null}
                    {nodes.map((node) => <RelevantExperienceCard key={node.id} node={node} selected={selectedNodeId === node.id} editorEnabled={editorEnabled} onSelect={(nodeId) => { setSelectedNodeId(nodeId); }} onMove={handleMoveNode} onResize={handleResizeNode} />)}
                  </div>
                </div>
              </div>
            </>
          )}
        </SectionContent>
      </div>
      {editorEnabled && content && typeof document !== 'undefined' ? createPortal(
        <div className={`relevant-experiences-editor-hud ${hudMinimized ? 'relevant-experiences-editor-hud--minimized' : ''}`} style={{ transform: `translate(${hudPos.x}px, ${hudPos.y}px)` }}>
          <div className="relevant-experiences-editor-hud__drag-grip" onPointerDown={handleHudPointerDown} aria-label="Drag relevant experiences editor panel" role="presentation" />
          <div className="relevant-experiences-editor-hud__title-row">
            <div className="relevant-experiences-editor-hud__title">Relevant Experiences Edit Mode</div>
            <div className="relevant-experiences-editor-hud__title-actions"><button type="button" className="relevant-experiences-editor-hud__mini-toggle" onClick={() => setHudMinimized((prev) => !prev)}>{hudMinimized ? 'Expand' : 'Minimize'}</button></div>
          </div>
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__meta"><span>canvas: {Math.round(baseCanvasWidth)} x {canvasHeight}</span><span>scale: {scale.toFixed(3)}</span><span>card: {selectedNode?.id ?? 'none'}</span></div> : null}
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__card-editor"><div className="relevant-experiences-editor-hud__card-row"><label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-selected-card">Card</label><select id="relevant-experiences-editor-selected-card" className="relevant-experiences-editor-hud__select" value={selectedNodeId ?? ''} onChange={(event) => { setSelectedNodeId(event.target.value || null); }}><option value="">(click a card)</option>{nodes.map((node) => <option key={node.id} value={node.id}>{`${node.id} - ${node.title}`}</option>)}</select></div>
            {selectedNode && selectedNodeLayout ? (
              <>
                <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-card-title">Title</label><input id="relevant-experiences-editor-card-title" className="relevant-experiences-editor-hud__input" value={selectedNode.title} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, title: event.target.value }))} /></div>
                <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-card-details">{selectedNode.type === 'parent' ? 'Summary' : 'Details'}</label><textarea id="relevant-experiences-editor-card-details" className="relevant-experiences-editor-hud__textarea" rows={selectedNode.type === 'parent' ? 4 : 3} value={selectedNode.details} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, details: event.target.value }))} /></div>
                <div className="relevant-experiences-editor-hud__grid">
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">X</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.x} onChange={(event) => handleMoveNode(selectedNode.id, { x: Number(event.target.value), y: selectedNodeLayout.y })} /></div>
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">Y</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.y} onChange={(event) => handleMoveNode(selectedNode.id, { x: selectedNodeLayout.x, y: Number(event.target.value) })} /></div>
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">W</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.width} onChange={(event) => handleResizeNode(selectedNode.id, { x: selectedNodeLayout.x, y: selectedNodeLayout.y, width: Number(event.target.value), height: selectedNodeLayout.height })} /></div>
                  <div className="relevant-experiences-editor-hud__field"><label className="relevant-experiences-editor-hud__label">H</label><input className="relevant-experiences-editor-hud__input" type="number" value={selectedNodeLayout.height} onChange={(event) => handleResizeNode(selectedNode.id, { x: selectedNodeLayout.x, y: selectedNodeLayout.y, width: selectedNodeLayout.width, height: Number(event.target.value) })} /></div>
                </div>
                <div className="relevant-experiences-editor-hud__card-actions"><button type="button" onClick={() => resetNodeToPersisted(selectedNode.id)}>Reset Card</button></div>
              </>
            ) : <div className="relevant-experiences-editor-hud__hint">Click a parent or child card to move, resize, or edit its content.</div>}
          </div> : null}
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__actions"><button type="button" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>{saveFeedback === 'success' ? <span className="relevant-experiences-editor-hud__hint">Saved</span> : null}{saveFeedback === 'error' ? <span className="relevant-experiences-editor-hud__hint">Save failed</span> : null}<button type="button" onClick={handleCopyEdits}>Copy Layout JSON</button>{copyFeedback === 'success' ? <span className="relevant-experiences-editor-hud__hint">Copied</span> : null}{copyFeedback === 'error' ? <span className="relevant-experiences-editor-hud__hint">Copy failed</span> : null}<button type="button" onClick={handleResetEdits}>Reset All</button><button type="button" onClick={() => setHudPos({ x: 0, y: 0 })}>HUD Reset</button></div> : null}
        </div>,
        document.body,
      ) : null}
    </Section>
  );
}
