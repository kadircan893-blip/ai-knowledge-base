import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, BookOpen, Zap, ZapOff } from 'lucide-react';
import { useQueryCount } from '../hooks/useQueryCount';
import MarkdownContent from '../components/ui/MarkdownContent';
import { loadAiModel } from '../utils/noteStorage';
import type { ChatMessage, Note } from '../types';

interface ChatPageProps {
  notes: Note[];
}

const SUGGESTIONS = [
  'What do I know about React hooks?',
  'Summarize my TypeScript notes',
  'What AI topics have I covered?',
  'Explain glassmorphism design',
];

// ── SSE stream reader ──────────────────────────────────────────────────────────
async function readSSEStream(
  response: Response,
  onToken: (text: string) => void,
  onContext: (count: number) => void,
  onError: (msg: string) => void,
) {
  const reader  = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;

      try {
        const parsed = JSON.parse(raw) as {
          text?: string;
          context?: number;
          error?: string;
        };
        if (parsed.text)                    onToken(parsed.text);
        if (parsed.context !== undefined)   onContext(parsed.context);
        if (parsed.error)                   onError(parsed.error);
      } catch { /* skip malformed chunk */ }
    }
  }
}

export default function ChatPage({ notes }: ChatPageProps) {
  const { increment: incrementQuery } = useQueryCount();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello! I'm your AI assistant. I have access to your ${notes.length} note${notes.length !== 1 ? 's' : ''}. Ask me anything about your knowledge base!`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput]             = useState('');
  const [isTyping, setIsTyping]       = useState(false);
  const [contextUsed, setContextUsed] = useState<number | null>(null);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  // Check AI availability on mount
  useEffect(() => {
    fetch('/api/chat/status')
      .then((r) => r.json())
      .then((d: { aiAvailable: boolean }) => setAiAvailable(d.aiAvailable))
      .catch(() => setAiAvailable(false));
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const sendMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setContextUsed(null);
    incrementQuery();

    // Placeholder assistant message — filled token by token via streaming
    const aiMsgId = `ai-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    // Build history (exclude welcome msg and empty messages, last 10)
    const history = messages
      .filter((m) => m.id !== '0' && m.content !== '')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history, model: loadAiModel() }),
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      await readSSEStream(
        response,
        (token) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + token } : m
            )
          ),
        (count) => setContextUsed(count),
        (errMsg) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: `⚠️ ${errMsg}` } : m
            )
          ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content:
                  'Sorry, I could not reach the server. Make sure `npm run dev` is running.',
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-4">

      {/* Suggestions + AI mode badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isTyping}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/60 hover:text-white hover:bg-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lightbulb className="w-3 h-3" /> {s}
            </button>
          ))}
        </div>

        {aiAvailable !== null && (
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${
            aiAvailable
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-white/5 border-white/15 text-white/30'
          }`}>
            {aiAvailable
              ? <><Zap className="w-3 h-3" /> Groq AI</>
              : <><ZapOff className="w-3 h-3" /> Mock mode</>
            }
          </div>
        )}
      </div>

      {/* Chat Container */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                    : 'linear-gradient(135deg, #06B6D4, #10B981)',
                }}
              >
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className="flex flex-col gap-1 max-w-[72%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'text-white/90 rounded-bl-sm bg-white/10 border border-white/15'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }
                      : undefined
                  }
                >
                  {/* Streaming cursor while content is empty */}
                  {msg.content === '' && msg.role === 'assistant' ? (
                    <span className="inline-block w-2 h-4 bg-cyan-400/70 rounded-sm animate-pulse" />
                  ) : msg.role === 'assistant' ? (
                    <MarkdownContent content={msg.content} className="text-white/90" />
                  ) : (
                    msg.content
                  )}
                  <span className="block text-xs opacity-40 mt-1.5 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Context indicator (shown after last AI response) */}
        {contextUsed !== null && !isTyping && (
          <div className="px-5 py-1.5 border-t border-white/5 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-white/25" />
            <span className="text-white/25 text-xs">
              {contextUsed > 0
                ? `Used ${contextUsed} note${contextUsed !== 1 ? 's' : ''} as context`
                : 'No matching notes — answered from general knowledge'}
            </span>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Sparkles className="absolute left-3 top-3.5 w-4 h-4 text-white/30 pointer-events-none" />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask about your notes… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="glass-input pl-10 pr-4 resize-none w-full"
                style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/20 text-xs mt-1.5 pl-1">
            {isTyping
              ? 'AI is responding…'
              : `${notes.length} note${notes.length !== 1 ? 's' : ''} in your knowledge base`}
          </p>
        </div>
      </div>
    </div>
  );
}
