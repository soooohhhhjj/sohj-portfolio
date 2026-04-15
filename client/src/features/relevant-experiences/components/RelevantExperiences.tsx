import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { BriefcaseBusiness, FolderKanban } from 'lucide-react';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Section, SectionContent } from '../../../shared/components/Container';
import { useRelevantExperiencesEditorState } from '../hooks/useRelevantExperiencesEditorState';
import { RelevantExperienceConnections } from './RelevantExperienceConnections';
import { truncateToFit } from './truncateToFit';
import type {
  RelevantExperienceConnection,
  RelevantExperienceConnectionAnchor,
  RelevantExperienceConnectionPoint,
  RelevantExperienceNode,
  RelevantExperienceNodeLayout,
} from './relevantExperiences.types';
import './RelevantExperiences.css';

type RelevantExperiencesProps = { editorEnabled?: boolean };

const HUD_POS_STORAGE_KEY = 'sohj.debug.relevantExperiences.hudPos.v1';
const HUD_MINIMIZED_STORAGE_KEY = 'sohj.debug.relevantExperiences.hudMinimized.v1';
const MIN_CARD_WIDTH = 200;
const MIN_CARD_HEIGHT = 170;
const MIN_CANVAS_WIDTH = 930;
const MIN_CANVAS_HEIGHT = 1840;
const CONNECTION_ANCHORS: RelevantExperienceConnectionAnchor[] = ['top', 'right', 'bottom', 'left'];

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

function clampCanvasPoint(point: RelevantExperienceConnectionPoint) {
  return {
    x: Math.min(Math.max(0, Math.round(point.x)), MIN_CANVAS_WIDTH),
    y: Math.min(Math.max(0, Math.round(point.y)), MIN_CANVAS_HEIGHT),
  };
}

