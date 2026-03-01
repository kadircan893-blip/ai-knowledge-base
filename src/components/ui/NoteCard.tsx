import { Trash2, Clock, Tag, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import Badge from './Badge';
import type { Note } from '../../types';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onSelect: (note: Note) => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  relevance?: number;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NoteCard({ note, onDelete, onSelect, selectMode, isSelected, onToggleSelect, relevance }: NoteCardProps) {
  const handleClick = () => {
    if (selectMode) {
      onToggleSelect?.(note.id);
    } else {
      onSelect(note);
    }
  };

  return (
    <div
      className={`glass-card-hover p-5 cursor-pointer group animate-fade-in flex flex-col transition-all ${
        isSelected ? 'ring-2 ring-purple-500/60 bg-purple-500/10' : ''
      }`}
      onClick={handleClick}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={note.category} />
          {relevance !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              relevance >= 75
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : relevance >= 40
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                : 'bg-white/5 text-white/35 border border-white/10'
            }`}>
              {relevance}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectMode ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(note.id); }}
              className="text-white/50 hover:text-purple-400 transition-colors p-1 -m-1"
            >
              {isSelected
                ? <CheckCircle2 className="w-5 h-5 text-purple-400" />
                : <Circle className="w-5 h-5" />
              }
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-white/30 hover:text-red-400 p-1.5 -m-1.5 rounded-lg hover:bg-red-500/10"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
        {note.title}
      </h4>

      {/* Content preview */}
      <p className="text-white/50 text-xs leading-relaxed line-clamp-3 flex-1">
        {note.content}
      </p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10"
            >
              <Tag className="w-2.5 h-2.5" />
              {t}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-white/25 self-center">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <span className="flex items-center gap-1 text-white/25 text-xs">
          <Clock className="w-3 h-3" />
          {timeAgo(note.updatedAt)}
        </span>
        {!selectMode && (
          <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all duration-200" />
        )}
      </div>
    </div>
  );
}
