import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { Database, PaintbrushVertical, Server, Wrench } from 'lucide-react';
import {
  FaBootstrap,
  FaCss3Alt,
  FaGitAlt,
  FaGithub,
  FaHtml5,
  FaJava,
  FaNodeJs,
  FaPhp,
  FaPython,
  FaReact,
} from 'react-icons/fa';
import {
  SiAndroidstudio,
  SiCloudinary,
  SiCplusplus,
  SiExpress,
  SiFirebase,
  SiJavascript,
  SiMongodb,
  SiMongoose,
  SiMysql,
  SiPostman,
  SiTailwindcss,
  SiTypescript,
} from 'react-icons/si';
import type { IconType } from 'react-icons';
import { VscVscode } from 'react-icons/vsc';
import { BREAKPOINTS } from '../../../shared/constants/breakpoints';
import { Section, SectionContent } from '../../../shared/components/Container';
import { GlassCard } from '../../../shared/components/GlassCard';
import { useSkillsEditorState } from '../hooks/useSkillsEditorState';
import type { SkillsCard, SkillsCardLayout, SkillsLine, SkillsTitleLayout } from '../types/skills.types';
import {
  SKILLS_MIN_CARD_HEIGHT,
  SKILLS_MIN_CARD_WIDTH,
  SKILLS_LINE_HEIGHT,
  SKILLS_MIN_LINE_WIDTH,
  SKILLS_TITLE_DEFAULT_LAYOUT,
} from '../utils/skillsContent';
import './Skills.css';

