import type { Note } from '../types';

export const NOTES_KEY    = 'aik-notes';
export const QUERIES_KEY  = 'aik-query-count';

// ── Date-safe serialisation ───────────────────────
interface NoteRaw {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const arr: NoteRaw[] = JSON.parse(raw);
    return arr.map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }));
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ── Query counter ─────────────────────────────────
export function loadQueryCount(): number {
  return parseInt(localStorage.getItem(QUERIES_KEY) ?? '0', 10);
}

export function incrementQueryCount(): number {
  const next = loadQueryCount() + 1;
  localStorage.setItem(QUERIES_KEY, String(next));
  return next;
}

export function clearQueryCount(): void {
  localStorage.removeItem(QUERIES_KEY);
}

// ── Storage info ──────────────────────────────────
export function getStorageKB(): number {
  try {
    const raw = localStorage.getItem(NOTES_KEY) ?? '';
    return parseFloat((new Blob([raw]).size / 1024).toFixed(1));
  } catch { return 0; }
}

// ── AI model preference ───────────────────────────
export const AI_MODEL_KEY = 'aik-ai-model';

export function loadAiModel(): string {
  return localStorage.getItem(AI_MODEL_KEY) ?? 'llama-3.3-70b-versatile';
}

export function saveAiModel(model: string): void {
  localStorage.setItem(AI_MODEL_KEY, model);
}
