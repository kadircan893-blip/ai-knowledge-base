import { useState, useEffect, useCallback, useRef } from 'react';
import { loadNotes, saveNotes } from '../utils/noteStorage';
import * as api from '../services/api';
import type { Note } from '../types';

// ── Seed data shown on first launch (localStorage fallback) ───────────────────
const SEED_NOTES: Note[] = [
  {
    id: 'seed-1',
    title: 'React useEffect Hook',
    content:
      'useEffect runs after every render by default. Pass an empty array [] as the second argument to run only once on mount. Return a cleanup function to avoid memory leaks. Use multiple useEffect hooks to separate concerns.',
    category: 'React',
    tags: ['hooks', 'lifecycle'],
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'seed-2',
    title: 'TypeScript Generics',
    content:
      'Generics allow you to write reusable, type-safe code. Use <T> syntax to define a generic type parameter. Constraints can be added with "extends". Example: function identity<T>(arg: T): T { return arg; }',
    category: 'TypeScript',
    tags: ['generics', 'types'],
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'seed-3',
    title: 'RAG Architecture',
    content:
      'Retrieval Augmented Generation (RAG) combines retrieval-based and generative AI. Steps: 1) Embed documents into vector store. 2) On query, retrieve relevant chunks. 3) Pass context + query to LLM. 4) Generate grounded response.',
    category: 'AI',
    tags: ['rag', 'llm', 'embeddings'],
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'seed-4',
    title: 'Glassmorphism Design Principles',
    content:
      'Key elements: backdrop-filter: blur, semi-transparent background (rgba), subtle border (rgba white), layered depth. Works best on gradient or image backgrounds. Combine with soft shadows for depth.',
    category: 'Design',
    tags: ['css', 'ui', 'glassmorphism'],
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date(Date.now() - 86400000 * 3),
  },
];

export interface UseNotesReturn {
  notes: Note[];
  isLoading: boolean;
  isOnline: boolean;
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  resetNotes: () => void;
}

export function useNotes(): UseNotesReturn {
  const [notes, setNotes]         = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline]   = useState(false);
  const serverAvailable           = useRef(false);

  // ── Initial load: try API first, fall back to localStorage ────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const serverNotes = await api.fetchNotes();
        if (cancelled) return;
        serverAvailable.current = true;
        setIsOnline(true);
        setNotes(serverNotes);
        saveNotes(serverNotes); // cache locally
      } catch {
        if (cancelled) return;
        serverAvailable.current = false;
        setIsOnline(false);
        const stored  = loadNotes();
        const initial = stored.length > 0 ? stored : SEED_NOTES;
        if (stored.length === 0) saveNotes(SEED_NOTES);
        setNotes(initial);
      } finally {
        if (!cancelled) setTimeout(() => { if (!cancelled) setIsLoading(false); }, 600);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Auto-persist to localStorage whenever notes change ────────────────────
  useEffect(() => {
    if (!isLoading) saveNotes(notes);
  }, [notes, isLoading]);

  // ── CRUD with optimistic updates ─────────────────────────────────────────
  const addNote = useCallback(
    (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
      const now = new Date();
      const optimisticNote: Note = {
        ...data,
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };

      setNotes((prev) => [optimisticNote, ...prev]);

      if (serverAvailable.current) {
        api.createNote(data).then((serverNote) => {
          setNotes((prev) =>
            prev.map((n) => (n.id === optimisticNote.id ? serverNote : n))
          );
        }).catch(() => { /* keep optimistic note */ });
      }

      return optimisticNote;
    },
    []
  );

  const updateNote = useCallback(
    (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data, updatedAt: new Date() } : n))
      );
      if (serverAvailable.current) {
        api.updateNote(id, data).catch(() => { /* localStorage already updated */ });
      }
    },
    []
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (serverAvailable.current) {
      api.deleteNote(id).catch(() => { /* silently ignore */ });
    }
  }, []);

  const getNoteById = useCallback(
    (id: string) => notes.find((n) => n.id === id),
    [notes]
  );

  const resetNotes = useCallback(() => {
    saveNotes(SEED_NOTES);
    setNotes(SEED_NOTES);
  }, []);

  return { notes, isLoading, isOnline, addNote, updateNote, deleteNote, getNoteById, resetNotes };
}