function createConnectionId() {
  return `connection-${Math.random().toString(36).slice(2, 10)}`;
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

function RelevantExperienceCard({ node, selected, editorEnabled, canvasElement, onMeasure, onSelect, onMove, onResize }: {
  node: RelevantExperienceNode;
  selected: boolean;
  editorEnabled: boolean;
  canvasElement: HTMLDivElement | null;
  onMeasure: (nodeId: string, layout: RelevantExperienceNodeLayout) => void;
  onSelect: (nodeId: string) => void;
  onMove: (nodeId: string, next: { x: number; y: number }) => void;
  onResize: (nodeId: string, next: { x: number; y: number; width: number; height: number }) => void;
}) {
  const layout = node.layout;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const parentSurfaceRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const resizeStateRef = useRef<{ pointerId: number; handle: 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; startLeft: number; startTop: number; startWidth: number; startHeight: number } | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasElement;
    const card = cardRef.current;
    const surface = node.type === 'parent' ? parentSurfaceRef.current : card;
    if (!canvas || !card || !surface) {
      return;
    }

    const measure = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const surfaceRect = surface.getBoundingClientRect();
      const scaleX = canvas.offsetWidth > 0 ? canvasRect.width / canvas.offsetWidth : 1;
      const scaleY = canvas.offsetHeight > 0 ? canvasRect.height / canvas.offsetHeight : 1;

      onMeasure(node.id, {
        x: Math.round((surfaceRect.left - canvasRect.left) / (scaleX || 1)),
        y: Math.round((surfaceRect.top - canvasRect.top) / (scaleY || 1)),
        width: Math.round(surfaceRect.width / (scaleX || 1)),
        height: Math.round(surfaceRect.height / (scaleY || 1)),
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(surface);
    window.addEventListener('resize', measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [canvasElement, layout.height, layout.width, layout.x, layout.y, node.details, node.id, node.title, node.type, onMeasure]);

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
    <div ref={cardRef} className={`relevant-experiences-card relevant-experiences-card--${node.type} ${node.type === 'parent' ? 'memory-node' : 'journey-map-card journey-showcase__card journey-showcase__card--child'} ${editorEnabled ? 'relevant-experiences-card--editable' : ''} ${selected ? 'relevant-experiences-card--selected' : ''}`} style={{ left: `${layout.x}px`, top: `${layout.y}px`, width: `${layout.width}px`, height: `${layout.height}px` }} role="button" tabIndex={0} aria-label={`${node.title} card`} onClick={() => onSelect(node.id)} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {editorEnabled ? (
        <>
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--nw" onPointerDown={(event) => handleResizePointerDown('nw', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--ne" onPointerDown={(event) => handleResizePointerDown('ne', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--sw" onPointerDown={(event) => handleResizePointerDown('sw', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
          <span className="relevant-experiences-resize-handle relevant-experiences-resize-handle--se" onPointerDown={(event) => handleResizePointerDown('se', event)} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
        </>
      ) : null}
      {node.type === 'parent' && node.icon ? (
        <article ref={parentSurfaceRef} className="journey-memory-parent-card journey-map-card journey-showcase__card journey-showcase__card--parent">
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
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(MIN_CANVAS_WIDTH);
  const [measuredNodeLayouts, setMeasuredNodeLayouts] = useState<Record<string, RelevantExperienceNodeLayout>>({});
  const [hudMinimized, setHudMinimized] = useState<boolean>(() => readLocalStorageJson(HUD_MINIMIZED_STORAGE_KEY, false));
  const [hudPos, setHudPos] = useState<{ x: number; y: number }>(() => readLocalStorageJson(HUD_POS_STORAGE_KEY, { x: 0, y: 0 }));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedViaIndex, setSelectedViaIndex] = useState<number | null>(null);
  const [pendingConnectionTargetId, setPendingConnectionTargetId] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const {
    content,
    isLoading,
    loadError,
    updateNode,
    updateConnection,
    addConnection,
    removeConnection,
    resetNodeToPersisted,
    resetToPersisted,
    save,
    isSaving,
    saveFeedback,
  } = useRelevantExperiencesEditorState();

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
  const connections = useMemo(() => content?.connections ?? [], [content]);
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedConnection = useMemo(() => connections.find((connection) => connection.id === selectedConnectionId) ?? null, [connections, selectedConnectionId]);
  const selectedNodeLayout = selectedNode?.layout ?? null;
  const measuredNodeLayoutsById = useMemo(() => new Map(Object.entries(measuredNodeLayouts)), [measuredNodeLayouts]);
  const availableConnectionTargets = useMemo(() => (
    selectedNode
      ? nodes.filter((node) => node.id !== selectedNode.id)
      : []
  ), [nodes, selectedNode]);
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
    const lane = laneRef.current;
    if (!lane) {
      return { x: 0, y: 0 };
    }

    const rect = lane.getBoundingClientRect();
    const nextScale = rect.width > 0 ? rect.width / baseCanvasWidth : scale || 1;

    return clampCanvasPoint({
      x: (clientX - rect.left) / nextScale,
      y: (clientY - rect.top) / nextScale,
    });
  }, [baseCanvasWidth, scale]);

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
    setSelectedViaIndex(null);
  }, []);

  const handleSelectConnection = useCallback((connectionId: string, event: ReactPointerEvent<SVGPathElement>) => {
    event.stopPropagation();
    setSelectedConnectionId(connectionId);
    setSelectedNodeId(null);
    setSelectedViaIndex(null);

    if (!event.shiftKey) {
      return;
    }

    const point = getCanvasPointFromPointer(event.clientX, event.clientY);
    updateConnection(connectionId, (connection) => {
      const nextViaPoints = [...connection.viaPoints, point];
      setSelectedViaIndex(nextViaPoints.length - 1);
      return {
        ...connection,
        viaPoints: nextViaPoints,
      };
    });
  }, [getCanvasPointFromPointer, updateConnection]);

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

    if (event.altKey) {
      updateConnection(connectionId, (connection) => ({
        ...connection,
        viaPoints: connection.viaPoints.filter((_, index) => index !== viaIndex),
      }));
      setSelectedViaIndex(null);
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
            })
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
  }, [connections, getCanvasPointFromPointer, updateConnection]);

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
    setPendingConnectionTargetId('');
  }, [addConnection, nodes, pendingConnectionTargetId, selectedNode]);

  const handleRemoveConnection = useCallback((connectionId: string) => {
    removeConnection(connectionId);
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null);
      setSelectedViaIndex(null);
    }
  }, [removeConnection, selectedConnectionId]);

  const handleAddViaPoint = useCallback(() => {
    if (!selectedConnection) {
      return;
    }

    updateConnection(selectedConnection.id, (connection) => {
      const nextPoint = connection.viaPoints.length > 0
        ? connection.viaPoints[connection.viaPoints.length - 1]
        : { x: MIN_CANVAS_WIDTH / 2, y: MIN_CANVAS_HEIGHT / 2 };
      const nextViaPoints = [
        ...connection.viaPoints,
        clampCanvasPoint({ x: nextPoint.x + 32, y: nextPoint.y + 32 }),
      ];
      setSelectedViaIndex(nextViaPoints.length - 1);
      return {
        ...connection,
        viaPoints: nextViaPoints,
      };
    });
  }, [selectedConnection, updateConnection]);

  const handleRemoveSelectedViaPoint = useCallback(() => {
    if (!selectedConnection || selectedViaIndex === null) {
      return;
    }

    updateConnection(selectedConnection.id, (connection) => ({
      ...connection,
      viaPoints: connection.viaPoints.filter((_, index) => index !== selectedViaIndex),
    }));
    setSelectedViaIndex(null);
  }, [selectedConnection, selectedViaIndex, updateConnection]);

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
    setPendingConnectionTargetId('');
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
                  <div ref={canvasRef} className="relevant-experiences-map__canvas" style={{ width: `${baseCanvasWidth}px`, height: `${canvasHeight}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    {editorEnabled ? <div className="relevant-experiences-editor-grid" /> : null}
                    <RelevantExperienceConnections
                      canvasHeight={canvasHeight}
                      canvasWidth={baseCanvasWidth}
                      connections={connections}
                      nodes={nodes}
                      measuredNodeLayouts={measuredNodeLayoutsById}
                      editorEnabled={editorEnabled}
                      selectedConnectionId={selectedConnectionId}
                      selectedViaIndex={selectedViaIndex}
                      onSelectConnection={handleSelectConnection}
                      onSelectViaPoint={handleSelectViaPoint}
                    />
                    {nodes.map((node) => <RelevantExperienceCard key={node.id} node={node} selected={selectedNodeId === node.id} editorEnabled={editorEnabled} canvasElement={canvasRef.current} onMeasure={handleMeasureNode} onSelect={handleSelectNode} onMove={handleMoveNode} onResize={handleResizeNode} />)}
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
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__meta"><span>canvas: {Math.round(baseCanvasWidth)} x {canvasHeight}</span><span>scale: {scale.toFixed(3)}</span><span>card: {selectedNode?.id ?? 'none'}</span><span>connector: {selectedConnection?.id ?? 'none'}</span></div> : null}
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__card-editor"><div className="relevant-experiences-editor-hud__card-row"><label className="relevant-experiences-editor-hud__label" htmlFor="relevant-experiences-editor-selected-card">Card</label><select id="relevant-experiences-editor-selected-card" className="relevant-experiences-editor-hud__select" value={selectedNodeId ?? ''} onChange={(event) => { const nextNodeId = event.target.value || null; setSelectedNodeId(nextNodeId); setSelectedConnectionId(null); setSelectedViaIndex(null); }}><option value="">(click a card)</option>{nodes.map((node) => <option key={node.id} value={node.id}>{`${node.id} - ${node.title}`}</option>)}</select></div>
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
                    <button type="button" onClick={handleRemoveSelectedViaPoint} disabled={selectedViaIndex === null}>Remove Selected Corner</button>
                    <button type="button" onClick={() => handleRemoveConnection(selectedConnection.id)}>Delete Connector</button>
                  </div>
                  <div className="relevant-experiences-editor-hud__hint">Shift-click a connector to add a corner. Drag a corner to move it. Alt-click a corner to remove it.</div>
                </>
              ) : <div className="relevant-experiences-editor-hud__hint">Connectors are empty by default. Select a parent card and use Add Connector to create one.</div>}
            </div>
          </div> : null}
          {!hudMinimized ? <div className="relevant-experiences-editor-hud__actions"><button type="button" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>{saveFeedback === 'success' ? <span className="relevant-experiences-editor-hud__hint">Saved</span> : null}{saveFeedback === 'error' ? <span className="relevant-experiences-editor-hud__hint">Save failed</span> : null}<button type="button" onClick={handleCopyEdits}>Copy Layout JSON</button>{copyFeedback === 'success' ? <span className="relevant-experiences-editor-hud__hint">Copied</span> : null}{copyFeedback === 'error' ? <span className="relevant-experiences-editor-hud__hint">Copy failed</span> : null}<button type="button" onClick={handleResetEdits}>Reset All</button><button type="button" onClick={() => setHudPos({ x: 0, y: 0 })}>HUD Reset</button></div> : null}
        </div>,
        document.body,
      ) : null}
    </Section>
  );
}
