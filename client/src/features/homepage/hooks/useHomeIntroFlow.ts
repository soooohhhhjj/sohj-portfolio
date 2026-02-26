import { useEffect, useState } from 'react';

export function useHomeIntroFlow() {
  const [hasWelcomeFinished, setHasWelcomeFinished] = useState(false);
  const [hasHeroFinished, setHasHeroFinished] = useState(false);
  const hasIntroFinished = hasWelcomeFinished && hasHeroFinished;

  const lockScroll = () => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  };

  const unlockScroll = () => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    lockScroll();
  }, []);

  useEffect(() => {
    if (hasIntroFinished) {
      unlockScroll();
      return;
    }

    lockScroll();
  }, [hasIntroFinished]);

  useEffect(() => {
    const preventScroll = (event: Event) => {
      if (
        event instanceof KeyboardEvent &&
        !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)
      ) {
        return;
      }

      event.preventDefault();
    };

    if (!hasIntroFinished) {
      window.addEventListener('wheel', preventScroll, { passive: false });
      window.addEventListener('touchmove', preventScroll, { passive: false });
      window.addEventListener('keydown', preventScroll, { passive: false });
    }

    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventScroll);
    };
  }, [hasIntroFinished]);

  useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, []);

  return {
    hasWelcomeFinished,
    setHasWelcomeFinished,
    hasHeroFinished,
    setHasHeroFinished,
    hasIntroFinished,
  };
}
