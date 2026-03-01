import { useState } from 'react';
import {
  User, Palette, Database, Info, Zap, CheckCircle2,
  Trash2, AlertTriangle, RotateCcw, Cpu, X,
} from 'lucide-react';
import {
  loadQueryCount, clearQueryCount, getStorageKB,
  loadAiModel, saveAiModel,
} from '../utils/noteStorage';

interface SettingsPageProps {
  noteCount: number;
  onReset: () => void;
}

const AI_MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    desc: 'Best quality, great for complex questions',
    badge: 'Recommended',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    desc: 'Fastest responses, lower resource usage',
    badge: 'Fast',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    desc: 'Great for long documents & mixed tasks',
    badge: 'Long Context',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
  },
];

const TECH_STACK = [
  { label: 'React 19',       color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { label: 'TypeScript',     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { label: 'Vite 7',         color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { label: 'TailwindCSS v3', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { label: 'Express 5',      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { label: 'SQLite',         color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { label: 'Groq AI',        color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { label: 'react-markdown', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
];

function SectionCard({ title, icon: Icon, gradient, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: gradient }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage({ noteCount, onReset }: SettingsPageProps) {
  const [selectedModel, setSelectedModel] = useState(loadAiModel);
  const [modelSaved,    setModelSaved]    = useState(false);
  const [resetState, setResetState]       = useState<'idle' | 'confirm' | 'done'>('idle');
  const [queriesCleared, setQueriesCleared] = useState(false);

  const queryCount = loadQueryCount();
  const storageKB  = getStorageKB();

  const handleSaveModel = (id: string) => {
    setSelectedModel(id);
    saveAiModel(id);
    setModelSaved(true);
    setTimeout(() => setModelSaved(false), 2000);
  };

  const handleReset = () => {
    onReset();
    setResetState('done');
    setTimeout(() => setResetState('idle'), 3000);
  };

  const handleClearQueries = () => {
    clearQueryCount();
    setQueriesCleared(true);
    setTimeout(() => setQueriesCleared(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Profile banner */}
      <div className="glass-card p-6 animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.08))',
          border: '1px solid rgba(139,92,246,0.25)',
        }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">AI Knowledge Base</h3>
            <p className="text-white/50 text-sm">Personal Edition · v1.0.0</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white font-bold text-2xl">{noteCount}</p>
            <p className="text-white/40 text-xs">notes</p>
          </div>
        </div>
      </div>

      {/* AI Model Selection */}
      <SectionCard title="AI Model" icon={Cpu} gradient="linear-gradient(135deg, #8B5CF6, #6D28D9)">
        <div className="space-y-2.5">
          {AI_MODELS.map((m) => {
            const isActive = selectedModel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSaveModel(m.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  isActive
                    ? 'bg-white/8 border-purple-500/40'
                    : 'bg-white/3 border-white/10 hover:bg-white/6 hover:border-white/20'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: m.gradient }}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{m.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{m.badge}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{m.desc}</p>
                </div>
                {isActive && <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        {modelSaved && (
          <p className="flex items-center gap-1.5 text-emerald-400 text-xs mt-3">
            <CheckCircle2 className="w-3.5 h-3.5" /> Model preference saved
          </p>
        )}
        <p className="text-white/25 text-xs mt-3">
          Requires{' '}
          <code className="bg-white/10 px-1 rounded text-cyan-300">GROQ_API_KEY</code>{' '}
          in <code className="bg-white/10 px-1 rounded text-cyan-300">.env</code>
          {' '}— free at{' '}
          <span className="text-cyan-400/60">console.groq.com</span>
        </p>
      </SectionCard>

      {/* Appearance */}
      <SectionCard title="Appearance" icon={Palette} gradient="linear-gradient(135deg, #EC4899, #DB2777)">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-white text-sm font-medium">Dark Glassmorphism</p>
            <p className="text-white/40 text-xs mt-0.5">Neon glass theme with gradient background</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Active</span>
          </div>
        </div>
        <p className="text-white/25 text-xs mt-3">Additional themes planned for a future update.</p>
      </SectionCard>

      {/* Data & Storage */}
      <SectionCard title="Data & Storage" icon={Database} gradient="linear-gradient(135deg, #10B981, #059669)">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Notes',      value: noteCount },
            { label: 'AI Queries', value: queriesCleared ? 0 : queryCount },
            { label: 'Storage',    value: `${storageKB} KB` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white font-bold text-xl">{value}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Storage bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/40 text-xs">localStorage usage</span>
            <span className="text-white/40 text-xs">{storageKB} / ~5,000 KB</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((storageKB / 5000) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #10B981, #06B6D4)',
              }} />
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Clear query count */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-white text-sm font-medium">AI Query History</p>
              <p className="text-white/40 text-xs">Reset the query counter to zero</p>
            </div>
            <button
              onClick={handleClearQueries}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 border border-white/15 hover:bg-white/10 hover:text-white transition-all"
            >
              {queriesCleared
                ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cleared</>
                : <><X className="w-3.5 h-3.5" /> Clear</>
              }
            </button>
          </div>

          {/* Reset notes */}
          <div className={`p-3 rounded-xl border transition-all ${
            resetState === 'confirm' ? 'bg-red-500/10 border-red-500/30'
            : resetState === 'done'  ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-white/5 border-white/10'
          }`}>
            {resetState === 'idle' && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Reset All Notes</p>
                  <p className="text-white/40 text-xs">Restore to 4 seed notes</p>
                </div>
                <button onClick={() => setResetState('confirm')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            )}
            {resetState === 'confirm' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    This will delete all {noteCount} notes and restore defaults. Continue?
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Yes, reset
                  </button>
                  <button onClick={() => setResetState('idle')}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-white/50 border border-white/15 hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {resetState === 'done' && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-sm font-medium">Notes restored to defaults!</p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard title="About" icon={Info} gradient="linear-gradient(135deg, #06B6D4, #0891B2)">
        <div className="space-y-4">
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'License', value: 'MIT' },
            { label: 'Platform', value: 'Web (React SPA + Express API)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-white/50 text-sm">{label}</span>
              <span className="text-white text-sm font-medium">{value}</span>
            </div>
          ))}

          <div className="h-px bg-white/10" />

          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {TECH_STACK.map(({ label, color }) => (
                <span key={label} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Keyboard Shortcuts</p>
            <div className="space-y-1.5 text-xs">
              {[
                ['Ctrl+K', 'Quick search'],
                ['Ctrl+/', 'Show shortcuts'],
                ['Ctrl+N', 'Go to Notes'],
                ['Ctrl+Enter', 'Save (edit mode)'],
                ['Esc', 'Close panel / cancel'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-white/50">
                  <span>{v}</span>
                  <kbd className="px-2 py-0.5 rounded-md text-xs font-mono text-white/60"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {k}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <p className="text-white/20 text-xs text-center pb-2">
        AI Knowledge Base · Built with React + TypeScript + TailwindCSS + Groq AI
      </p>
    </div>
  );
}
