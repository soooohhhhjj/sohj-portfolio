import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Easing, type TargetAndTransition } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useLockedOverlayScroll } from '../../hooks/useLockedOverlayScroll';

type OverlayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  rootClassName: string;
  backdropClassName: string;
  dialogClassName: string;
  bodyClassName: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  titleId?: string;
  rootKey?: string;
  ease?: Easing;
  dialogInitial?: TargetAndTransition;
  dialogAnimate?: TargetAndTransition;
  dialogExit?: TargetAndTransition;
  dialogDuration?: number;
  dialogStyle?: React.CSSProperties;
};

const defaultEase: Easing = [0.12, 0.7, 0.63, 0.9];

export function OverlayModal({
  isOpen,
  onClose,
  rootClassName,
  backdropClassName,
  dialogClassName,
  bodyClassName,
  header,
  footer,
  children,
  titleId,
  rootKey = 'overlay-modal',
  ease = defaultEase,
  dialogInitial = { y: '-100vh' },
  dialogAnimate = { y: 0 },
  dialogExit,
  dialogDuration = 0.22,
  dialogStyle,
}: OverlayModalProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useLockedOverlayScroll(isOpen, bodyRef, contentRef, onClose);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      key={rootKey}
      className={rootClassName}
      data-lenis-prevent=""
      data-lenis-prevent-wheel=""
      data-lenis-prevent-touch=""
      onClick={onClose}
    >
      <AnimatePresence>
        {isOpen ? (
          <>
            <div className={backdropClassName} />
            <motion.div
              initial={dialogInitial}
              animate={dialogAnimate}
              exit={dialogExit ?? dialogInitial}
              transition={{ duration: dialogDuration, ease }}
              className={dialogClassName}
              style={dialogStyle}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
            >
              {header}
              <div ref={bodyRef} className={bodyClassName}>
                <div ref={contentRef}>
                  {children}
                </div>
              </div>
              {footer}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
