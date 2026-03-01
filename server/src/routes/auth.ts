import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { requireAuth } from '../middleware/auth';
import type { UserRow, RegisterBody, LoginBody, AuthenticatedRequest } from '../types';

export const authRouter = Router();

const SECRET = () => process.env.JWT_SECRET ?? 'fallback-secret-change-in-production';

function makeToken(user: { id: string; username: string; email: string }) {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, SECRET(), {
    expiresIn: '7d',
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body as RegisterBody;

  if (!username?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'Username, email and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  // Uniqueness check
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email.toLowerCase(), username.trim()) as { id: string } | undefined;

  if (existing) {
    res.status(409).json({ error: 'Email or username is already taken' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const id   = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now  = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, username, email, password, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, username.trim(), email.toLowerCase(), hash, now);

  const user = { id, username: username.trim(), email: email.toLowerCase() };
  res.status(201).json({ token: makeToken(user), user });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginBody;

  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase()) as UserRow | undefined;

  if (!row) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, row.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const user = { id: row.id, username: row.username, email: row.email };
  res.json({ token: makeToken(user), user });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
authRouter.get('/me', requireAuth as never, (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  res.json({ id: user.id, username: user.username, email: user.email });
});
