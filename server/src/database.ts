import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/notes.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Users table ───────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// ── Notes table ───────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL DEFAULT '',
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    category   TEXT NOT NULL DEFAULT 'Other',
    tags       TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// ── Schema migration: add user_id if missing (existing DBs) ──────────────────
const notesInfo = db.prepare('PRAGMA table_info(notes)').all() as { name: string }[];
if (!notesInfo.some((col) => col.name === 'user_id')) {
  db.exec(`ALTER TABLE notes ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`);
  console.log('[DB] Migrated notes: added user_id column.');
}
