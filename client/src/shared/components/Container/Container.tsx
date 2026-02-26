import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { BREAKPOINTS, CONTENT_MAX_WIDTH } from '../../constants/breakpoints';

interface SectionProps {
  children: ReactNode;
  className?: string;
}

interface SectionContentProps {
  children: ReactNode;
  className?: string;
}

const getContentMaxWidth = (width: number) => {
  if (width >= BREAKPOINTS.xl) return CONTENT_MAX_WIDTH.xl;
  if (width >= BREAKPOINTS.lg) return CONTENT_MAX_WIDTH.lg;
  if (width >= BREAKPOINTS.md) return CONTENT_MAX_WIDTH.md;
  if (width >= BREAKPOINTS.sm) return CONTENT_MAX_WIDTH.sm;
  if (width >= BREAKPOINTS.xsm) return CONTENT_MAX_WIDTH.xsm;
  if (width >= BREAKPOINTS.xxsm) return CONTENT_MAX_WIDTH.xxsm;
  if (width >= BREAKPOINTS.dinosaur) return CONTENT_MAX_WIDTH.dinosaur;
  return CONTENT_MAX_WIDTH.mobile;
};

function useViewportWidth() {
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === 'undefined' ? BREAKPOINTS.lg : window.innerWidth,
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return viewportWidth;
}

export function Section({ children, className }: SectionProps) {
  const combinedClassName = className ? `section-shell ${className}` : 'section-shell';
  return <section className={combinedClassName}>{children}</section>;
}

export function SectionContent({ children, className }: SectionContentProps) {
  const viewportWidth = useViewportWidth();
  const contentMaxWidth = getContentMaxWidth(viewportWidth);
  const style: CSSProperties = { maxWidth: `${contentMaxWidth}px` };
  const combinedClassName = className ? `section-content ${className}` : 'section-content';

  return (
    <div className={combinedClassName} style={style}>
      {children}
    </div>
  );
}
