# AI Knowledge Base

A full-stack, multi-user knowledge management application with AI-powered chat, semantic search, and offline support. Built with React, TypeScript, Express, and SQLite — wrapped in a glassmorphism UI.

## 🌐 Live Demo ; 

ai-knowledge-base-production-e2ff.up.railway.app

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Overview

AI Knowledge Base is a personal knowledge management tool that lets you store, organize, and query your notes using AI. Each user has a private, isolated workspace — notes are never shared between accounts. The app works offline (cached notes remain accessible) and can be installed as a Progressive Web App (PWA) on any device.

The core idea is to combine traditional note-taking with an AI chat layer: you ask questions in natural language and the assistant answers using only your own notes as context, keeping responses grounded and relevant.

---

## Features

### Authentication
- Secure multi-user system with JWT tokens (7-day expiry)
- Registration with username, email, password, and password confirmation
- Passwords hashed with bcrypt (10 salt rounds)
- Token validated on every page load via `/api/auth/me`
- Automatic logout on token expiry or invalidation

### Notes
- Create, edit, and delete notes with title, content, category, and tags
- Rich Markdown rendering in view mode (via `react-markdown`)
- Optimistic UI updates — changes appear instantly before the server confirms
- Bulk select mode with multi-delete and confirmation dialog
- Export notes individually or all at once in **JSON**, **Markdown**, or **TXT** format
- Notes are fully isolated per user at the database level (`user_id` column)

### AI Chat
- Conversational interface powered by **Groq API** (Llama 3.3 70B by default)
- Real-time token streaming via Server-Sent Events (SSE)
- **RAG (Retrieval Augmented Generation)**: relevant notes are automatically retrieved and injected into the system prompt, so the AI answers based on your knowledge base
- Relevance scoring: title matches score 3×, tag matches 2×, content matches 1×; top-4 notes are selected
- Falls back to a mock streaming response when no API key is configured
- AI model switchable from Settings (Llama 3.3 70B / Llama 3.1 8B / Mixtral 8x7B)

### Semantic Search
- Quick search modal (Ctrl+K) filters notes by title, content, tags, and category in real time
- Advanced filters in Notes page: category, tags, date range, and sort order
- Dedicated `/api/ai/search` endpoint for AI-powered keyword extraction and relevance ranking

### Dashboard
- At-a-glance stats: total notes, categories, tags, AI queries used
- Category breakdown with color-coded progress bars
- Recent notes list with timestamps
- Quick Add widget to create a note without leaving the dashboard
- Greeting changes based on time of day

### Categories
- Notes are grouped by category automatically
- Per-category statistics: note count, total words, average words per note, last updated date, top tags
- Click any category to filter the Notes page instantly

### Settings
- Switch the AI model used for chat
- View localStorage usage (KB)
- Reset all notes to built-in seed data
- Clear the AI query counter

### PWA & Offline Support
- Installable on desktop and mobile (Add to Home Screen)
- Service worker caches the app shell for offline access
- Notes API responses cached with a StaleWhileRevalidate strategy
- Online/Offline status indicator in the top navigation bar

### UI / UX
- Full glassmorphism design system: frosted glass cards, gradient backgrounds, animated floating orbs
- Smooth page transitions and staggered list animations
- Toast notification system (success, error, info, warning) with auto-dismiss
- Note detail panel as a slide-in drawer with scroll lock
- Portal-rendered dropdowns (bell, avatar) that never get clipped by stacking contexts
- Skeleton loading states for perceived performance
- Fully responsive layout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v3 (JIT) |
| Icons | lucide-react |
| Markdown | react-markdown |
| PWA | vite-plugin-pwa (Workbox) |
| Backend framework | Express.js (Node.js) |
| Database | SQLite via better-sqlite3 |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| AI provider | Groq API (groq-sdk) — SSE streaming |
| Dev proxy | Vite `/api/*` → `localhost:3001` |

---

## Project Structure

