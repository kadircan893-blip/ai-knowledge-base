import { useState } from 'react';
import { FileText, FolderOpen, BookOpen, MessageSquare, Plus, Zap } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import RecentNotes from '../components/dashboard/RecentNotes';
import AIInsightCard from '../components/dashboard/AIInsightCard';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../hooks/useToast';
import { loadQueryCount } from '../utils/noteStorage';
import type { Note, NavPage } from '../types';

const CATEGORIES = ['React', 'TypeScript', 'AI', 'Design', 'JavaScript', 'CSS', 'Backend', 'Other'];

interface DashboardProps {
  notes: Note[];
  onNavigate: (page: NavPage) => void;
  onAddNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
}

function getLastUpdated(notes: Note[]): string {
  if (notes.length === 0) return 'Never';
  const latest = notes.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
  const diff = Math.floor((Date.now() - latest.updatedAt.getTime()) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard({ notes, onNavigate, onAddNote }: DashboardProps) {
  const { categories, topCategory, totalWords, addedThisWeek } = useCategories(notes);
  const queryCount = loadQueryCount();
  const toast      = useToast();

  // Quick Add state
  const [qaTitle,    setQaTitle]    = useState('');
  const [qaCategory, setQaCategory] = useState('React');
  const [qaContent,  setQaContent]  = useState('');
  const [qaSaving,   setQaSaving]   = useState(false);

  const handleQuickAdd = async () => {
    if (!qaTitle.trim() || !qaContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setQaSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    onAddNote({ title: qaTitle.trim(), content: qaContent.trim(), category: qaCategory, tags: [] });
    toast.success(`"${qaTitle.trim()}" added!`);
    setQaTitle('');
    setQaContent('');
    setQaCategory('React');
    setQaSaving(false);
  };

  const stats = [
    {
      title: 'Total Notes',
      value: notes.length,
      change: addedThisWeek > 0 ? `+${addedThisWeek} this week` : undefined,
      changeType: 'increase' as const,
      icon: FileText,
      gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      glowColor: 'rgba(139, 92, 246, 0.4)',
    },
    {
      title: 'Categories',
      value: categories.length,
      change: categories.length > 0 ? `${categories.length} active` : undefined,
      changeType: 'neutral' as const,
      icon: FolderOpen,
      gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)',
      glowColor: 'rgba(6, 182, 212, 0.4)',
    },
    {
      title: 'Words Written',
      value: totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords,
      change: getLastUpdated(notes),
      changeType: 'neutral' as const,
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      glowColor: 'rgba(16, 185, 129, 0.4)',
    },
    {
      title: 'AI Queries',
      value: queryCount,
      change: queryCount > 0 ? 'All time' : 'None yet',
      changeType: 'neutral' as const,
      icon: MessageSquare,
      gradient: 'linear-gradient(135deg, #EC4899, #DB2777)',
      glowColor: 'rgba(236, 72, 153, 0.4)',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Welcome banner */}
      <div className="glass-card p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.08) 100%)',
          border: '1px solid rgba(139,92,246,0.25)',
        }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)', transform: 'translate(30%,-30%)' }} />

        <h2 className="text-2xl font-bold text-white mb-1">
          {getGreeting()}!{' '}
          <span className="gradient-text">Let's build your knowledge.</span>
        </h2>
        <p className="text-white/50 text-sm">
          You have{' '}
          <strong className="text-white">{notes.length} note{notes.length !== 1 ? 's' : ''}</strong>{' '}
          across{' '}
          <strong className="text-white">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</strong>{' '}
          — <strong className="text-white">{totalWords.toLocaleString()} words</strong> of knowledge.
        </p>

        {/* Category mini progress bars */}
        {categories.length > 0 && notes.length > 0 && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {categories.slice(0, 5).map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="h-1 rounded-full bg-white/10 overflow-hidden" style={{ width: `${Math.max(20, cat.count * 10)}px` }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${(cat.count / notes.length) * 100}%`,
                      background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                    }} />
                </div>
                <span className="text-white/35 text-xs">{cat.name} ({cat.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => <StatsCard key={s.title} {...s} />)}
      </div>

      {/* Recent notes + AI insight + Quick Add */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentNotes notes={notes} onNavigate={onNavigate} />
        </div>

        <div className="flex flex-col gap-4">
          <AIInsightCard onNavigate={onNavigate} noteCount={notes.length} topCategory={topCategory} />

          {/* ── Quick Add widget ─────────────────────── */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm">Quick Add</h3>
            </div>

            {/* Title */}
            <input
              value={qaTitle}
              onChange={(e) => setQaTitle(e.target.value)}
              placeholder="Note title…"
              className="glass-input text-sm py-2 w-full"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleQuickAdd(); }}
            />

            {/* Category */}
            <select
              value={qaCategory}
              onChange={(e) => setQaCategory(e.target.value)}
              className="glass-input text-sm py-2 w-full cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>

            {/* Content */}
            <textarea
              value={qaContent}
              onChange={(e) => setQaContent(e.target.value)}
              placeholder="Write your note…"
              rows={4}
              className="glass-input text-sm py-2 resize-none w-full"
            />

            <button
              onClick={handleQuickAdd}
              disabled={!qaTitle.trim() || !qaContent.trim() || qaSaving}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Plus className="w-4 h-4" />
              {qaSaving ? 'Saving…' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
