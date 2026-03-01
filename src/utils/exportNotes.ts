import type { Note } from '../types';

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slug(title: string) {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
}

// ── Single note ───────────────────────────────────────────────────────────────
export function exportNoteAsJSON(note: Note) {
  download(`${slug(note.title)}.json`, JSON.stringify(note, null, 2), 'application/json');
}

export function exportNoteAsMarkdown(note: Note) {
  const tags  = note.tags.length ? `\ntags: [${note.tags.join(', ')}]` : '';
  const front = `---\ntitle: "${note.title}"\ncategory: ${note.category}${tags}\ncreated: ${note.createdAt.toISOString()}\nupdated: ${note.updatedAt.toISOString()}\n---\n\n`;
  download(`${slug(note.title)}.md`, front + `# ${note.title}\n\n${note.content}`, 'text/markdown');
}

export function exportNoteAsTxt(note: Note) {
  const tags = note.tags.length ? `Tags: ${note.tags.join(', ')}\n` : '';
  const content = `${note.title}\n${'='.repeat(note.title.length)}\nCategory: ${note.category}\n${tags}Created: ${note.createdAt.toLocaleDateString()}\n\n${note.content}`;
  download(`${slug(note.title)}.txt`, content, 'text/plain');
}

// ── All notes ─────────────────────────────────────────────────────────────────
export function exportAllAsJSON(notes: Note[]) {
  download('knowledge-base.json', JSON.stringify(notes, null, 2), 'application/json');
}

export function exportAllAsMarkdown(notes: Note[]) {
  const content = notes.map((n) => {
    const tags = n.tags.length ? `\ntags: [${n.tags.join(', ')}]` : '';
    return `---\ntitle: "${n.title}"\ncategory: ${n.category}${tags}\n---\n\n# ${n.title}\n\n${n.content}`;
  }).join('\n\n---\n\n');
  download('knowledge-base.md', content, 'text/markdown');
}

export function exportAllAsTxt(notes: Note[]) {
  const content = notes.map((n) => {
    const tags = n.tags.length ? `Tags: ${n.tags.join(', ')}\n` : '';
    return `${n.title}\n${'='.repeat(n.title.length)}\nCategory: ${n.category}\n${tags}\n${n.content}`;
  }).join('\n\n' + '─'.repeat(40) + '\n\n');
  download('knowledge-base.txt', content, 'text/plain');
}
