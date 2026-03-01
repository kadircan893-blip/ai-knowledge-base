import { FileText, Clock, Tag, ArrowRight } from 'lucide-react';
import type { Note, NavPage } from '../../types';

interface RecentNotesProps {
  notes: Note[];
  onNavigate: (page: NavPage) => void;
}

const categoryColors: Record<string, string> = {
  React: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  TypeScript: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  AI: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Design: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  default: 'bg-white/10 text-white/60 border-white/20',
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentNotes({ notes, onNavigate }: RecentNotesProps) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-white font-semibold text-base">Recent Notes</h3>
        </div>
        <button
          onClick={() => onNavigate('notes')}
          className="flex items-center gap-1 text-purple-400 text-sm hover:text-purple-300 transition-colors font-medium"
        >
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">No notes yet. Create your first note!</p>
          </div>
        ) : (
          notes.slice(0, 5).map((note) => {
            const colorClass = categoryColors[note.category] ?? categoryColors.default;
            return (
              <div
                key={note.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10">
                  <FileText className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-white text-sm font-medium truncate group-hover:text-purple-300 transition-colors">
                      {note.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${colorClass}`}>
                      {note.category}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-1 line-clamp-1">{note.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-white/30 text-xs">
                      <Clock className="w-3 h-3" />
                      {timeAgo(note.updatedAt)}
                    </span>
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-white/30 text-xs">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
