import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient,
  glowColor,
}: StatsCardProps) {
  const ChangeIcon = changeType === 'increase'
    ? TrendingUp
    : changeType === 'decrease'
      ? TrendingDown
      : Minus;

  const changeColor = changeType === 'increase'
    ? 'text-emerald-400'
    : changeType === 'decrease'
      ? 'text-red-400'
      : 'text-white/40';

  return (
    <div
      className="glass-card-hover p-6 cursor-default animate-fade-in"
      style={{ '--glow': glowColor } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient, boxShadow: `0 4px 15px ${glowColor}` }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${changeColor}`}>
            <ChangeIcon className="w-3 h-3" />
            <span>{change}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-white/50 text-sm font-medium mb-1">{title}</p>
        <p className="text-white font-bold text-3xl">{value}</p>
      </div>
    </div>
  );
}
