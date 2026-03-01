import type { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="glass-card p-16 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/10">
        <Icon className="w-7 h-7 text-white/25" />
      </div>
      <h3 className="text-white/60 font-semibold text-base mb-1">{title}</h3>
      {description && (
        <p className="text-white/30 text-sm mb-5 max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
