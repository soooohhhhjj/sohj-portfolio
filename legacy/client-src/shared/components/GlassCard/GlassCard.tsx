import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  width?: string;
  corner?: string;
  shadow?: string;
};

export function GlassCard({
  width = '',
  corner = '',
  shadow = '',
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div {...rest} className={clsx('glass-card', width, corner, shadow, className)}>
      <div className="glass-card__border" />
      <div className="glass-card__overlay" />
      {children}
    </div>
  );
}
