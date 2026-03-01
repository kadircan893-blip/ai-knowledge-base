const styles: Record<string, string> = {
  React:      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  TypeScript: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  AI:         'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Design:     'bg-pink-500/20 text-pink-400 border-pink-500/30',
  JavaScript: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CSS:        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Backend:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  // generic accent variants
  purple:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cyan:    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  pink:    'bg-pink-500/20 text-pink-400 border-pink-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const fallback = 'bg-white/10 text-white/60 border-white/20';

interface BadgeProps {
  label: string;
  /** Defaults to label value for category auto-matching */
  variant?: string;
  size?: 'sm' | 'md';
}

export default function Badge({ label, variant, size = 'sm' }: BadgeProps) {
  const key = variant ?? label;
  const colorClass = styles[key] ?? fallback;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClass}`}>
      {label}
    </span>
  );
}
