import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import type { NavPage } from '../../types';

interface AIInsightCardProps {
  onNavigate: (page: NavPage) => void;
  noteCount: number;
  topCategory?: string;
}

export default function AIInsightCard({ onNavigate, noteCount, topCategory }: AIInsightCardProps) {
  const insight = noteCount === 0
    ? "Start adding notes and I'll analyze your knowledge patterns."
    : topCategory
      ? `Your recent notes are focused on ${topCategory}. You're building strong expertise in this area!`
      : "Keep adding notes to unlock personalized AI insights about your knowledge base.";

  return (
    <div
      className="glass-card p-6 animate-fade-in relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(6,182,212,0.1) 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-15"
        style={{ background: 'radial-gradient(circle, #06B6D4, transparent)' }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">AI Insight</h3>
              <p className="text-purple-300/70 text-xs">Powered by your notes</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Live</span>
          </div>
        </div>

        <p className="text-white/80 text-sm leading-relaxed mb-4">{insight}</p>

        {noteCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {noteCount} notes analyzed
            </span>
            {topCategory && (
              <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Top: {topCategory}
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => onNavigate('chat')}
          className="flex items-center gap-2 text-sm font-medium text-purple-300 hover:text-white transition-colors group"
        >
          <span>Ask AI a question</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
