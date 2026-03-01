import { FolderOpen, FileText, ArrowRight, Hash, BookOpen, Clock } from 'lucide-react';
import type { Note, NavPage } from '../types';

interface CategoriesPageProps {
  notes: Note[];
  onNavigate: (page: NavPage) => void;
  onNavigateToCategory: (category: string) => void;
}

const categoryStyles: Record<string, { gradient: string; glow: string; text: string; ring: string }> = {
  React:      { gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)', glow: 'rgba(6,182,212,0.25)',   text: 'text-cyan-400',    ring: 'ring-cyan-500/30' },
  TypeScript: { gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', glow: 'rgba(59,130,246,0.25)',  text: 'text-blue-400',    ring: 'ring-blue-500/30' },
  AI:         { gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', glow: 'rgba(139,92,246,0.25)',  text: 'text-purple-400',  ring: 'ring-purple-500/30' },
  Design:     { gradient: 'linear-gradient(135deg, #EC4899, #DB2777)', glow: 'rgba(236,72,153,0.25)',  text: 'text-pink-400',    ring: 'ring-pink-500/30' },
  JavaScript: { gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', glow: 'rgba(245,158,11,0.25)',  text: 'text-yellow-400',  ring: 'ring-yellow-500/30' },
  CSS:        { gradient: 'linear-gradient(135deg, #10B981, #059669)', glow: 'rgba(16,185,129,0.25)',  text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  Backend:    { gradient: 'linear-gradient(135deg, #F97316, #EA580C)', glow: 'rgba(249,115,22,0.25)',  text: 'text-orange-400',  ring: 'ring-orange-500/30' },
  Other:      { gradient: 'linear-gradient(135deg, #6B7280, #4B5563)', glow: 'rgba(107,114,128,0.25)', text: 'text-gray-400',    ring: 'ring-gray-500/30' },
};
const defaultStyle = categoryStyles.Other;

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CategoriesPage({ notes, onNavigateToCategory }: CategoriesPageProps) {
  // Build per-category stats
  interface CatStat {
    name: string;
    count: number;
    words: number;
    tags: string[];
    lastUpdated: Date;
    notes: Note[];
  }

  const statsMap = new Map<string, CatStat>();
  for (const note of notes) {
    const existing = statsMap.get(note.category);
    const wordCount = note.content.split(/\s+/).filter(Boolean).length;
    if (existing) {
      existing.count++;
      existing.words += wordCount;
      existing.tags   = [...new Set([...existing.tags, ...note.tags])];
      if (note.updatedAt > existing.lastUpdated) existing.lastUpdated = note.updatedAt;
      existing.notes.push(note);
    } else {
      statsMap.set(note.category, {
        name: note.category,
        count: 1,
        words: wordCount,
        tags: [...note.tags],
        lastUpdated: note.updatedAt,
        notes: [note],
      });
    }
  }

  const categoryList = [...statsMap.values()].sort((a, b) => b.count - a.count);
  const maxCount     = categoryList[0]?.count ?? 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Summary bar */}
      <div className="glass-card px-6 py-4 flex flex-wrap items-center gap-6">
        <div>
          <p className="text-white font-semibold text-2xl">{categoryList.length}</p>
          <p className="text-white/40 text-xs">categories</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div>
          <p className="text-white font-semibold text-2xl">{notes.length}</p>
          <p className="text-white/40 text-xs">total notes</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div>
          <p className="text-white font-semibold text-2xl">
            {notes.reduce((s, n) => s + n.content.split(/\s+/).filter(Boolean).length, 0).toLocaleString()}
          </p>
          <p className="text-white/40 text-xs">total words</p>
        </div>
        <p className="ml-auto text-white/30 text-sm hidden sm:block">Click a card to browse its notes →</p>
      </div>

      {categoryList.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FolderOpen className="w-14 h-14 text-white/15 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No categories yet — add some notes to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {categoryList.map((cat) => {
            const style     = categoryStyles[cat.name] ?? defaultStyle;
            const pct       = Math.round((cat.count / maxCount) * 100);
            const avgWords  = Math.round(cat.words / cat.count);
            const recentNote = cat.notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

            return (
              <button
                key={cat.name}
                onClick={() => onNavigateToCategory(cat.name)}
                className="glass-card-hover p-6 cursor-pointer group animate-fade-in text-left w-full"
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: style.gradient, boxShadow: `0 4px 20px ${style.glow}` }}
                  >
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>

                  <div className="text-right">
                    <p className={`text-3xl font-bold ${style.text}`}>{cat.count}</p>
                    <p className="text-white/30 text-xs">note{cat.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold text-lg mb-3">{cat.name}</h3>

                {/* Progress bar */}
                <div className="h-1 rounded-full bg-white/8 mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: style.gradient }}
                  />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <BookOpen className="w-3 h-3" />
                    <span>{cat.words.toLocaleString()} words</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <FileText className="w-3 h-3" />
                    <span>~{avgWords} avg</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    <span>{relativeTime(cat.lastUpdated)}</span>
                  </div>
                </div>

                {/* Latest note */}
                {recentNote && (
                  <div className="flex items-center gap-2 text-xs text-white/35 mb-3 bg-white/5 rounded-lg px-3 py-2">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{recentNote.title}</span>
                  </div>
                )}

                {/* Tags */}
                {cat.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {cat.tags.slice(0, 5).map((t) => (
                      <span key={t}
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">
                        <Hash className="w-2.5 h-2.5" /> {t}
                      </span>
                    ))}
                    {cat.tags.length > 5 && (
                      <span className="text-xs text-white/20 px-2 py-0.5">+{cat.tags.length - 5}</span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className={`flex items-center gap-1.5 text-xs font-medium ${style.text} opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1`}>
                  <span>Browse {cat.count} note{cat.count !== 1 ? 's' : ''}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
