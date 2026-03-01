import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link2 } from 'lucide-react';
import type { Components } from 'react-markdown';
import type { Note } from '../../types';

interface MarkdownContentProps {
  content: string;
  className?: string;
  notes?: Note[];
  onNoteLink?: (note: Note) => void;
}

// ── Pre-process [[Note Title]] → wiki:// links before markdown parsing ─────────
function preprocessWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, title: string) =>
    `[${title}](wiki://${encodeURIComponent(title.trim())})`
  );
}

export default function MarkdownContent({ content, className = '', notes, onNoteLink }: MarkdownContentProps) {
  const processed = preprocessWikiLinks(content);

  const components: Components = {
    h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-3 mb-1.5 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-bold text-white mt-3 mb-1 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold text-white/90 mt-2 mb-1 first:mt-0">{children}</h3>,
    p:  ({ children }) => <p className="text-[inherit] leading-relaxed mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
    em:     ({ children }) => <em className="italic opacity-80">{children}</em>,

    // Inline code vs block code
    pre: ({ children }) => (
      <pre className="bg-black/30 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-xs leading-relaxed">
        {children}
      </pre>
    ),
    code: ({ className: cls, children }) => {
      const isBlock = !!cls;
      return isBlock
        ? <code className={`${cls} text-cyan-300 font-mono`}>{children}</code>
        : <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 text-xs font-mono">{children}</code>;
    },

    ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-0.5 text-[inherit]">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-0.5 text-[inherit]">{children}</ol>,
    li: ({ children }) => <li className="text-[inherit] leading-relaxed">{children}</li>,

    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-purple-400/60 pl-3 my-2 italic opacity-70">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-white/10 my-3" />,

    a: ({ href, children }) => {
      // ── Wiki link: [[Note Title]] ──────────────────────────────────────────
      if (href?.startsWith('wiki://')) {
        const title = decodeURIComponent(href.slice(7));
        const linked = notes?.find(
          (n) => n.title.toLowerCase() === title.toLowerCase()
        );
        return (
          <button
            onClick={() => linked && onNoteLink?.(linked)}
            title={linked ? `Open note: ${linked.title}` : `Note not found: ${title}`}
            className={`inline-flex items-center gap-1 font-medium underline underline-offset-2 transition-colors ${
              linked
                ? 'text-purple-300 hover:text-purple-200 cursor-pointer'
                : 'text-white/30 cursor-default no-underline'
            }`}
          >
            <Link2 className="w-3 h-3 flex-shrink-0" />
            {children}
          </button>
        );
      }

      // ── Regular link ───────────────────────────────────────────────────────
      return (
        <a href={href} target="_blank" rel="noreferrer"
          className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 transition-colors">
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`markdown-body text-sm ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
