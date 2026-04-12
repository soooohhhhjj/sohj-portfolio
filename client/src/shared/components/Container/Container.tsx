import { useEffect, useState, type ReactNode } from 'react';
import { BREAKPOINTS } from '../../constants/breakpoints';

interface SectionProps {
  children: ReactNode;
  className?: string;
}

interface SectionContentProps {
  children: ReactNode;
  className?: string;
}

type ContentWidthKey = 'mobile' | 'dinosaur' | 'xxsm' | 'xsm' | 'sm' | 'md' | 'lg' | 'xl';

function getContentWidthKey(width: number): ContentWidthKey {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  if (width >= BREAKPOINTS.xsm) return 'xsm';
  if (width >= BREAKPOINTS.xxsm) return 'xxsm';
  if (width >= BREAKPOINTS.dinosaur) return 'dinosaur';
  return 'mobile';
}

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
  const contentWidthKey = getContentWidthKey(viewportWidth);
  const combinedClassName = className
    ? `section-content responsiveness content-width content-width--${contentWidthKey} ${className}`
    : `section-content responsiveness content-width content-width--${contentWidthKey}`;

  return <div className={combinedClassName}>{children}</div>;
}
