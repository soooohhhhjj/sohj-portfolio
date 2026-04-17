import { createPortal } from 'react-dom';
import { motion, type Easing } from 'framer-motion';
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
}: OverlayModalProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useLockedOverlayScroll(isOpen, bodyRef, contentRef, onClose);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <motion.div
      key={rootKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={rootClassName}
      data-lenis-prevent=""
      data-lenis-prevent-wheel=""
      data-lenis-prevent-touch=""
      onClick={onClose}
    >
      <div className={backdropClassName} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease }}
        className={dialogClassName}
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
    </motion.div>,
    document.body,
  );
}
