import { X } from 'lucide-react';
import clsx from 'clsx';

type AnimatedCloseIconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
};

export function AnimatedCloseIcon({
  className,
  size,
  strokeWidth,
}: AnimatedCloseIconProps) {
  return (
    <X
      className={clsx(
        'transition-transform duration-300 group-hover:rotate-90 group-focus-visible:rotate-90',
        className,
      )}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
