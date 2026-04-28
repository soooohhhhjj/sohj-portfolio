import { useEffect } from 'react';

type LockedScrollSnapshot = {
  htmlOverflow: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
  rootOverflow: string;
};

let lockedOverlayCount = 0;
let lockedScrollSnapshot: LockedScrollSnapshot | null = null;

export function useLockedOverlayScroll(
  isOpen: boolean,
  onClose?: () => void,
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    if (lockedOverlayCount === 0) {
      lockedScrollSnapshot = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        bodyPaddingRight: body.style.paddingRight,
        rootOverflow: root?.style.overflow ?? '',
      };

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      if (root) {
        root.style.overflow = 'hidden';
      }

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    lockedOverlayCount += 1;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      lockedOverlayCount = Math.max(0, lockedOverlayCount - 1);

      if (lockedOverlayCount === 0 && lockedScrollSnapshot) {
        html.style.overflow = lockedScrollSnapshot.htmlOverflow;
        body.style.overflow = lockedScrollSnapshot.bodyOverflow;
        body.style.paddingRight = lockedScrollSnapshot.bodyPaddingRight;
        if (root) {
          root.style.overflow = lockedScrollSnapshot.rootOverflow;
        }
        lockedScrollSnapshot = null;
      }
    };
  }, [isOpen, onClose]);
}
