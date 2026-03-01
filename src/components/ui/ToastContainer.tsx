import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastContext, type ToastItem, type ToastVariant } from '../../context/ToastContext';

const CONFIG: Record<ToastVariant, {
  icon: typeof CheckCircle2;
  border: string;
  iconClass: string;
  glow: string;
  bar: string;
}> = {
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-500/40',
    iconClass: 'text-emerald-400',
    glow: '0 8px 24px rgba(16,185,129,0.25)',
    bar: 'bg-emerald-400',
  },
  error: {
    icon: XCircle,
    border: 'border-red-500/40',
    iconClass: 'text-red-400',
    glow: '0 8px 24px rgba(239,68,68,0.25)',
    bar: 'bg-red-400',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-yellow-500/40',
    iconClass: 'text-yellow-400',
    glow: '0 8px 24px rgba(245,158,11,0.25)',
    bar: 'bg-yellow-400',
  },
  info: {
    icon: Info,
    border: 'border-purple-500/40',
    iconClass: 'text-purple-400',
    glow: '0 8px 24px rgba(139,92,246,0.25)',
    bar: 'bg-purple-400',
  },
};

function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIG[toast.variant];
  const Icon = cfg.icon;

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const exit = setTimeout(() => setVisible(false), toast.duration - 400);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(exit);
    };
  }, [toast.duration]);

  return (
    <div
      className={`
        relative overflow-hidden glass-card flex items-center gap-3 px-4 py-3
        min-w-[300px] max-w-sm transition-all duration-300 ease-out
        ${cfg.border}
        ${visible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-6 scale-95'}
      `}
      style={{ boxShadow: cfg.glow }}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.iconClass}`} />
      <p className="text-white text-sm flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={onRemove}
        className="text-white/30 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/10"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-60 toast-progress`}
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}
