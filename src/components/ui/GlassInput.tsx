import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';

interface BaseField {
  label?: string;
  error?: string;
}

// ── Input ──────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseField {
  icon?: LucideIcon;
}

export function Input({ label, error, icon: Icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="text-white/60 text-sm mb-1.5 block">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        )}
        <input
          className={`glass-input ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500/50 focus:border-red-500/70' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseField {}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <label className="text-white/60 text-sm mb-1.5 block">{label}</label>}
      <textarea
        className={`glass-input resize-none leading-relaxed ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseField {
  children: ReactNode;
}

export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="text-white/60 text-sm mb-1.5 block">{label}</label>}
      <select
        className={`glass-input ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
