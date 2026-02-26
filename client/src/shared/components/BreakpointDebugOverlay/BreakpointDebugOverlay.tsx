import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { BREAKPOINTS } from '../../constants/breakpoints';

type ActiveBreakpoint = 'mobile' | 'dinosaur' | 'xxsm' | 'xsm' | 'sm' | 'md' | 'lg' | 'xl';

interface ThresholdInfo {
  current: ActiveBreakpoint;
  next: ActiveBreakpoint;
  threshold: number;
}

interface Position {
  x: number;
  y: number;
}

const LABEL_STORAGE_KEY = 'sohj.breakpointDebug.labelPosition';

function getActiveBreakpoint(width: number): ActiveBreakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  if (width >= BREAKPOINTS.xsm) return 'xsm';
  if (width >= BREAKPOINTS.xxsm) return 'xxsm';
  if (width >= BREAKPOINTS.dinosaur) return 'dinosaur';
  return 'mobile';
}

function getThresholdInfo(width: number): ThresholdInfo | null {
  const current = getActiveBreakpoint(width);

  if (current === 'xl') return { current, next: 'lg', threshold: BREAKPOINTS.xl };
  if (current === 'lg') return { current, next: 'md', threshold: BREAKPOINTS.lg };
  if (current === 'md') return { current, next: 'sm', threshold: BREAKPOINTS.md };
  if (current === 'sm') return { current, next: 'xsm', threshold: BREAKPOINTS.sm };
  if (current === 'xsm') return { current, next: 'xxsm', threshold: BREAKPOINTS.xsm };
  if (current === 'xxsm') return { current, next: 'dinosaur', threshold: BREAKPOINTS.xxsm };
  if (current === 'dinosaur') {
    return { current, next: 'mobile', threshold: BREAKPOINTS.dinosaur };
  }

  return null;
}

function getFrameClass(threshold: number) {
  if (threshold === BREAKPOINTS.xl) return 'breakpoint-debug__frame--xl';
  if (threshold === BREAKPOINTS.lg) return 'breakpoint-debug__frame--lg';
  if (threshold === BREAKPOINTS.md) return 'breakpoint-debug__frame--md';
  if (threshold === BREAKPOINTS.sm) return 'breakpoint-debug__frame--sm';
  if (threshold === BREAKPOINTS.xsm) return 'breakpoint-debug__frame--xsm';
  if (threshold === BREAKPOINTS.xxsm) return 'breakpoint-debug__frame--xxsm';
  if (threshold === BREAKPOINTS.dinosaur) return 'breakpoint-debug__frame--dinosaur';
  return 'breakpoint-debug__frame--sm';
}

export function BreakpointDebugOverlay() {
  const labelRef = useRef<HTMLParagraphElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === 'undefined' ? BREAKPOINTS.lg : window.innerWidth,
  );
  const [labelPosition, setLabelPosition] = useState<Position | null>(() => {
    if (typeof window === 'undefined') return null;

    const savedPosition = window.localStorage.getItem(LABEL_STORAGE_KEY);
    if (!savedPosition) return null;

    try {
      const parsed = JSON.parse(savedPosition) as Position;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [dragOffset, setDragOffset] = useState<Position | null>(null);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!labelPosition) return;
    window.localStorage.setItem(LABEL_STORAGE_KEY, JSON.stringify(labelPosition));
  }, [labelPosition]);

  useEffect(() => {
    if (!dragOffset) return;

    const clampPosition = (x: number, y: number): Position => {
      const labelWidth = labelRef.current?.offsetWidth ?? 0;
      const labelHeight = labelRef.current?.offsetHeight ?? 0;
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - labelWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - labelHeight - margin);

      return {
        x: Math.max(margin, Math.min(maxX, x)),
        y: Math.max(margin, Math.min(maxY, y)),
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const nextX = event.clientX - dragOffset.x;
      const nextY = event.clientY - dragOffset.y;
      setLabelPosition(clampPosition(nextX, nextY));
    };

    const handlePointerUp = () => {
      setDragOffset(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragOffset]);

  const handleLabelPointerDown = (event: ReactPointerEvent<HTMLParagraphElement>) => {
    if (!labelRef.current) return;

    const labelRect = labelRef.current.getBoundingClientRect();
    const currentPosition: Position = {
      x: labelRect.left,
      y: labelRect.top,
    };

    setLabelPosition(currentPosition);
    setDragOffset({
      x: event.clientX - currentPosition.x,
      y: event.clientY - currentPosition.y,
    });
  };

  const thresholdInfo = getThresholdInfo(viewportWidth);

  if (!thresholdInfo) return null;

  return (
    <div className="breakpoint-debug" aria-hidden="true">
      <div className={`breakpoint-debug__frame ${getFrameClass(thresholdInfo.threshold)}`} />
      <p
        ref={labelRef}
        className={`breakpoint-debug__label ${dragOffset ? 'breakpoint-debug__label--dragging' : ''}`}
        onPointerDown={handleLabelPointerDown}
        style={
          labelPosition
            ? {
                left: `${labelPosition.x}px`,
                top: `${labelPosition.y}px`,
                transform: 'none',
              }
            : undefined
        }
      >
        {`Current: ${thresholdInfo.current.toUpperCase()} | Switch to ${thresholdInfo.next.toUpperCase()} below ${thresholdInfo.threshold}px`}
      </p>
    </div>
  );
}
