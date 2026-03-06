import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '../../../shared/constants/breakpoints';

export function useJourneyModalState(isOpen: boolean, onClose: () => void) {
  const [isLgViewport, setIsLgViewport] = useState(false);
  const [showNavigationChevrons, setShowNavigationChevrons] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const lockTargets = [html, body, root].filter((node): node is HTMLElement => Boolean(node));
    const previousStyles = new Map<HTMLElement, { overflow: string; overscrollBehavior: string }>();

    lockTargets.forEach((target) => {
      previousStyles.set(target, {
        overflow: target.style.overflow,
        overscrollBehavior: target.style.overscrollBehavior,
      });
      target.style.overflow = 'hidden';
      target.style.overscrollBehavior = 'none';
    });

    const scrollbarCompensation = window.innerWidth - document.documentElement.clientWidth;
    const originalBodyPaddingRight = body.style.paddingRight;
    if (scrollbarCompensation > 0) {
      body.style.paddingRight = `${scrollbarCompensation}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousStyles.forEach((styles, target) => {
        target.style.overflow = styles.overflow;
        target.style.overscrollBehavior = styles.overscrollBehavior;
      });
      body.style.paddingRight = originalBodyPaddingRight;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`);
    const syncViewport = () => setIsLgViewport(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => mediaQuery.removeEventListener('change', syncViewport);
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

  return {
    isLgViewport,
    showNavigationChevrons,
  };
}
