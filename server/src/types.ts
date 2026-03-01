import type { Request } from 'express';

// Row shape as stored in SQLite
export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string;          // JSON-encoded string[]
  created_at: string;    // ISO string
  updated_at: string;    // ISO string
}

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password: string;      // bcrypt hash
  created_at: string;
}

// Authenticated request — req.user is set by requireAuth middleware
export interface AuthenticatedRequest extends Request {
  user: { id: string; username: string; email: string };
}

// Request bodies
export interface CreateNoteBody {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

export interface UpdateNoteBody {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}
