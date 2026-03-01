import { Router, Request, Response } from 'express';
import { db } from '../database';
import { requireAuth } from '../middleware/auth';
import type { NoteRow, CreateNoteBody, UpdateNoteBody, AuthenticatedRequest } from '../types';

export const notesRouter = Router();
notesRouter.use(requireAuth as never);

/** Convert a DB row into the shape the frontend expects */
function rowToNote(row: NoteRow) {
  return {
    id:        row.id,
    title:     row.title,
    content:   row.content,
    category:  row.category,
    tags:      JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/notes ────────────────────────────────────────────────────────────
notesRouter.get('/', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const rows = db
    .prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC')
    .all(user.id) as NoteRow[];
  res.json(rows.map(rowToNote));
});

// ── GET /api/notes/:id ────────────────────────────────────────────────────────
notesRouter.get('/:id', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const row = db
    .prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
    .get(req.params.id, user.id) as NoteRow | undefined;
  if (!row) { res.status(404).json({ error: 'Note not found' }); return; }
  res.json(rowToNote(row));
});

// ── POST /api/notes ───────────────────────────────────────────────────────────
notesRouter.post('/', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const body = req.body as CreateNoteBody;
  if (!body.title?.trim() || !body.content?.trim()) {
    res.status(400).json({ error: 'title and content are required' });
    return;
  }

  const now = new Date().toISOString();
  const id  = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  db.prepare(
    `INSERT INTO notes (id, user_id, title, content, category, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    user.id,
    body.title.trim(),
    body.content.trim(),
    body.category ?? 'Other',
    JSON.stringify(body.tags ?? []),
    now,
    now,
  );

  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow;
  res.status(201).json(rowToNote(row));
});

// ── PUT /api/notes/:id ────────────────────────────────────────────────────────
notesRouter.put('/:id', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const existing = db
    .prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
    .get(req.params.id, user.id) as NoteRow | undefined;
  if (!existing) { res.status(404).json({ error: 'Note not found' }); return; }

  const body = req.body as UpdateNoteBody;
  const now  = new Date().toISOString();

  db.prepare(
    `UPDATE notes SET title = ?, content = ?, category = ?, tags = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    body.title    ?? existing.title,
    body.content  ?? existing.content,
    body.category ?? existing.category,
    body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags,
    now,
    req.params.id,
    user.id,
  );

  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id) as NoteRow;
  res.json(rowToNote(row));
});

// ── DELETE /api/notes/:id ─────────────────────────────────────────────────────
notesRouter.delete('/:id', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const result = db
    .prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .run(req.params.id, user.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Note not found' }); return; }
  res.status(204).send();
});