```
AI-Knowledge-Base/
├── public/
│   └── icon.svg                  # PWA icon
├── server/
│   ├── package.json              # Backend deps (CommonJS)
│   └── src/
│       ├── index.ts              # Express app entry point
│       ├── database.ts           # SQLite schema + connection
│       ├── types.ts              # Shared server types
│       ├── middleware/
│       │   └── auth.ts           # requireAuth JWT middleware
│       └── routes/
│           ├── auth.ts           # /api/auth (register, login, me)
│           ├── notes.ts          # /api/notes (CRUD)
│           ├── categories.ts     # /api/categories
│           ├── chat.ts           # /api/chat (SSE streaming)
│           └── ai.ts             # /api/ai/search
├── src/
│   ├── App.tsx                   # Root — AuthProvider + AuthGate
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx        # Shell: Sidebar + Navbar + content
│   │   │   ├── Sidebar.tsx       # Navigation, user info, logout
│   │   │   └── Navbar.tsx        # Search, bell, avatar dropdowns
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RecentNotes.tsx
│   │   │   └── AIInsightCard.tsx
│   │   └── ui/
│   │       ├── NoteCard.tsx
│   │       ├── NoteDetailPanel.tsx
│   │       ├── QuickSearchModal.tsx
│   │       ├── HelpModal.tsx
│   │       ├── InstallPrompt.tsx
│   │       ├── ToastContainer.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── GlassCard.tsx
│   │       ├── GlassInput.tsx
│   │       └── EmptyState.tsx
│   ├── context/
│   │   ├── AuthContext.tsx        # Auth state, login, register, logout
│   │   └── ToastContext.tsx       # Global toast notifications
│   ├── hooks/
│   │   ├── useNotes.ts           # CRUD + API-first + localStorage fallback
│   │   ├── useCategories.ts      # Derived category stats
│   │   ├── useSearch.ts          # Debounced search + filters
│   │   ├── useQueryCount.ts      # AI query counter
│   │   ├── useToast.ts           # Toast helpers
│   │   └── useDebounce.ts
│   ├── pages/
│   │   ├── AuthPage.tsx          # Sign In / Sign Up
│   │   ├── Dashboard.tsx
│   │   ├── NotesPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   └── api.ts                # Fetch wrapper (auth header + 401 handling)
│   ├── types/
│   │   └── index.ts              # Note, User, NavPage, etc.
│   └── utils/
│       ├── authStorage.ts        # Token + user in localStorage
│       └── noteStorage.ts        # Notes cache + AI model preference
├── .env                          # GROQ_API_KEY, JWT_SECRET, PORT
├── vite.config.ts                # Vite + PWA plugin + /api proxy
└── tailwind.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Groq API key](https://console.groq.com) (optional — the app works without one in mock mode)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd AI-Knowledge-Base

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Configuration

Create a `.env` file in the project root:

```env
# Required for AI chat (get a free key at console.groq.com)
GROQ_API_KEY=your_groq_api_key_here

# Required for JWT signing — use a long random string
JWT_SECRET=your-secret-key-here

# Optional (default: 3001)
PORT=3001
```

### Running the App

Open two terminals:

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

On first launch you will see the Sign Up screen. Create an account to get started — no email verification required.

### Building for Production

```bash
npm run build        # Builds frontend to /dist
cd server && npm run build  # Compiles backend to /server/dist
```

---

## How It Works

### Authentication Flow

1. User registers → server hashes password with bcrypt, stores user in SQLite, returns a signed JWT
2. JWT is stored in `localStorage` (`aik-token`)
3. On every page load, the frontend sends the token to `GET /api/auth/me` to validate it
4. If valid, the user is hydrated from the response; if invalid or expired, localStorage is cleared and the login screen is shown
5. Every API request includes `Authorization: Bearer <token>`; the server's `requireAuth` middleware verifies it before allowing access
6. All note queries are scoped to `WHERE user_id = req.user.id` — users can never read or write each other's data

### RAG (AI Chat)

1. User sends a message in the Chat page
2. The backend scores all of the user's notes against the query (title: 3×, tags: 2×, content: 1×)
3. The top-4 most relevant notes are formatted and injected as a system prompt
4. The augmented prompt is sent to the Groq API with streaming enabled
5. Tokens are streamed back to the browser via SSE and displayed word by word
6. If `GROQ_API_KEY` is not set, the server simulates streaming with a mock response

### Offline & Sync

- On load, the app tries to fetch notes from the API. If the server is unreachable, it reads from `localStorage` instead
- Every state change is automatically persisted to `localStorage` as a cache
- The PWA service worker caches the app shell, so the UI loads even with no network

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account → returns JWT |
| POST | `/api/auth/login` | — | Sign in → returns JWT |
| GET | `/api/auth/me` | ✓ | Validate token → returns user |
| GET | `/api/notes` | ✓ | List all notes for current user |
| POST | `/api/notes` | ✓ | Create a new note |
| PUT | `/api/notes/:id` | ✓ | Update a note |
| DELETE | `/api/notes/:id` | ✓ | Delete a note |
| GET | `/api/categories` | ✓ | List categories with counts |
| POST | `/api/chat` | ✓ | Stream AI response (SSE) |
| GET | `/api/chat/status` | — | Check if AI is available |
| POST | `/api/ai/search` | ✓ | Keyword-based note search |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Open quick search |
| `Ctrl + /` | Open help modal |
| `Ctrl + N` | Go to Notes page |
| `Escape` | Close any open panel or modal |

---

## License

MIT
