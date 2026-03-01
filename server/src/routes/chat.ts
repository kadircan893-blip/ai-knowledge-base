import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { db } from '../database';
import { requireAuth } from '../middleware/auth';
import type { NoteRow, AuthenticatedRequest } from '../types';

export const chatRouter = Router();
chatRouter.use(requireAuth as never);

// ── Groq client — initialized lazily at request time so dotenv has run ───────
function getGroq(): Groq | null {
  const key = process.env.GROQ_API_KEY?.trim();
  return key ? new Groq({ apiKey: key }) : null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

const ALLOWED_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
] as const;
type AllowedModel = typeof ALLOWED_MODELS[number];
const DEFAULT_MODEL: AllowedModel = 'llama-3.3-70b-versatile';

interface ChatBody {
  message: string;
  history?: HistoryItem[];
  model?: string;
}

// ── RAG: keyword relevance scoring ───────────────────────────────────────────
function findRelevantNotes(query: string, userId: string, limit = 4): NoteRow[] {
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return [];

  const rows = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId) as NoteRow[];

  const scored = rows.map((row) => {
    let score = 0;
    const title   = row.title.toLowerCase();
    const content = row.content.toLowerCase();
    const tags    = row.tags.toLowerCase();

    for (const word of words) {
      if (title.includes(word))   score += 3;  // title match = highest weight
      if (content.includes(word)) score += 1;
      if (tags.includes(word))    score += 2;
    }
    return { row, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.row);
}

// ── System prompt builder ─────────────────────────────────────────────────────
function buildSystemPrompt(relevantNotes: NoteRow[]): string {
  const base = `You are a helpful AI assistant for a personal knowledge base app called "AI Knowledge Base". \
You help users find, understand, and connect ideas across their personal notes. \
Be concise, insightful, and friendly. Use markdown formatting when it adds clarity.`;

  if (relevantNotes.length === 0) {
    return `${base}

The user's notes contain no content directly relevant to this query. \
You can still answer with your general knowledge — just be transparent about it.`;
  }

  const context = relevantNotes.map((n, i) => {
    const tags = (JSON.parse(n.tags) as string[]).join(', ');
    return `### [Note ${i + 1}] ${n.title}\n**Category:** ${n.category}${tags ? `\n**Tags:** ${tags}` : ''}\n\n${n.content}`;
  }).join('\n\n---\n\n');

  return `${base}

Here are the most relevant notes from the user's knowledge base:

${context}

When answering, primarily draw from these notes. If you supplement with your own knowledge, say so explicitly. Reference specific notes by name when helpful.`;
}

// ── Mock response (no API key) ────────────────────────────────────────────────
function generateMockResponse(query: string, relevantNotes: NoteRow[], userId: string): string {
  if (relevantNotes.length === 0) {
    const { n } = db.prepare('SELECT COUNT(*) as n FROM notes WHERE user_id = ?').get(userId) as { n: number };
    return n === 0
      ? "You don't have any notes yet! Add some notes first, and I'll be able to answer questions based on your personal knowledge base."
      : `I searched through your ${n} notes but couldn't find information directly related to "${query}". Try rephrasing your question or adding more notes on this topic.\n\n*Tip: Add a \`GROQ_API_KEY\` to \`.env\` for real AI-powered answers (free at console.groq.com).*`;
  }

  const note = relevantNotes[0];
  const tags = JSON.parse(note.tags) as string[];
  const tagStr = tags.length ? ` · ${tags.join(', ')}` : '';
  const more = relevantNotes.length > 1
    ? `\n\nI also found ${relevantNotes.length - 1} more related note(s): ${relevantNotes.slice(1).map((n) => `"${n.title}"`).join(', ')}.`
    : '';

  return `Based on your notes, here's what I found:\n\n**${note.title}** *(${note.category}${tagStr})*\n\n${note.content}${more}\n\n*Add a \`GROQ_API_KEY\` to \`.env\` for real AI-powered answers (free at console.groq.com).*`;
}

// ── SSE helpers ───────────────────────────────────────────────────────────────
function sseHeaders(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function send(res: Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function done(res: Response, contextCount: number) {
  send(res, { context: contextCount });
  res.write('data: [DONE]\n\n');
  res.end();
}

// ── GET /api/chat/status ──────────────────────────────────────────────────────
chatRouter.get('/status', (_req: Request, res: Response) => {
  res.json({ aiAvailable: !!process.env.GROQ_API_KEY?.trim() });
});

// ── POST /api/chat ────────────────────────────────────────────────────────────
chatRouter.post('/', async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { message, history = [], model: requestedModel } = req.body as ChatBody;
  const model: AllowedModel = ALLOWED_MODELS.includes(requestedModel as AllowedModel)
    ? (requestedModel as AllowedModel)
    : DEFAULT_MODEL;

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const relevantNotes = findRelevantNotes(message, user.id);
  sseHeaders(res);

  const groq = getGroq();

  // ── Mock mode ─────────────────────────────────────────────────────────────
  if (!groq) {
    const text = generateMockResponse(message, relevantNotes, user.id);
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 25));
      send(res, { text: (i === 0 ? '' : ' ') + words[i] });
    }
    done(res, relevantNotes.length);
    return;
  }

  // ── Real AI mode (Groq streaming) ─────────────────────────────────────────
  try {
    const systemPrompt = buildSystemPrompt(relevantNotes);

    const stream = await groq.chat.completions.create({
      model,
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: message.trim() },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) send(res, { text });
    }

    done(res, relevantNotes.length);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    send(res, { error: msg });
    res.write('data: [DONE]\n\n');
    res.end();
  }
});
