import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { BREAKPOINTS, CONTENT_MAX_WIDTH } from '../../constants/breakpoints';

type ActiveBreakpoint = 'mobile' | 'dinosaur' | 'xxsm' | 'xsm' | 'sm' | 'md' | 'lg' | 'xl';

interface ThresholdInfo {
  current: ActiveBreakpoint;
  next: ActiveBreakpoint;
  threshold: number;
}

const VISIBILITY_STORAGE_KEY = 'sohj.breakpointDebug.visible';

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

function getContentFrameClass(threshold: number) {
  if (threshold === BREAKPOINTS.xl) return 'breakpoint-debug__content-frame--xl';
  if (threshold === BREAKPOINTS.lg) return 'breakpoint-debug__content-frame--lg';
  if (threshold === BREAKPOINTS.md) return 'breakpoint-debug__content-frame--md';
  if (threshold === BREAKPOINTS.sm) return 'breakpoint-debug__content-frame--sm';
  if (threshold === BREAKPOINTS.xsm) return 'breakpoint-debug__content-frame--xsm';
  if (threshold === BREAKPOINTS.xxsm) return 'breakpoint-debug__content-frame--xxsm';
  if (threshold === BREAKPOINTS.dinosaur) return 'breakpoint-debug__content-frame--dinosaur';
  return 'breakpoint-debug__content-frame--sm';
}

function getContentWidthClass(width: number) {
  if (width >= BREAKPOINTS.xl) return 'breakpoint-debug__content-width--xl';
  if (width >= BREAKPOINTS.lg) return 'breakpoint-debug__content-width--lg';
  if (width >= BREAKPOINTS.md) return 'breakpoint-debug__content-width--md';
  if (width >= BREAKPOINTS.sm) return 'breakpoint-debug__content-width--sm';
  if (width >= BREAKPOINTS.xsm) return 'breakpoint-debug__content-width--xsm';
  if (width >= BREAKPOINTS.xxsm) return 'breakpoint-debug__content-width--xxsm';
  if (width >= BREAKPOINTS.dinosaur) return 'breakpoint-debug__content-width--dinosaur';
  return 'breakpoint-debug__content-width--mobile';
}

function getContentMaxWidth(width: number) {
  if (width >= BREAKPOINTS.xl) return CONTENT_MAX_WIDTH.xl;
  if (width >= BREAKPOINTS.lg) return CONTENT_MAX_WIDTH.lg;
  if (width >= BREAKPOINTS.md) return CONTENT_MAX_WIDTH.md;
  if (width >= BREAKPOINTS.sm) return CONTENT_MAX_WIDTH.sm;
  if (width >= BREAKPOINTS.xsm) return CONTENT_MAX_WIDTH.xsm;
  if (width >= BREAKPOINTS.xxsm) return CONTENT_MAX_WIDTH.xxsm;
  if (width >= BREAKPOINTS.dinosaur) return CONTENT_MAX_WIDTH.dinosaur;
  return CONTENT_MAX_WIDTH.mobile;
}

function getLabelClass(threshold: number) {
  if (threshold === BREAKPOINTS.xl) return 'breakpoint-debug__label--xl';
  if (threshold === BREAKPOINTS.lg) return 'breakpoint-debug__label--lg';
  if (threshold === BREAKPOINTS.md) return 'breakpoint-debug__label--md';
  if (threshold === BREAKPOINTS.sm) return 'breakpoint-debug__label--sm';
  if (threshold === BREAKPOINTS.xsm) return 'breakpoint-debug__label--xsm';
  if (threshold === BREAKPOINTS.xxsm) return 'breakpoint-debug__label--xxsm';
  if (threshold === BREAKPOINTS.dinosaur) return 'breakpoint-debug__label--dinosaur';
  return 'breakpoint-debug__label--sm';
}

export function BreakpointDebugOverlay() {
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === 'undefined' ? BREAKPOINTS.lg : window.innerWidth,
  );
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem(VISIBILITY_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VISIBILITY_STORAGE_KEY, String(isVisible));
  }, [isVisible]);

  const thresholdInfo = getThresholdInfo(viewportWidth);
  const contentMaxWidth = getContentMaxWidth(viewportWidth);

  if (!thresholdInfo) return null;

  const nextBreakpointPx = thresholdInfo.next === 'mobile' ? 0 : BREAKPOINTS[thresholdInfo.next];

  return (
    <div className="breakpoint-debug" aria-hidden="true">
      {isVisible ? (
        <>
          <div className={`breakpoint-debug__frame ${getFrameClass(thresholdInfo.threshold)}`} />
          <div
            className={`breakpoint-debug__content-frame ${getContentFrameClass(thresholdInfo.threshold)} ${getContentWidthClass(viewportWidth)}`}
          />
          <p
            className={`breakpoint-debug__label ${getLabelClass(thresholdInfo.threshold)}`}
          >
            <span>{`Current: ${thresholdInfo.current.toUpperCase()} = ${Math.round(viewportWidth)}px`}</span>
            <span>{`Breakpoint = ${thresholdInfo.threshold}px`}</span>
            <span>{`Content = ${contentMaxWidth}px`}</span>
            <span>{`Next = ${nextBreakpointPx}px`}</span>
          </p>
        </>
      ) : null}

      <button
        type="button"
        className={`breakpoint-debug__toggle ${getLabelClass(thresholdInfo.threshold)}`}
        onClick={() => setIsVisible((prev) => !prev)}
        aria-label={isVisible ? 'Hide debug overlay' : 'Show debug overlay'}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
