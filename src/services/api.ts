import type { Note } from '../types';
import { clearAuth, getToken } from '../utils/authStorage';

const BASE = '/api';

/** Convert ISO string dates from the API into Date objects */
function deserializeNote(raw: Record<string, unknown>): Note {
  return {
    id:        raw.id as string,
    title:     raw.title as string,
    content:   raw.content as string,
    category:  raw.category as string,
    tags:      raw.tags as string[],
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...init });

  if (res.status === 401) {
    clearAuth();
    window.location.reload();
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Notes API ────────────────────────────────────────────────────────────────

export async function fetchNotes(): Promise<Note[]> {
  const data = await request<Record<string, unknown>[]>('/notes');
  return data.map(deserializeNote);
}

export async function createNote(
  data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Note> {
  const raw = await request<Record<string, unknown>>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return deserializeNote(raw);
}

export async function updateNote(
  id: string,
  data: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<Note> {
  const raw = await request<Record<string, unknown>>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return deserializeNote(raw);
}

export async function deleteNote(id: string): Promise<void> {
  await request<void>(`/notes/${id}`, { method: 'DELETE' });
}

// ── Health check ─────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    await fetch(`${BASE}/health`);
    return true;
  } catch {
    return false;
  }
}
