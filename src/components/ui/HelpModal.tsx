import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Ctrl', 'K'], label: 'Quick search', desc: 'Search across all notes instantly' },
  { keys: ['Ctrl', '/'], label: 'Help', desc: 'Show this keyboard shortcuts panel' },
  { keys: ['Ctrl', 'Enter'], label: 'Save note', desc: 'Save while editing a note (detail panel)' },
  { keys: ['Enter'], label: 'Send message', desc: 'Send a message in AI Chat' },
  { keys: ['Shift', 'Enter'], label: 'New line', desc: 'Insert a newline in AI Chat' },
  { keys: ['Esc'], label: 'Close / Cancel', desc: 'Close a panel or cancel editing' },
];

export default function HelpModal({ open, onClose }: HelpModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md animate-fade-in"
        style={{
          background: 'linear-gradient(180deg, rgba(30,27,75,0.98) 0%, rgba(15,23,42,0.98) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '1rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
              <Keyboard className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-white font-semibold text-sm">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 space-y-2">
          {shortcuts.map(({ keys, label, desc }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
              <div className="flex items-center gap-1 flex-shrink-0">
                {keys.map((k, i) => (
                  <span key={i}>
                    <kbd className="px-2 py-0.5 rounded-md text-xs font-mono font-medium text-white/70"
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      {k}
                    </kbd>
                    {i < keys.length - 1 && <span className="text-white/30 text-xs mx-0.5">+</span>}
                  </span>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium">{label}</div>
                <div className="text-white/35 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-white/5 text-center">
          <span className="text-white/20 text-xs">Press ESC to close</span>
        </div>
      </div>
    </>
  );
}
