import * as dotenv from 'dotenv';
dotenv.config();   // must be first — loads GROQ_API_KEY before any import uses it

import express from 'express';
import cors from 'cors';
import path from 'path';
import { authRouter } from './routes/auth';
import { notesRouter } from './routes/notes';
import { categoriesRouter } from './routes/categories';
import { chatRouter } from './routes/chat';
import { aiRouter } from './routes/ai';

// Import database (runs schema migration on startup)
import './database';

const app        = express();
const PORT       = process.env.PORT ?? 3001;
const AI         = !!process.env.GROQ_API_KEY?.trim();
const PROD       = process.env.NODE_ENV === 'production';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: PROD ? true : ['http://localhost:5173', 'http://localhost:4173'],
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ai: AI, timestamp: new Date().toISOString() });
});

app.use('/api/auth',       authRouter);
app.use('/api/notes',      notesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/chat',       chatRouter);
app.use('/api/ai',         aiRouter);

// ── Serve frontend in production ───────────────────────────────────────────────
if (PROD) {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT}`);
  console.log(`[AI]     ${AI ? 'Groq API enabled (llama-3.3-70b-versatile)' : 'Mock mode (no GROQ_API_KEY)'}`);
});
