import type { HTMLAttributes, ReactNode } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: Padding;
  children: ReactNode;
}

const paddingMap: Record<Padding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export default function GlassCard({
  hover = false,
  padding = 'md',
  children,
  className = '',
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`${hover ? 'glass-card-hover' : 'glass-card'} ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
