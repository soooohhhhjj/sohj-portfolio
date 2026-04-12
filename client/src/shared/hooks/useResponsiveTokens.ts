import { useEffect } from 'react';
import { BREAKPOINTS, CONTENT_MAX_WIDTH } from '../constants/breakpoints';

export function useResponsiveTokens() {
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--bp-dinosaur', `${BREAKPOINTS.dinosaur}px`);
    root.style.setProperty('--bp-xxsm', `${BREAKPOINTS.xxsm}px`);
    root.style.setProperty('--bp-xsm', `${BREAKPOINTS.xsm}px`);
    root.style.setProperty('--bp-sm', `${BREAKPOINTS.sm}px`);
    root.style.setProperty('--bp-md', `${BREAKPOINTS.md}px`);
    root.style.setProperty('--bp-lg', `${BREAKPOINTS.lg}px`);
    root.style.setProperty('--bp-xl', `${BREAKPOINTS.xl}px`);

    root.style.setProperty('--cw-mobile', `${CONTENT_MAX_WIDTH.mobile}px`);
    root.style.setProperty('--cw-dinosaur', `${CONTENT_MAX_WIDTH.dinosaur}px`);
    root.style.setProperty('--cw-xxsm', `${CONTENT_MAX_WIDTH.xxsm}px`);
    root.style.setProperty('--cw-xsm', `${CONTENT_MAX_WIDTH.xsm}px`);
    root.style.setProperty('--cw-sm', `${CONTENT_MAX_WIDTH.sm}px`);
    root.style.setProperty('--cw-md', `${CONTENT_MAX_WIDTH.md}px`);
    root.style.setProperty('--cw-lg', `${CONTENT_MAX_WIDTH.lg}px`);
    root.style.setProperty('--cw-xl', `${CONTENT_MAX_WIDTH.xl}px`);
  }, []);
}
