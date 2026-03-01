import { Router, Request, Response } from 'express';
import { db } from '../database';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth as never);

// ── GET /api/categories ───────────────────────────────────────────────────────
categoriesRouter.get('/', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const rows = db
    .prepare('SELECT category, content FROM notes WHERE user_id = ?')
    .all(user.id) as { category: string; content: string }[];

  const map = new Map<string, { count: number; words: number }>();

  for (const row of rows) {
    const wordCount = row.content.split(/\s+/).filter(Boolean).length;
    const existing  = map.get(row.category) ?? { count: 0, words: 0 };
    map.set(row.category, { count: existing.count + 1, words: existing.words + wordCount });
  }

  const categories = Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);

  res.json(categories);
});
