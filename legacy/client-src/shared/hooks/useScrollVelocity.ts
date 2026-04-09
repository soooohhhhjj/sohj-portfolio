import { useEffect } from 'react';
import Lenis from 'lenis';
import { setScrollVelocity } from '../utils/scrollState';

const MAX_SCROLL_VELOCITY = 30;

export function useScrollVelocity(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      setScrollVelocity(0);
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });

    let lastScrollY = window.scrollY;
    let frameId = 0;

    const tick = (time: number) => {
      lenis.raf(time);

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      const clampedDelta = Math.max(-MAX_SCROLL_VELOCITY, Math.min(MAX_SCROLL_VELOCITY, delta));
      setScrollVelocity(clampedDelta);

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.destroy();
      setScrollVelocity(0);
    };
  }, [enabled]);
}
