import { useEffect, useRef, useState } from 'react';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import Badge from './Badge';
import type { Note, NavPage } from '../../types';

interface QuickSearchModalProps {
  open: boolean;
  notes: Note[];
  onClose: () => void;
  onNavigate: (page: NavPage) => void;
}

export default function QuickSearchModal({ open, notes, onClose, onNavigate }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = query.trim().length < 1 ? [] : notes.filter((n) => {
    const q = query.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-[70] w-full max-w-xl animate-fade-in"
        style={{
          background: 'linear-gradient(180deg, rgba(30,27,75,0.98) 0%, rgba(15,23,42,0.98) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '1rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
          />
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.map((note) => (
              <button
                key={note.id}
                onClick={() => { onNavigate('notes'); onClose(); }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">{note.title}</span>
                    <Badge label={note.category} size="sm" />
                  </div>
                  <p className="text-white/40 text-xs truncate mt-0.5">{note.content}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="px-4 py-8 text-center text-white/30 text-sm">
            No notes matching "{query}"
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-white/20 text-xs">
            Start typing to search across {notes.length} notes…
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3">
          <span className="text-white/20 text-xs">↵ go to Notes</span>
          <span className="text-white/20 text-xs">ESC close</span>
        </div>
      </div>
    </>
  );
}