interface SkillsProps {
  editorEnabled?: boolean;
  shouldAnimate: boolean;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';
type LineResizeHandle = 'w' | 'e';

const orderedCardIds = ['frontend', 'backend', 'database', 'tools'] as const;
const SKILLS_CANVAS_MIN_HEIGHT = 620;
const SKILLS_CANVAS_MIN_WIDTH = 1160;
const SKILLS_HUD_POS_STORAGE_KEY = 'sohj.debug.skills.hudPos.v1';
const SKILLS_TITLE_OBJECT_ID = 'skills-title-object';
const SKILLS_SECTION_TITLE = 'Skills & Tools';

type SkillsDragLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

const iconMap: Record<string, IconType> = {
  react: FaReact,
  typescript: SiTypescript,
  tailwindcss: SiTailwindcss,
  javascript: SiJavascript,
  html5: FaHtml5,
  java: FaJava,
  python: FaPython,
  css3: FaCss3Alt,
  bootstrap: FaBootstrap,
  nodejs: FaNodeJs,
  express: SiExpress,
  php: FaPhp,
  firebase: SiFirebase,
  mongodb: SiMongodb,
  mongoose: SiMongoose,
  mysql: SiMysql,
  git: FaGitAlt,
  github: FaGithub,
  postman: SiPostman,
  cloudinary: SiCloudinary,
  cpp: SiCplusplus,
  vscode: VscVscode,
  androidstudio: SiAndroidstudio,
};

type HeaderIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const cardIconMap: Record<string, HeaderIconComponent> = {
  frontend: PaintbrushVertical,
  backend: Server,
  database: Database,
  tools: Wrench,
};

const cardIconClassMap: Record<string, string> = {
  frontend: 'h-[23px] w-[23px]',
  backend: 'h-[21px] w-[21px]',
  database: 'h-[21px] w-[21px]',
  tools: 'h-[21px] w-[21px]',
};

function clampCardLayout(layout: SkillsCardLayout, canvasWidth: number, canvasHeight: number): SkillsCardLayout {
  const width = Math.max(SKILLS_MIN_CARD_WIDTH, Math.round(layout.width));
  const height = Math.max(SKILLS_MIN_CARD_HEIGHT, Math.round(layout.height));
  const maxX = Math.max(0, canvasWidth - width);
  const maxY = Math.max(0, canvasHeight - height);

  return {
    x: Math.min(Math.max(0, Math.round(layout.x)), maxX),
    y: Math.min(Math.max(0, Math.round(layout.y)), maxY),
    width,
    height,
  };
}

function clampLineLayout(
  layout: SkillsLine['layout'],
  canvasWidth: number,
  canvasHeight: number,
): SkillsLine['layout'] {
  const width = Math.max(SKILLS_MIN_LINE_WIDTH, Math.round(layout.width));
  const height = SKILLS_LINE_HEIGHT;
  const maxX = Math.max(0, canvasWidth - width);
  const maxY = Math.max(0, canvasHeight - height);

  return {
    x: Math.min(Math.max(0, Math.round(layout.x)), maxX),
    y: Math.min(Math.max(0, Math.round(layout.y)), maxY),
    width,
    height,
    rotation: 'rotation' in layout && typeof layout.rotation === 'number'
      ? Math.round(layout.rotation)
      : 0,
  };
}

function clampTitleLayout(layout: SkillsTitleLayout, canvasWidth: number, canvasHeight: number): SkillsTitleLayout {
  const maxX = Math.max(0, canvasWidth - 320);
  const maxY = Math.max(0, canvasHeight - 60);

  return {
    x: Math.min(Math.max(0, Math.round(layout.x)), maxX),
    y: Math.min(Math.max(0, Math.round(layout.y)), maxY),
  };
}

function resolveCanvasHeight(cards: SkillsCard[]) {
  const furthestBottom = cards.reduce((maxBottom, card) => (
    Math.max(maxBottom, card.layout.y + card.layout.height)
  ), 0);

  return Math.max(SKILLS_CANVAS_MIN_HEIGHT, furthestBottom);
}

function resolveCanvasHeightWithLines(cards: SkillsCard[], lines: SkillsLine[]) {
  const cardsBottom = resolveCanvasHeight(cards);
  const linesBottom = lines.reduce((maxBottom, line) => (
    Math.max(maxBottom, line.layout.y + line.layout.height)
  ), 0);

  return Math.max(cardsBottom, SKILLS_CANVAS_MIN_HEIGHT, linesBottom);
}

function createSkillsLine(id: string, existingLineCount: number): SkillsLine {
  return {
    id,
    layout: {
      x: 48,
      y: 40 + existingLineCount * 28,
      width: 220,
      height: SKILLS_LINE_HEIGHT,
      rotation: 0,
    },
  };
}

function resolveCanvasWidth(cards: SkillsCard[]) {
  const furthestRight = cards.reduce((maxRight, card) => (
    Math.max(maxRight, card.layout.x + card.layout.width)
  ), 0);

  return Math.max(SKILLS_CANVAS_MIN_WIDTH, furthestRight);
}

function readLocalStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function SkillsAnimatedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span
          key={`${text}-${index}`}
          className={`skills-flicker-char ${
            index % 7 === 0
              ? 'skills-flicker-char--strong'
              : index % 5 === 0
                ? 'skills-flicker-char--medium'
                : index % 3 === 0
                  ? 'skills-flicker-char--light'
                  : ''
          }`}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

function SkillsStackItem({
  icon,
  name,
}: {
  icon: string;
  name: string;
}) {
  const Icon = iconMap[icon];

  return (
    <div
      className="
        skills-stack-item inline-flex min-h-[40px] items-center
        gap-[0.45rem] py-[0.45rem]
      "
    >
      <span
        className="
          skills-stack-item__icon inline-flex h-[20px] w-[20px]
          items-center justify-center text-[20px]
        "
        aria-hidden="true"
      >
        {Icon ? <Icon /> : null}
      </span>
      <span className="skills-stack-item__name text-[12px] tracking-[0.3px]">
        {name}
      </span>
    </div>
  );
}

function SkillsPanelContent({
  card,
  editorEnabled = false,
}: {
  card: SkillsCard;
  editorEnabled?: boolean;
}) {
  const HeaderIcon = cardIconMap[card.id];
  const [animationKey, setAnimationKey] = useState(0);
  const shouldAnimateInteractions = !editorEnabled;

  return (
    <GlassCard
      className={`skills-panel relative flex h-full flex-col rounded-[2px] px-4 py-5 md:px-5 md:py-6 ${
        shouldAnimateInteractions ? 'cursor-pointer' : ''
      }`}
      onMouseEnter={shouldAnimateInteractions ? () => setAnimationKey((previous) => previous + 1) : undefined}
      onClick={shouldAnimateInteractions ? () => setAnimationKey((previous) => previous + 1) : undefined}
    >
      <div className="skills-panel__title-wrap flex flex-col gap-[0.55rem]">
        <div className="flex items-center justify-between gap-4 px-[2px]">
          <h3 className="skills-panel__title font-bruno text-[17px] font-semibold tracking-[0.8px] sm:text-[18px]">
            <span key={`title-${card.id}-${animationKey}`} className="skills-flicker-text skills-panel__title-text">
              <SkillsAnimatedText text={card.title} />
            </span>
          </h3>
          {HeaderIcon ? (
            <span className="skills-panel__header-icon" aria-hidden="true">
              <span key={`header-${card.id}-${animationKey}`} className="skills-flicker-icon">
                <HeaderIcon className={cardIconClassMap[card.id] ?? 'h-[16px] w-[16px]'} />
              </span>
            </span>
          ) : null}
        </div>
        <span className="skills-panel__header-line" aria-hidden="true" />
      </div>

      <div className="skills-panel__columns mt-[1.35rem] grid flex-1 grid-cols-1 gap-1">
        <div className="skills-group flex flex-col">
          <div className="flex w-full flex-col items-start">
            <div className="skills-group__list flex flex-wrap gap-x-[1.4rem] gap-y-[0.95rem] px-[2px]">
              {card.previousStacks.map((stack) => (
                <SkillsStackItem
                  key={stack.id}
                  icon={stack.icon}
                  name={stack.name}
                />
              ))}
            </div>
            <div className="skills-group__heading inline-flex w-full flex-col items-start">
              <span className="skills-group__line" aria-hidden="true" />
              <p className="skills-group__label m-0 px-[2px] font-jura text-[10px] tracking-[0.2px] sm:text-[11px]">
                {card.backLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="skills-group skills-group--current flex flex-col">
          <div className="flex w-full flex-col items-end">
            <div className="skills-group__list flex flex-wrap justify-end gap-x-[1.4rem] gap-y-[0.95rem] px-[2px]">
              {card.currentStacks.map((stack) => (
                <SkillsStackItem
                  key={stack.id}
                  icon={stack.icon}
                  name={stack.name}
                />
              ))}
            </div>
            <div className="skills-group__heading inline-flex w-full flex-col items-end">
              <span className="skills-group__line" aria-hidden="true" />
              <p className="skills-group__label m-0 px-[2px] text-right font-jura text-[10px] tracking-[0.2px] sm:text-[11px]">
                {card.frontLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function SkillsEditorCard({
  card,
  selected,
  multiSelected,
  editorEnabled,
  canvasElement,
  shouldAnimate,
  onActivate,
  onDragStart,
  onDragEnd,
  onMove,
  onResize,
}: {
  card: SkillsCard;
  selected: boolean;
  multiSelected: boolean;
  editorEnabled: boolean;
  canvasElement: HTMLDivElement | null;
  shouldAnimate: boolean;
  onActivate: (
    cardId: string,
    options?: { toggleSelection?: boolean; preserveSelection?: boolean; additiveSelection?: boolean },
  ) => void;
  onDragStart: (cardId: string, preserveSelection: boolean) => void;
  onDragEnd: () => void;
  onMove: (cardId: string, delta: { x: number; y: number }) => void;
  onResize: (cardId: string, next: SkillsCardLayout) => void;
}) {
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    pointerId: number;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!editorEnabled || event.button !== 0) {
      return;
    }

    event.preventDefault();

    const isAdditiveSelection = event.ctrlKey || event.metaKey;

    if (isAdditiveSelection) {
      onActivate(card.id, { additiveSelection: true });
      return;
    }

    const canvasRect = canvasElement?.getBoundingClientRect();
    const scaleX = canvasElement && canvasRect && canvasElement.offsetWidth > 0
      ? canvasRect.width / canvasElement.offsetWidth
      : 1;
    const scaleY = canvasElement && canvasRect && canvasElement.offsetHeight > 0
      ? canvasRect.height / canvasElement.offsetHeight
      : 1;

    const preserveSelection = selected && multiSelected;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: card.layout.x,
      startTop: card.layout.y,
      scaleX: scaleX || 1,
      scaleY: scaleY || 1,
    };

    onDragStart(card.id, preserveSelection);
    onActivate(card.id, preserveSelection ? { preserveSelection: true } : undefined);

    const handleMove = (moveEvent: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== moveEvent.pointerId) {
        return;
      }

      onMove(card.id, {
        x: Math.round((moveEvent.clientX - dragState.startX) / dragState.scaleX),
        y: Math.round((moveEvent.clientY - dragState.startY) / dragState.scaleY),
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      if (dragStateRef.current?.pointerId === upEvent.pointerId) {
        dragStateRef.current = null;
      }

      onDragEnd();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const handleResizePointerDown = (handle: ResizeHandle, event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!editorEnabled || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: card.layout.x,
      startTop: card.layout.y,
      startWidth: card.layout.width,
      startHeight: card.layout.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate(card.id);
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const resizeState = resizeStateRef.current;

    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - resizeState.startX;
    const deltaY = event.clientY - resizeState.startY;

    let nextX = resizeState.startLeft;
    let nextY = resizeState.startTop;
    let nextWidth = resizeState.startWidth;
    let nextHeight = resizeState.startHeight;

    if (resizeState.handle.includes('e')) nextWidth = resizeState.startWidth + deltaX;
    if (resizeState.handle.includes('s')) nextHeight = resizeState.startHeight + deltaY;
    if (resizeState.handle.includes('w')) {
      nextWidth = resizeState.startWidth - deltaX;
      nextX = resizeState.startLeft + deltaX;
    }
    if (resizeState.handle.includes('n')) {
      nextHeight = resizeState.startHeight - deltaY;
      nextY = resizeState.startTop + deltaY;
    }

    onResize(card.id, {
      x: Math.round(nextX),
      y: Math.round(nextY),
      width: Math.round(nextWidth),
      height: Math.round(nextHeight),
    });
  };

  const handleResizePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (resizeStateRef.current?.pointerId === event.pointerId) {
      resizeStateRef.current = null;
    }
  };

  return (
    <motion.article
      className={`
        skills-map-card absolute
        ${editorEnabled ? 'skills-map-card--editable' : ''}
        ${selected ? 'skills-map-card--selected' : ''}
      `}
      style={{
        left: `${card.layout.x}px`,
        top: `${card.layout.y}px`,
        width: `${card.layout.width}px`,
        height: `${card.layout.height}px`,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.55, ease: [0.12, 0.7, 0.63, 0.9] }}
      onClick={() => {
        if (!editorEnabled) {
      onActivate(card.id, { toggleSelection: true });
        }
      }}
      onPointerDown={handlePointerDown}
    >
      {editorEnabled ? (
        <>
          <span
            className="skills-resize-handle skills-resize-handle--nw"
            onPointerDown={(event) => handleResizePointerDown('nw', event)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="skills-resize-handle skills-resize-handle--ne"
            onPointerDown={(event) => handleResizePointerDown('ne', event)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="skills-resize-handle skills-resize-handle--sw"
            onPointerDown={(event) => handleResizePointerDown('sw', event)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="skills-resize-handle skills-resize-handle--se"
            onPointerDown={(event) => handleResizePointerDown('se', event)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
        </>
      ) : null}

      <SkillsPanelContent card={card} editorEnabled={editorEnabled} />
    </motion.article>
  );
}

function SkillsEditorLine({
  line,
  selected,
  multiSelected,
  editorEnabled,
  canvasElement,
  shouldAnimate,
  onActivate,
  onDragStart,
  onDragEnd,
  onMove,
  onResize,
}: {
  line: SkillsLine;
  selected: boolean;
  multiSelected: boolean;
  editorEnabled: boolean;
  canvasElement: HTMLDivElement | null;
  shouldAnimate: boolean;
  onActivate: (
    id: string,
    options?: { toggleSelection?: boolean; preserveSelection?: boolean; additiveSelection?: boolean },
  ) => void;
  onDragStart: (id: string, preserveSelection: boolean) => void;
  onDragEnd: () => void;
  onMove: (id: string, delta: { x: number; y: number }) => void;
  onResize: (id: string, next: SkillsLine['layout']) => void;
}) {
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    pointerId: number;
    handle: LineResizeHandle;
    startX: number;
    startLeft: number;
    startWidth: number;
  } | null>(null);
  const rotateStateRef = useRef<{
    pointerId: number;
    centerX: number;
    centerY: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!editorEnabled || event.button !== 0) {
      return;
    }

    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      onActivate(line.id, { additiveSelection: true });
      return;
    }

    const canvasRect = canvasElement?.getBoundingClientRect();
    const scaleX = canvasElement && canvasRect && canvasElement.offsetWidth > 0
      ? canvasRect.width / canvasElement.offsetWidth
      : 1;
    const scaleY = canvasElement && canvasRect && canvasElement.offsetHeight > 0
      ? canvasRect.height / canvasElement.offsetHeight
      : 1;
    const preserveSelection = selected && multiSelected;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scaleX: scaleX || 1,
      scaleY: scaleY || 1,
    };

    onDragStart(line.id, preserveSelection);
    onActivate(line.id, preserveSelection ? { preserveSelection: true } : undefined);

    const handleMove = (moveEvent: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== moveEvent.pointerId) {
        return;
      }

      onMove(line.id, {
        x: Math.round((moveEvent.clientX - dragState.startX) / dragState.scaleX),
        y: Math.round((moveEvent.clientY - dragState.startY) / dragState.scaleY),
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      if (dragStateRef.current?.pointerId === upEvent.pointerId) {
        dragStateRef.current = null;
      }

      onDragEnd();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const handleResizePointerDown = (handle: LineResizeHandle, event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!editorEnabled || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startLeft: line.layout.x,
      startWidth: line.layout.width,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate(line.id);
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const resizeState = resizeStateRef.current;

    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - resizeState.startX;
    let nextX = resizeState.startLeft;
    let nextWidth = resizeState.startWidth;

    if (resizeState.handle === 'e') {
      nextWidth = resizeState.startWidth + deltaX;
    }

    if (resizeState.handle === 'w') {
      nextWidth = resizeState.startWidth - deltaX;
      nextX = resizeState.startLeft + deltaX;
    }

    onResize(line.id, {
      ...line.layout,
      x: Math.round(nextX),
      width: Math.round(nextWidth),
    });
  };

  const handleResizePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (resizeStateRef.current?.pointerId === event.pointerId) {
      resizeStateRef.current = null;
    }
  };

  const handleRotatePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!editorEnabled || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const canvasRect = canvasElement?.getBoundingClientRect();
    const scaleX = canvasElement && canvasRect && canvasElement.offsetWidth > 0
      ? canvasRect.width / canvasElement.offsetWidth
      : 1;
    const scaleY = canvasElement && canvasRect && canvasElement.offsetHeight > 0
      ? canvasRect.height / canvasElement.offsetHeight
      : 1;

    rotateStateRef.current = {
      pointerId: event.pointerId,
      centerX: line.layout.x + line.layout.width / 2,
      centerY: line.layout.y + line.layout.height / 2,
      scaleX: scaleX || 1,
      scaleY: scaleY || 1,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate(line.id);
  };

  const handleRotatePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const rotateState = rotateStateRef.current;

    if (!rotateState || rotateState.pointerId !== event.pointerId) {
      return;
    }

    const canvasRect = canvasElement?.getBoundingClientRect();

    if (!canvasRect) {
      return;
    }

    const pointerX = (event.clientX - canvasRect.left) / rotateState.scaleX;
    const pointerY = (event.clientY - canvasRect.top) / rotateState.scaleY;
    const angle = Math.round(
      (Math.atan2(pointerY - rotateState.centerY, pointerX - rotateState.centerX) * 180) / Math.PI,
    );

    onResize(line.id, {
      ...line.layout,
      rotation: angle,
    });
  };

  const handleRotatePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (rotateStateRef.current?.pointerId === event.pointerId) {
      rotateStateRef.current = null;
    }
  };

  return (
    <motion.article
      className={`skills-map-line absolute ${selected ? 'skills-map-line--selected' : ''}`}
      style={{
        left: `${line.layout.x}px`,
        top: `${line.layout.y}px`,
        width: `${line.layout.width}px`,
        height: `${line.layout.height}px`,
        transformOrigin: 'center center',
      }}
      initial={{ opacity: 0, y: 10, rotate: line.layout.rotation }}
      animate={
        shouldAnimate
          ? { opacity: 1, y: 0, rotate: line.layout.rotation }
          : { opacity: 0, y: 10, rotate: line.layout.rotation }
      }
      transition={{ duration: 0.4, ease: [0.12, 0.7, 0.63, 0.9] }}
      onPointerDown={handlePointerDown}
    >
      <span className="skills-map-line__glow" aria-hidden="true" />
      {editorEnabled ? (
        <>
          <span
            className="skills-line-resize-handle skills-line-resize-handle--w"
            onPointerDown={(event) => handleResizePointerDown('w', event)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="skills-line-resize-handle skills-line-resize-handle--e"
            onPointerDown={(event) => handleResizePointerDown('e', event)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
          <span
            className="skills-line-rotate-handle"
            onPointerDown={handleRotatePointerDown}
            onPointerMove={handleRotatePointerMove}
            onPointerUp={handleRotatePointerUp}
          />
        </>
      ) : null}
    </motion.article>
  );
}

function SkillsEditorTitle({
  title,
  layout,
  selected,
  multiSelected,
  editorEnabled,
  canvasElement,
  shouldAnimate,
  objectRef,
  onActivate,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  title: string;
  layout: SkillsTitleLayout;
  selected: boolean;
  multiSelected: boolean;
  editorEnabled: boolean;
  canvasElement: HTMLDivElement | null;
  shouldAnimate: boolean;
  objectRef: React.RefObject<HTMLDivElement | null>;
  onActivate: (
    id: string,
    options?: { toggleSelection?: boolean; preserveSelection?: boolean; additiveSelection?: boolean },
  ) => void;
  onDragStart: (id: string, preserveSelection: boolean) => void;
  onDragEnd: () => void;
  onMove: (id: string, delta: { x: number; y: number }) => void;
}) {
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!editorEnabled || event.button !== 0) {
      return;
    }

    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      onActivate(SKILLS_TITLE_OBJECT_ID, { additiveSelection: true });
      return;
    }

    const canvasRect = canvasElement?.getBoundingClientRect();
    const scaleX = canvasElement && canvasRect && canvasElement.offsetWidth > 0
      ? canvasRect.width / canvasElement.offsetWidth
      : 1;
    const scaleY = canvasElement && canvasRect && canvasElement.offsetHeight > 0
      ? canvasRect.height / canvasElement.offsetHeight
      : 1;
    const preserveSelection = selected && multiSelected;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scaleX: scaleX || 1,
      scaleY: scaleY || 1,
    };

    onDragStart(SKILLS_TITLE_OBJECT_ID, preserveSelection);
    onActivate(SKILLS_TITLE_OBJECT_ID, preserveSelection ? { preserveSelection: true } : undefined);

    const handleMove = (moveEvent: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== moveEvent.pointerId) {
        return;
      }

      onMove(SKILLS_TITLE_OBJECT_ID, {
        x: Math.round((moveEvent.clientX - dragState.startX) / dragState.scaleX),
        y: Math.round((moveEvent.clientY - dragState.startY) / dragState.scaleY),
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      if (dragStateRef.current?.pointerId === upEvent.pointerId) {
        dragStateRef.current = null;
      }

      onDragEnd();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  return (
    <motion.div
      ref={objectRef}
      className={`skills-map__title-object ${selected ? 'skills-map__title-object--selected' : ''}`}
      style={{
        left: `${layout.x}px`,
        top: `${layout.y}px`,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: [0.12, 0.7, 0.63, 0.9] }}
      onPointerDown={handlePointerDown}
    >
      <h2 className="skills-section__title font-bruno text-[35px] font-bold tracking-[2px] text-[var(--base-text-color)] md:text-5xl">
        {title}
      </h2>
    </motion.div>
  );
}

export function Skills({ editorEnabled = false, shouldAnimate }: SkillsProps) {
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === 'undefined' ? BREAKPOINTS.lg : window.innerWidth,
  );
  const activeLayoutKey = viewportWidth >= BREAKPOINTS.lg ? 'lg' : 'md';
  const {
    content,
    isLoading,
    error,
    updateCard,
    updateLine,
    addLine,
    removeLine,
    updateTitleLayout,
    resetToPersisted,
    save,
    isSaving,
    saveFeedback,
  } = useSkillsEditorState(activeLayoutKey);
  const laneRef = useRef<HTMLDivElement | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [hudPos, setHudPos] = useState<{ x: number; y: number }>(() => (
    readLocalStorageJson(SKILLS_HUD_POS_STORAGE_KEY, { x: 0, y: 0 })
  ));
  const groupDragStartLayoutsRef = useRef<Map<string, SkillsDragLayout> | null>(null);
  const titleObjectRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const lane = laneRef.current;

    if (!lane) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      setCanvasWidth(entries[0]?.contentRect.width ?? 0);
    });

    resizeObserver.observe(lane);
    setCanvasWidth(lane.getBoundingClientRect().width);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SKILLS_HUD_POS_STORAGE_KEY, JSON.stringify(hudPos));
    }
  }, [hudPos]);

  const orderedCards = useMemo(() => {
    if (!content) {
      return [];
    }

    return orderedCardIds.reduce<SkillsCard[]>((cards, cardId) => {
      const card = content.cards.find((item) => item.id === cardId);

      if (card) {
        cards.push(card);
      }

      return cards;
    }, []);
  }, [content]);

  const editorLines = useMemo(() => content?.lines ?? [], [content]);
  const titleLayout = content?.titleLayout ?? SKILLS_TITLE_DEFAULT_LAYOUT;

  const selectedCards = orderedCards.filter((card) => selectedCardIds.includes(card.id));
  const selectedLines = editorLines.filter((line) => selectedCardIds.includes(line.id));
  const selectedTitle = selectedCardIds.length === 1 && selectedCardIds[0] === SKILLS_TITLE_OBJECT_ID
    ? titleLayout
    : null;
  const selectedCard = selectedCardIds.length === 1
    ? orderedCards.find((card) => card.id === selectedCardIds[0]) ?? null
    : null;
  const selectedLine = selectedCardIds.length === 1
    ? editorLines.find((line) => line.id === selectedCardIds[0]) ?? null
    : null;
  const layoutMode = viewportWidth >= BREAKPOINTS.md ? 'desktop' : 'linear';
  const displayCanvasHeight = resolveCanvasHeightWithLines(orderedCards, editorLines);
  const activeCanvasWidth = resolveCanvasWidth(orderedCards);
  const scale = !canvasWidth || canvasWidth >= activeCanvasWidth
    ? 1
    : canvasWidth / activeCanvasWidth;
  const selectedTitleDimensions = useMemo(() => ({
    width: titleObjectRef.current?.offsetWidth ?? 320,
    height: titleObjectRef.current?.offsetHeight ?? 60,
  }), [selectedCardIds, titleLayout.x, titleLayout.y]);

  const updateCardLayout = (cardId: string, nextLayout: SkillsCardLayout) => {
    updateCard(cardId, (card) => ({
      ...card,
      layout: clampCardLayout(
        nextLayout,
        activeCanvasWidth,
        Math.max(displayCanvasHeight, nextLayout.y + nextLayout.height),
      ),
    }));
  };

  const updateLineLayout = (lineId: string, nextLayout: SkillsLine['layout']) => {
    updateLine(lineId, (line) => ({
      ...line,
      layout: clampLineLayout(
        nextLayout,
        activeCanvasWidth,
        Math.max(displayCanvasHeight, nextLayout.y + nextLayout.height),
      ),
    }));
  };

  const updateSkillsTitleLayout = (nextLayout: SkillsTitleLayout) => {
    updateTitleLayout((layout) => clampTitleLayout(
      nextLayout ?? layout,
      activeCanvasWidth,
      displayCanvasHeight,
    ));
  };

  useEffect(() => {
    if (!editorEnabled || layoutMode !== 'desktop' || selectedCardIds.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (selectedCards.length === 0 && selectedLines.length === 0 && !selectedTitle) {
        return;
      }

      let deltaX = 0;
      let deltaY = 0;

      if (event.key === 'ArrowLeft') deltaX = -1;
      if (event.key === 'ArrowRight') deltaX = 1;
      if (event.key === 'ArrowUp') deltaY = -1;
      if (event.key === 'ArrowDown') deltaY = 1;

      if (!deltaX && !deltaY) {
        return;
      }

      event.preventDefault();

      selectedCards.forEach((selected) => {
        updateCardLayout(selected.id, {
          ...selected.layout,
          x: selected.layout.x + deltaX,
          y: selected.layout.y + deltaY,
        });
      });
      selectedLines.forEach((selected) => {
        updateLineLayout(selected.id, {
          ...selected.layout,
          x: selected.layout.x + deltaX,
          y: selected.layout.y + deltaY,
        });
      });
      if (selectedTitle) {
        updateSkillsTitleLayout({
          x: selectedTitle.x + deltaX,
          y: selectedTitle.y + deltaY,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorEnabled, layoutMode, selectedCardIds, selectedCards, selectedLines, selectedTitle]);

  const handleHudPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startX = hudPos.x;
    const startY = hudPos.y;

    const handleMove = (moveEvent: PointerEvent) => {
      setHudPos({
        x: Math.round(startX + moveEvent.clientX - startClientX),
        y: Math.round(startY + moveEvent.clientY - startClientY),
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

  const handleActivateCard = (
    cardId: string,
    options?: { toggleSelection?: boolean; preserveSelection?: boolean; additiveSelection?: boolean },
  ) => {
    setSelectedCardIds((previous) => {
      if (options?.preserveSelection) {
        return previous.includes(cardId) ? previous : [cardId];
      }

      if (options?.additiveSelection) {
        return previous.includes(cardId)
          ? previous.filter((selectedId) => selectedId !== cardId)
          : [...previous, cardId];
      }

      if (options?.toggleSelection) {
        return previous.length === 1 && previous[0] === cardId ? [] : [cardId];
      }

      return [cardId];
    });
  };

  const handleDragStart = (cardId: string, preserveSelection: boolean) => {
    const entityIdsToMove = preserveSelection && selectedCardIds.includes(cardId)
      ? selectedCardIds
      : [cardId];

    groupDragStartLayoutsRef.current = new Map<string, SkillsDragLayout>([
        ...(entityIdsToMove.includes(SKILLS_TITLE_OBJECT_ID)
          ? [[SKILLS_TITLE_OBJECT_ID, { ...titleLayout, width: 0, height: 0 } satisfies SkillsDragLayout] as const]
          : []),
        ...orderedCards
          .filter((card) => entityIdsToMove.includes(card.id))
          .map((card) => [card.id, { ...card.layout } satisfies SkillsDragLayout] as const),
        ...editorLines
          .filter((line) => entityIdsToMove.includes(line.id))
          .map((line) => [line.id, { ...line.layout } satisfies SkillsDragLayout] as const),
      ]);

    if (!preserveSelection) {
      setSelectedCardIds([cardId]);
    }
  };

  const handleDragMove = (cardId: string, delta: { x: number; y: number }) => {
    const startLayouts = groupDragStartLayoutsRef.current;

    if (!startLayouts || !startLayouts.has(cardId)) {
      return;
    }

    startLayouts.forEach((layout, selectedId) => {
      if (selectedId === SKILLS_TITLE_OBJECT_ID) {
        updateSkillsTitleLayout({
          x: layout.x + delta.x,
          y: layout.y + delta.y,
        });
        return;
      }

      if (orderedCards.some((card) => card.id === selectedId)) {
        updateCardLayout(selectedId, {
          ...layout,
          x: layout.x + delta.x,
          y: layout.y + delta.y,
        });
        return;
      }

      updateLineLayout(selectedId, {
        ...layout,
        x: layout.x + delta.x,
        y: layout.y + delta.y,
        rotation: layout.rotation ?? 0,
      });
    });
  };

  const handleDragEnd = () => {
    groupDragStartLayoutsRef.current = null;
  };

  const handleAddLine = () => {
    const nextLine = createSkillsLine(`line-${Date.now()}`, editorLines.length);
    addLine(nextLine);
    setSelectedCardIds([nextLine.id]);
  };

  const handleDuplicateLine = () => {
    if (!selectedLine) {
      return;
    }

    const duplicatedLine: SkillsLine = {
      id: `line-${Date.now()}`,
      layout: clampLineLayout(
        {
          ...selectedLine.layout,
          y: selectedLine.layout.y + 20,
        },
        activeCanvasWidth,
        Math.max(displayCanvasHeight, selectedLine.layout.y + selectedLine.layout.height + 20),
      ),
    };

    addLine(duplicatedLine);
    setSelectedCardIds([duplicatedLine.id]);
  };

  const handleFlipLine = () => {
    if (!selectedLine) {
      return;
    }

    updateLineLayout(selectedLine.id, {
      ...selectedLine.layout,
      rotation: -selectedLine.layout.rotation,
    });
  };

  const handleRemoveLine = () => {
    if (!selectedLine) {
      return;
    }

    removeLine(selectedLine.id);
    setSelectedCardIds([]);
  };

  const handleCenterSelectedObjectHorizontally = () => {
    const selectedEntities = [
      ...selectedCards.map((card) => ({
        id: card.id,
        type: 'card' as const,
        x: card.layout.x,
        y: card.layout.y,
        width: card.layout.width,
      })),
      ...selectedLines.map((line) => ({
        id: line.id,
        type: 'line' as const,
        x: line.layout.x,
        y: line.layout.y,
        width: line.layout.width,
      })),
      ...(selectedCardIds.includes(SKILLS_TITLE_OBJECT_ID)
        ? [{
          id: SKILLS_TITLE_OBJECT_ID,
          type: 'title' as const,
          x: titleLayout.x,
          y: titleLayout.y,
          width: selectedTitleDimensions.width,
        }]
        : []),
    ];

    if (selectedEntities.length === 0) {
      return;
    }

    const selectionLeft = Math.min(...selectedEntities.map((entity) => entity.x));
    const selectionRight = Math.max(...selectedEntities.map((entity) => entity.x + entity.width));
    const selectionWidth = selectionRight - selectionLeft;
    const targetLeft = Math.round((activeCanvasWidth - selectionWidth) / 2);
    const deltaX = targetLeft - selectionLeft;

    selectedCards.forEach((card) => {
      updateCardLayout(card.id, {
        ...card.layout,
        x: card.layout.x + deltaX,
      });
    });

    selectedLines.forEach((line) => {
      updateLineLayout(line.id, {
        ...line.layout,
        x: line.layout.x + deltaX,
      });
    });

    if (selectedCardIds.includes(SKILLS_TITLE_OBJECT_ID)) {
      updateSkillsTitleLayout({
        x: titleLayout.x + deltaX,
        y: titleLayout.y,
      });
    }
  };

  if (isLoading) {
    return null;
  }

  if (!content) {
    return (
      <Section className="section-style relative z-10 mt-16 text-[var(--base-text-color)] md:mt-20 lg:mt-24">
        <SectionContent>
          <div className="relevant-experiences-intro skills-section__intro relative z-[1] mt-8 text-center md:mt-[2.4rem] lg:mt-[2.8rem]">
            <h2 className="relevant-experiences-intro__title skills-section__title font-bruno text-[35px] font-bold tracking-[2px] text-[var(--base-text-color)] md:text-5xl">
              Skills &amp; Tools
            </h2>
            {error ? (
              <p className="skills-error-copy relevant-experiences-intro__copy mt-3 font-jura text-[13px] tracking-[0.3px] sm:text-[16px] lg:text-[17px]">
                {error}
              </p>
            ) : null}
          </div>
        </SectionContent>
      </Section>
    );
  }

  return (
    <motion.div
      initial={{ y: '100vh' }}
      animate={{ y: shouldAnimate ? 0 : '100vh' }}
      transition={{ duration: 1.7, ease: [0.12, 0.7, 0.63, 0.9], delay: 0.14 }}
    >
      <Section className="section-style skills-shell relative z-10 mt-16 text-[var(--base-text-color)] md:mt-20 lg:mt-32">
        <section id="skills-section" className="skills-section relative w-full pb-4">
          <SectionContent>
            {layoutMode !== 'desktop' ? (
              <div className="relevant-experiences-intro skills-section__intro relative z-[1] mt-8 text-center md:mt-[2.4rem] lg:mt-[2.8rem]">
                <h2 className="relevant-experiences-intro__title skills-section__title font-bruno text-[35px] font-bold tracking-[2px] text-[var(--base-text-color)] md:text-5xl">
                  {SKILLS_SECTION_TITLE}
                </h2>
              </div>
            ) : null}

            {layoutMode === 'desktop' ? (
              <div ref={laneRef} className="skills-editor-lane relative z-[1] mt-[2.35rem] w-full">
                <div
                  className={`skills-map-shell ${editorEnabled ? 'skills-map-shell--editable' : ''}`}
                  style={{ height: `${displayCanvasHeight * scale}px` }}
                >
                  {editorEnabled ? <div className="skills-map-shell__center-guide" aria-hidden="true" /> : null}

                  <div
                    ref={setCanvasElement}
                    className={`
                      skills-map absolute left-1/2
                      ${editorEnabled ? 'skills-map--editable' : ''}
                    `}
                    style={{
                      width: `${activeCanvasWidth}px`,
                      height: `${displayCanvasHeight}px`,
                      transform: `translateX(-50%) scale(${scale})`,
                      transformOrigin: 'top center',
                    }}
                    onPointerDown={(event) => {
                      if (!editorEnabled || event.target !== event.currentTarget) {
                        return;
                      }

                      setSelectedCardIds([]);
                    }}
                  >
                    <SkillsEditorTitle
                      title={SKILLS_SECTION_TITLE}
                      layout={titleLayout}
                      selected={selectedCardIds.includes(SKILLS_TITLE_OBJECT_ID)}
                      multiSelected={selectedCardIds.length > 1}
                      editorEnabled={editorEnabled}
                      canvasElement={canvasElement}
                      shouldAnimate={shouldAnimate}
                      objectRef={titleObjectRef}
                      onActivate={handleActivateCard}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onMove={handleDragMove}
                    />

                    {editorEnabled ? <div className="skills-map__grid" /> : null}

                    {editorLines.map((line) => (
                      <SkillsEditorLine
                        key={line.id}
                        line={line}
                        selected={selectedCardIds.includes(line.id)}
                        multiSelected={selectedCardIds.length > 1}
                        editorEnabled={editorEnabled}
                        canvasElement={canvasElement}
                        shouldAnimate={shouldAnimate}
                        onActivate={handleActivateCard}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onMove={handleDragMove}
                        onResize={updateLineLayout}
                      />
                    ))}

                    {orderedCards.map((card) => (
                      <SkillsEditorCard
                        key={card.id}
                        card={card}
                        selected={selectedCardIds.includes(card.id)}
                        multiSelected={selectedCardIds.length > 1}
                        editorEnabled={editorEnabled}
                        canvasElement={canvasElement}
                        shouldAnimate={shouldAnimate}
                        onActivate={handleActivateCard}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onMove={handleDragMove}
                        onResize={updateCardLayout}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="
                  skills-grid skills-grid--ordered relative z-[1] mt-[2.35rem] flex flex-col
                  gap-7 sm:gap-10 md:gap-4
                "
              >
                {orderedCards.map((card, index) => (
                  <motion.article
                    key={card.id}
                    className="relative w-full"
                    initial={{ opacity: 0, y: 30 }}
                    animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.08 + index * 0.08,
                      ease: [0.12, 0.7, 0.63, 0.9],
                    }}
                  >
                    <SkillsPanelContent card={card} editorEnabled={editorEnabled} />
                  </motion.article>
                ))}
              </div>
            )}
          </SectionContent>
        </section>

        {editorEnabled && layoutMode === 'desktop' ? (
          <div
            className="skills-editor-hud"
            style={{ transform: `translate(${hudPos.x}px, ${hudPos.y}px)` }}
          >
            <div
              className="skills-editor-hud__drag-grip"
              onPointerDown={handleHudPointerDown}
              aria-label="Drag skills editor panel"
              role="presentation"
            />
            <div className="skills-editor-hud__title">Skills Edit Mode</div>
            {selectedCard ? (
              <div className="skills-editor-hud__fields">
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-title">
                    Card
                  </label>
                  <input
                    id="skills-editor-title"
                    className="skills-editor-hud__input"
                    value={selectedCard.title}
                    readOnly
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-x">
                    X
                  </label>
                  <input
                    id="skills-editor-x"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedCard.layout.x}
                    onChange={(event) => updateCardLayout(selectedCard.id, {
                      ...selectedCard.layout,
                      x: Number(event.target.value),
                    })}
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-y">
                    Y
                  </label>
                  <input
                    id="skills-editor-y"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedCard.layout.y}
                    onChange={(event) => updateCardLayout(selectedCard.id, {
                      ...selectedCard.layout,
                      y: Number(event.target.value),
                    })}
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-width">
                    W
                  </label>
                  <input
                    id="skills-editor-width"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedCard.layout.width}
                    onChange={(event) => updateCardLayout(selectedCard.id, {
                      ...selectedCard.layout,
                      width: Number(event.target.value),
                    })}
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-height">
                    H
                  </label>
                  <input
                    id="skills-editor-height"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedCard.layout.height}
                    onChange={(event) => updateCardLayout(selectedCard.id, {
                      ...selectedCard.layout,
                      height: Number(event.target.value),
                    })}
                  />
                </div>
              </div>
            ) : selectedTitle ? (
              <div className="skills-editor-hud__fields">
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-title-object">
                    Object
                  </label>
                  <input
                    id="skills-editor-title-object"
                    className="skills-editor-hud__input"
                    value="Section Title"
                    readOnly
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-title-x">
                    X
                  </label>
                  <input
                    id="skills-editor-title-x"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedTitle.x}
                    onChange={(event) => updateSkillsTitleLayout({
                      x: Number(event.target.value),
                      y: selectedTitle.y,
                    })}
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-title-y">
                    Y
                  </label>
                  <input
                    id="skills-editor-title-y"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedTitle.y}
                    onChange={(event) => updateSkillsTitleLayout({
                      x: selectedTitle.x,
                      y: Number(event.target.value),
                    })}
                  />
                </div>
              </div>
            ) : selectedLine ? (
              <div className="skills-editor-hud__fields">
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-line">
                    Object
                  </label>
                  <input
                    id="skills-editor-line"
                    className="skills-editor-hud__input"
                    value="Glow Line"
                    readOnly
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-line-x">
                    X
                  </label>
                  <input
                    id="skills-editor-line-x"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedLine.layout.x}
                    onChange={(event) => updateLineLayout(selectedLine.id, {
                      ...selectedLine.layout,
                      x: Number(event.target.value),
                    })}
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-line-y">
                    Y
                  </label>
                  <input
                    id="skills-editor-line-y"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedLine.layout.y}
                    onChange={(event) => updateLineLayout(selectedLine.id, {
                      ...selectedLine.layout,
                      y: Number(event.target.value),
                    })}
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-line-width">
                    W
                  </label>
                  <input
                    id="skills-editor-line-width"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedLine.layout.width}
                    onChange={(event) => updateLineLayout(selectedLine.id, {
                      ...selectedLine.layout,
                      width: Number(event.target.value),
                    })}
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-line-height">
                    H
                  </label>
                  <input
                    id="skills-editor-line-height"
                    className="skills-editor-hud__input"
                    value={selectedLine.layout.height}
                    readOnly
                  />
                </div>
                <div className="skills-editor-hud__field">
                  <label className="skills-editor-hud__label" htmlFor="skills-editor-line-rotation">
                    Rot
                  </label>
                  <input
                    id="skills-editor-line-rotation"
                    className="skills-editor-hud__input"
                    type="number"
                    value={selectedLine.layout.rotation}
                    onChange={(event) => updateLineLayout(selectedLine.id, {
                      ...selectedLine.layout,
                      rotation: Number(event.target.value),
                    })}
                  />
                </div>
              </div>
            ) : (
              <p className="skills-editor-hud__hint">
                {selectedCardIds.length > 1
                  ? `${selectedCardIds.length} objects selected. Drag or use arrow keys to move them together.`
                  : 'Select a card to edit its layout.'}
              </p>
            )}

            <div className="skills-editor-hud__actions">
              {selectedCardIds.length > 0 ? (
                <button type="button" onClick={handleCenterSelectedObjectHorizontally}>
                  Center X
                </button>
              ) : null}
              {selectedLine ? (
                <button type="button" onClick={handleDuplicateLine}>
                  Duplicate Line
                </button>
              ) : null}
              {selectedLine ? (
                <button type="button" onClick={handleFlipLine}>
                  Flip Line
                </button>
              ) : null}
              {selectedLine ? (
                <button type="button" onClick={handleRemoveLine}>
                  Remove Line
                </button>
              ) : null}
              <button type="button" onClick={handleAddLine}>
                Add Line
              </button>
              <button type="button" onClick={() => void save()} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {saveFeedback === 'success' ? (
                <span className="skills-editor-hud__hint">Saved</span>
              ) : null}
              {saveFeedback === 'error' ? (
                <span className="skills-editor-hud__hint">Save failed</span>
              ) : null}
              <button type="button" onClick={resetToPersisted}>
                Reset All
              </button>
            </div>
          </div>
        ) : null}
      </Section>
    </motion.div>
  );
}
