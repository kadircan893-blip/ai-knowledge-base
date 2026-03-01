import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Tag, X, Save, FileText, SlidersHorizontal, Download, CheckSquare, Trash2, Square, Sparkles, Loader2 } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import NoteCard from '../components/ui/NoteCard';
import NoteDetailPanel from '../components/ui/NoteDetailPanel';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/GlassInput';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import { useSearch } from '../hooks/useSearch';
import { exportAllAsJSON, exportAllAsMarkdown, exportAllAsTxt } from '../utils/exportNotes';
import type { Note, NavPage, SortBy, DateFilter } from '../types';

interface NotesPageProps {
  notes: Note[];
  onAddNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  onUpdateNote: (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  onDeleteNote: (id: string) => void;
  onNavigate: (page: NavPage) => void;
  initialCategoryFilter?: string;
}

const CATEGORIES = ['React', 'TypeScript', 'AI', 'Design', 'JavaScript', 'CSS', 'Backend', 'Other'];

const DATE_LABELS: Record<DateFilter, string> = {
  all: 'All time', today: 'Today', week: 'This week', month: 'This month',
};

const SORT_LABELS: Record<SortBy, string> = {
  newest: 'Newest', oldest: 'Oldest', alphabetical: 'A → Z', 'recently-updated': 'Recently updated',
};

export default function NotesPage({ notes, onAddNote, onUpdateNote, onDeleteNote, initialCategoryFilter }: NotesPageProps) {
  const toast = useToast();

  const {
    query, setQuery,
    filterCategory, setFilterCategory,
    filterTag, setFilterTag,
    filterDate, setFilterDate,
    sortBy, setSortBy,
    filteredNotes,
    clearFilters,
    activeFilterCount,
    allTags,
    debouncedQuery,
  } = useSearch(notes, initialCategoryFilter);

  // UI toggles
  const [showForm, setShowForm]         = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving]             = useState(false);

