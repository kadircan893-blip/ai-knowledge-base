import { useEffect, useRef, useState } from 'react';
import { X, Tag, Clock, Calendar, FolderOpen, Trash2, FileText, Pencil, Save, XCircle, Download, Sparkles, Loader2 } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import Badge from './Badge';
import Button from './Button';
import MarkdownContent from './MarkdownContent';
import { Input, Select } from './GlassInput';
import { exportNoteAsJSON, exportNoteAsMarkdown, exportNoteAsTxt } from '../../utils/exportNotes';
import type { Note } from '../../types';

const CATEGORIES = ['React', 'TypeScript', 'AI', 'Design', 'JavaScript', 'CSS', 'Backend', 'Other'];

interface NoteDetailPanelProps {
  note: Note | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  notes?: Note[];
  onNavigateToNote?: (note: Note) => void;
}

export default function NoteDetailPanel({ note, onClose, onDelete, onUpdate, notes, onNavigateToNote }: NoteDetailPanelProps) {
  const isOpen = note !== null;

  const [isEditing, setIsEditing]       = useState(false);
  const [editTitle, setEditTitle]       = useState('');
  const [editContent, setEditContent]   = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags]         = useState<string[]>([]);
  const [tagInput, setTagInput]         = useState('');
  const [saving, setSaving]             = useState(false);
  const [showExport, setShowExport]     = useState(false);
  const exportRef                       = useRef<HTMLDivElement>(null);

  // AI features
  const [summary, setSummary]           = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setTagInput('');
    setShowExport(false);
    setSummary(null);
    setSuggestedTags([]);
  }, [note?.id]);

  const handleSummarize = async () => {
    if (!note || isSummarizing) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note.content }),
      });
      const data = await res.json() as { summary?: string; error?: string };
      setSummary(data.summary ?? data.error ?? 'Failed to summarize.');
    } catch {
      setSummary('Could not reach server.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSuggestTags = async () => {
    if (isSuggestingTags) return;
    setIsSuggestingTags(true);
    setSuggestedTags([]);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const data = await res.json() as { tags?: string[]; error?: string };
      const newTags = (data.tags ?? []).filter((t) => !editTags.includes(t));
      setSuggestedTags(newTags);
    } catch {
      setSuggestedTags([]);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    if (showExport) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExport]);

  const enterEdit = () => {
    if (!note) return;
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditTags([...note.tags]);
    setIsEditing(true);
  };

  const cancelEdit = () => { setIsEditing(false); setTagInput(''); };

  const handleSave = async () => {
    if (!note || !editTitle.trim() || !editContent.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 280));
    onUpdate(note.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      category: editCategory,
      tags: editTags,
    });
    setIsEditing(false);
    setSaving(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !editTags.includes(t)) setEditTags((p) => [...p, t]);
    setTagInput('');
  };

  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { isEditing ? cancelEdit() : onClose(); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && isEditing) handleSave();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isEditing, onClose]); // eslint-disable-line

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { isEditing ? cancelEdit() : onClose(); }}
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isOpen ? 'bg-black/50 backdrop-blur-sm pointer-events-auto' : 'bg-transparent pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-[440px] z-50 flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(30,27,75,0.98) 0%, rgba(15,23,42,0.98) 100%)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(139,92,246,0.2)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        {note && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                {isEditing ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium animate-pulse">
                    Editing
                  </span>
                ) : (
                  <Badge label={note.category} size="md" />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" icon={XCircle} onClick={cancelEdit}>Cancel</Button>
                    <Button variant="primary" size="sm" icon={Save} loading={saving} onClick={handleSave}>Save</Button>
                  </>
                ) : (
                  <>
                    {/* Export dropdown */}
                    <div className="relative" ref={exportRef}>
                      <button
                        onClick={() => setShowExport((v) => !v)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        title="Export note"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {showExport && (
                        <div
                          className="absolute right-0 top-10 w-40 rounded-xl overflow-hidden z-10 animate-fade-in"
                          style={{
                            background: 'rgba(15,23,42,0.98)',
                            border: '1px solid rgba(139,92,246,0.25)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          }}
                        >
                          {[
                            { label: 'JSON', action: () => exportNoteAsJSON(note) },
                            { label: 'Markdown', action: () => exportNoteAsMarkdown(note) },
                            { label: 'Plain Text', action: () => exportNoteAsTxt(note) },
                          ].map(({ label, action }) => (
                            <button
                              key={label}
                              onClick={() => { action(); setShowExport(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button variant="secondary" size="sm" icon={Pencil} onClick={enterEdit}>Edit</Button>
                    <Button variant="danger" size="sm" icon={Trash2}
                      onClick={() => { onDelete(note.id); onClose(); }}>Delete</Button>
                  </>
                )}
                <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isEditing ? (
                /* ── EDIT MODE ─────────────────────────── */
                <div className="space-y-4 animate-fade-in">
                  <Input label="Title" value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title..." />

                  <Select label="Category" value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">{c}</option>
                    ))}
                  </Select>

                  {/* Tags edit */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-white/60 text-sm">Tags</label>
                      <button
                        onClick={handleSuggestTags}
                        disabled={isSuggestingTags || !editContent.trim()}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all disabled:opacity-40 bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      >
                        {isSuggestingTags
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Suggesting…</>
                          : <><Sparkles className="w-3 h-3" /> AI Tags</>
                        }
                      </button>
                    </div>

                    {/* AI suggested tags */}
                    {suggestedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2 p-2.5 rounded-lg animate-fade-in"
                        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <span className="text-xs text-purple-400 w-full mb-1">Click to add:</span>
                        {suggestedTags.map((t) => (
                          <button
                            key={t}
                            onClick={() => { setEditTags((p) => [...p, t]); setSuggestedTags((p) => p.filter((x) => x !== t)); }}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/35 transition-all"
                          >
                            <Tag className="w-3 h-3" /> {t} <span className="text-purple-400 ml-0.5">+</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {editTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editTags.map((t) => (
                          <span key={t}
                            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Tag className="w-3 h-3" /> {t}
                            <button onClick={() => setEditTags(editTags.filter((x) => x !== t))}
                              className="hover:text-white ml-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder="Add tag, press Enter..." className="text-sm py-2" />
                      <Button variant="secondary" size="sm" onClick={addTag} className="px-4 whitespace-nowrap">
                        Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-1.5 block">Content</label>
                    <div data-color-mode="dark">
                      <MDEditor
                        value={editContent}
                        onChange={(v) => setEditContent(v ?? '')}
                        height={260}
                        preview="edit"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ── VIEW MODE ─────────────────────────── */
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-white font-bold text-xl leading-snug">{note.title}</h2>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: FolderOpen, label: note.category },
                      { icon: Calendar,   label: note.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                      { icon: Clock,      label: `Updated ${note.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` },
                    ].map(({ icon: Icon, label }) => (
                      <span key={label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                        <Icon className="w-3 h-3" /> {label}
                      </span>
                    ))}
                  </div>

                  <div className="h-px bg-gradient-to-r from-purple-500/20 via-white/10 to-transparent" />

                  {/* Markdown-rendered content */}
                  <MarkdownContent
                    content={note.content}
                    className="text-white/80"
                    notes={notes}
                    onNoteLink={onNavigateToNote}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-white/25 text-xs">
                      {note.content.split(/\s+/).filter(Boolean).length} words
                    </p>
                    <button
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                    >
                      {isSummarizing
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Summarizing…</>
                        : <><Sparkles className="w-3 h-3" /> Summarize</>
                      }
                    </button>
                  </div>

                  {/* AI Summary block */}
                  {summary && (
                    <div className="rounded-xl p-4 animate-fade-in"
                      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                          <Sparkles className="w-3 h-3" /> AI Summary
                        </span>
                        <button onClick={() => setSummary(null)} className="text-white/30 hover:text-white/60 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{summary}</p>
                    </div>
                  )}

                  {note.tags.length > 0 && (
                    <div>
                      <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {note.tags.map((t) => (
                          <span key={t}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            <Tag className="w-3 h-3" /> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 flex-shrink-0">
              <p className="text-white/20 text-xs text-center">
                {isEditing ? 'Ctrl+Enter to save • ESC to cancel' : 'Click Edit to modify • ESC to close'}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
