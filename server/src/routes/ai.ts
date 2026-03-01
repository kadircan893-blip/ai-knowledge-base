import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { db } from '../database';
import { requireAuth } from '../middleware/auth';
import type { NoteRow, AuthenticatedRequest } from '../types';

export const aiRouter = Router();
aiRouter.use(requireAuth as never);

// ── Groq client — lazy init so dotenv has run ─────────────────────────────────
function getGroq(): Groq | null {
  const key = process.env.GROQ_API_KEY?.trim();
  return key ? new Groq({ apiKey: key }) : null;
}

// ── POST /api/ai/summarize ────────────────────────────────────────────────────
aiRouter.post('/summarize', async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };

  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const groq = getGroq();

  if (!groq) {
    // Mock mode: return first 25 words
    const words = content.trim().split(/\s+/);
    const mock  = words.slice(0, 25).join(' ') + (words.length > 25 ? '…' : '');
    res.json({ summary: `[Mock] ${mock}` });
    return;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 180,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise note summarizer. Summarize the given note in 2–3 sentences. Be direct and informative. Return only the summary text — no preamble, no labels.',
        },
        { role: 'user', content: content.trim() },
      ],
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? 'Unable to generate summary.';
    res.json({ summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// ── POST /api/ai/suggest-tags ─────────────────────────────────────────────────
aiRouter.post('/suggest-tags', async (req: Request, res: Response) => {
  const { title, content } = req.body as { title?: string; content?: string };

  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const groq = getGroq();

  if (!groq) {
    // Mock mode: extract common words as tags
    const text  = `${title ?? ''} ${content}`.toLowerCase();
    const words = text.split(/\W+/).filter((w) => w.length > 3);
    const freq  = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
    const tags = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([w]) => w);
    res.json({ tags });
    return;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 80,
      messages: [
        {
          role: 'system',
          content:
            'You are a tagging assistant. Given a note title and content, suggest 3–5 concise, relevant lowercase tags. Return ONLY a valid JSON array of strings. No explanation. Example: ["react","hooks","state-management"]',
        },
        {
          role: 'user',
          content: `Title: ${title ?? 'Untitled'}\n\nContent: ${content.trim().slice(0, 600)}`,
        },
      ],
    });

    const raw   = completion.choices[0]?.message?.content?.trim() ?? '[]';
    let tags: string[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = match ? JSON.parse(match[0]) : [];
      tags = (parsed as unknown[])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase().trim())
        .slice(0, 5);
    } catch {
      tags = [];
    }

    res.json({ tags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// ── TF-IDF helpers ────────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
}

function tf(terms: string[], word: string): number {
  const count = terms.filter((t) => t === word).length;
  return terms.length === 0 ? 0 : count / terms.length;
}

function idf(allDocs: string[][], word: string): number {
  const docsWithWord = allDocs.filter((doc) => doc.includes(word)).length;
  return Math.log((allDocs.length + 1) / (docsWithWord + 1));
}

function tfidfScore(queryTerms: string[], docTerms: string[], allDocs: string[][]): number {
  return queryTerms.reduce((sum, term) => sum + tf(docTerms, term) * idf(allDocs, term), 0);
}

// ── POST /api/ai/search ───────────────────────────────────────────────────────
aiRouter.post('/search', async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { query, limit = 12, expand = false } = req.body as {
    query?: string;
    limit?: number;
    expand?: boolean;
  };

  if (!query?.trim()) {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  const rows = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(user.id) as NoteRow[];
  if (rows.length === 0) {
    res.json({ results: [], expandedTerms: [] });
    return;
  }

  let queryTerms = tokenize(query);
  const expandedTerms: string[] = [];

  // Optional Groq query expansion
  const groq = getGroq();
  if (expand && groq && queryTerms.length > 0) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        max_tokens: 60,
        messages: [
          {
            role: 'system',
            content:
              'Expand this search query into related keywords. Return ONLY a valid JSON array of lowercase strings, max 8 terms. Example: ["react","hooks","state","component"]',
          },
          { role: 'user', content: query.trim() },
        ],
      });
      const raw   = completion.choices[0]?.message?.content?.trim() ?? '[]';
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as unknown[];
        const extra  = parsed
          .filter((t): t is string => typeof t === 'string')
          .map((t) => t.toLowerCase().trim());
        expandedTerms.push(...extra);
        queryTerms = [...new Set([...queryTerms, ...extra])];
      }
    } catch { /* ignore expansion errors */ }
  }

  // Build weighted doc term lists: title ×3, tags ×2, content ×1
  const allDocTerms = rows.map((row) => {
    const t = tokenize(row.title);
    const g = tokenize(row.tags);
    const c = tokenize(row.content);
    return [...t, ...t, ...t, ...g, ...g, ...c];
  });

  // Score
  const scored = rows.map((row, i) => ({
    row,
    score: tfidfScore(queryTerms, allDocTerms[i], allDocTerms),
  }));

  const maxScore = Math.max(...scored.map((s) => s.score), 0.0001);

  const results = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({
      note: {
        id:        s.row.id,
        title:     s.row.title,
        content:   s.row.content,
        category:  s.row.category,
        tags:      JSON.parse(s.row.tags) as string[],
        createdAt: s.row.created_at,
        updatedAt: s.row.updated_at,
      },
      score:     s.score,
      relevance: Math.round((s.score / maxScore) * 100),
    }));

  res.json({ results, expandedTerms });
});