  // Bulk select state
  const [selectMode, setSelectMode]         = useState(false);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotes.map((n) => n.id)));
  };

  const handleBulkDelete = () => {
    if (!confirmBulkDelete) { setConfirmBulkDelete(true); return; }
    const count = selectedIds.size;
    selectedIds.forEach((id) => onDeleteNote(id));
    toast.info(`${count} note${count !== 1 ? 's' : ''} deleted.`);
    setSelectMode(false);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setSelectedNote(null);
  };

  // Form fields
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [category, setCategory] = useState('React');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [errors, setErrors]     = useState<{ title?: string; content?: string }>({});
  const [suggestedTags, setSuggestedTags]       = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  // Smart Search state
  type SmartResult = { note: Note; relevance: number };
  const [smartSearch, setSmartSearch]         = useState(false);
  const [smartResults, setSmartResults]       = useState<SmartResult[]>([]);
  const [smartLoading, setSmartLoading]       = useState(false);
  const [expandedTerms, setExpandedTerms]     = useState<string[]>([]);

  const activeCategories = [...new Set(notes.map((n) => n.category))];

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim())   e.title   = 'Title is required';
    if (!content.trim()) e.content = 'Content is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fill in all required fields.'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 320));
    onAddNote({ title: title.trim(), content: content.trim(), category, tags });
    toast.success('Note saved!');
    setTitle(''); setContent(''); setCategory('React');
    setTags([]); setTagInput(''); setErrors({});
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    onDeleteNote(id);
    toast.info('Note deleted.');
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  const handleUpdate = (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    onUpdateNote(id, data);
    toast.success('Note updated!');
    setSelectedNote((prev) => prev?.id === id ? { ...prev, ...data, updatedAt: new Date() } : prev);
  };

  const handleCancel = () => {
    setShowForm(false);
    setTitle(''); setContent(''); setCategory('React');
    setTags([]); setTagInput(''); setErrors({});
    setSuggestedTags([]);
  };

  const handleSuggestTags = async () => {
    if (isSuggestingTags || !content.trim()) return;
    setIsSuggestingTags(true);
    setSuggestedTags([]);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json() as { tags?: string[]; error?: string };
      const newTags = (data.tags ?? []).filter((t) => !tags.includes(t));
      setSuggestedTags(newTags);
    } catch {
      setSuggestedTags([]);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  // Run smart search whenever query changes (debounced)
  useEffect(() => {
    if (!smartSearch || !debouncedQuery.trim()) {
      setSmartResults([]);
      setExpandedTerms([]);
      return;
    }
    let cancelled = false;
    setSmartLoading(true);
    fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: debouncedQuery, expand: true }),
    })
      .then((r) => r.json())
      .then((data: { results?: SmartResult[]; expandedTerms?: string[] }) => {
        if (!cancelled) {
          setSmartResults((data.results ?? []).map((r) => ({
            note: { ...r.note, createdAt: new Date(r.note.createdAt), updatedAt: new Date(r.note.updatedAt) } as Note,
            relevance: r.relevance,
          })));
          setExpandedTerms(data.expandedTerms ?? []);
        }
      })
      .catch(() => { if (!cancelled) setSmartResults([]); })
      .finally(() => { if (!cancelled) setSmartLoading(false); });
    return () => { cancelled = true; };
  }, [smartSearch, debouncedQuery]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..." className="glass-input pl-10 text-sm py-2.5 pr-10" />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white'
          }`}>
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="glass-input text-sm py-2.5 cursor-pointer" style={{ width: 'auto' }}>
          {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([v, l]) => (
            <option key={v} value={v} className="bg-slate-900">{l}</option>
          ))}
        </select>

        {/* Export all dropdown */}
        {notes.length > 0 && (
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white"
              title="Export all notes"
            >
              <Download className="w-4 h-4" />
            </button>
            {showExportMenu && (
              <div
                className="absolute right-0 top-12 w-44 rounded-xl overflow-hidden z-20 animate-fade-in"
                style={{
                  background: 'rgba(15,23,42,0.98)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                <p className="px-4 py-2 text-white/30 text-xs font-semibold uppercase tracking-wider border-b border-white/10">
                  Export all ({notes.length})
                </p>
                {[
                  { label: 'JSON', action: () => exportAllAsJSON(notes) },
                  { label: 'Markdown', action: () => exportAllAsMarkdown(notes) },
                  { label: 'Plain Text', action: () => exportAllAsTxt(notes) },
                ].map(({ label, action }) => (
                  <button key={label} onClick={() => { action(); setShowExportMenu(false); toast.success(`Exported as ${label}`); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Select mode toggle */}
        {notes.length > 0 && (
          <button
            onClick={toggleSelectMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              selectMode
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            title={selectMode ? 'Cancel selection' : 'Select notes'}
          >
            {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}

        <button
          onClick={() => { setSmartSearch((v) => !v); setSmartResults([]); setExpandedTerms([]); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            smartSearch
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="AI-powered semantic search"
        >
          <Sparkles className="w-4 h-4" /> Smart
        </button>

        <Button variant="primary" icon={Plus} onClick={() => setShowForm(!showForm)}>New Note</Button>
      </div>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="glass-card px-5 py-3 flex flex-wrap items-center gap-3 animate-fade-in"
          style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)' }}>
          <span className="text-white/60 text-sm font-medium">
            <span className="text-white font-bold">{selectedIds.size}</span> note{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={selectAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-all"
          >
            Select all ({filteredNotes.length})
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ml-auto ${
                confirmBulkDelete
                  ? 'bg-red-500/30 border border-red-500/50 text-red-300 animate-pulse'
                  : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmBulkDelete ? `Confirm delete ${selectedIds.size}` : `Delete ${selectedIds.size}`}
            </button>
          )}
          {confirmBulkDelete && (
            <button
              onClick={() => setConfirmBulkDelete(false)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Advanced filters */}
      {showFilters && (
        <div className="glass-card p-4 animate-fade-in space-y-3" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" /> Advanced Filters
            </span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          <div>
            <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Date range</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(DATE_LABELS) as [DateFilter, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setFilterDate(v)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    filterDate === v
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-white/5 text-white/40 border-white/15 hover:bg-white/10'
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Filter by tag</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((t) => (
                  <button key={t} onClick={() => setFilterTag(filterTag === t ? '' : t)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      filterTag === t
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/5 text-white/40 border-white/15 hover:bg-white/10'
                    }`}>
                    <Tag className="w-3 h-3" /> {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category chips */}
      {activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCategory('')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filterCategory === ''
                ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                : 'bg-white/5 text-white/40 border-white/15 hover:bg-white/10'
            }`}>
            All ({notes.length})
          </button>
          {activeCategories.map((cat) => (
            <button key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
              className={`transition-all duration-200 ${filterCategory === cat ? 'ring-2 ring-white/20 scale-105' : 'hover:scale-105'}`}>
              <Badge label={`${cat} (${notes.filter((n) => n.category === cat).length})`} variant={cat} />
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      {(debouncedQuery || activeFilterCount > 0) && (
        <p className="text-white/30 text-xs px-1">
          Showing <span className="text-white/60 font-medium">{filteredNotes.length}</span> of{' '}
          <span className="text-white/60 font-medium">{notes.length}</span> notes
          {debouncedQuery && <> for <span className="text-purple-400">"{debouncedQuery}"</span></>}
        </p>
      )}

      {/* Smart Search results */}
      {smartSearch && debouncedQuery && (
        <div className="glass-card p-4 animate-fade-in space-y-3"
          style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-purple-300">
              <Sparkles className="w-4 h-4" /> Smart Search Results
              {smartLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
            </span>
            {expandedTerms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-white/30">AI expanded:</span>
                {expandedTerms.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!smartLoading && smartResults.length === 0 && (
            <p className="text-white/30 text-sm">No matching notes found.</p>
          )}

          {smartResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {smartResults.map(({ note, relevance }) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  relevance={relevance}
                  onDelete={handleDelete}
                  onSelect={setSelectedNote}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(note.id)}
                  onToggleSelect={toggleSelectId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New note form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in" style={{ borderColor: 'rgba(139,92,246,0.25)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-semibold">Create New Note</h3>
            </div>
            <button onClick={handleCancel} className="text-white/30 hover:text-white/60 p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <Input label="Title *" value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
              placeholder="Give your note a clear title..." error={errors.title} />
            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
            </Select>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/60 text-sm">Tags</label>
                <button
                  onClick={handleSuggestTags}
                  disabled={isSuggestingTags || !content.trim()}
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
                      onClick={() => { setTags((p) => [...p, t]); setSuggestedTags((p) => p.filter((x) => x !== t)); }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/35 transition-all"
                    >
                      <Tag className="w-3 h-3" /> {t} <span className="text-purple-400 ml-0.5">+</span>
                    </button>
                  ))}
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <Tag className="w-3 h-3" /> {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-white ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Type tag and press Enter..." className="text-sm py-2.5" />
                <Button variant="secondary" size="sm" onClick={addTag} className="whitespace-nowrap px-4">Add</Button>
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Content *</label>
              <div data-color-mode="dark">
                <MDEditor
                  value={content}
                  onChange={(v) => { setContent(v ?? ''); setErrors((p) => ({ ...p, content: undefined })); }}
                  height={240}
                  preview="edit"
                />
              </div>
              {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button variant="primary" icon={Save} loading={saving} onClick={handleSave}>Save Note</Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={notes.length === 0 ? 'No notes yet' : 'No matching notes'}
          description={
            notes.length === 0
              ? 'Create your first note to start building your knowledge base.'
              : 'Try adjusting your search or filters.'
          }
          actionLabel={notes.length === 0 ? 'Create First Note' : 'Clear filters'}
          onAction={notes.length === 0 ? () => setShowForm(true) : clearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onSelect={setSelectedNote}
              selectMode={selectMode}
              isSelected={selectedIds.has(note.id)}
              onToggleSelect={toggleSelectId}
            />
          ))}
        </div>
      )}

      {/* Slide-in detail / edit panel */}
      <NoteDetailPanel
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        notes={notes}
        onNavigateToNote={(n) => setSelectedNote(n)}
      />
    </div>
  );
}
