// ─────────────────────────────────────────────────────────────
//  Database layer — SQLite via Node's built-in node:sqlite module
//  (no native compilation needed). The whole database lives in one
//  file: data/app.db
// ─────────────────────────────────────────────────────────────
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, 'app.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Small transaction helper (node:sqlite has no .transaction() wrapper).
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// ── Schema ──────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    display_name  TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    artist    TEXT NOT NULL,
    album     TEXT NOT NULL,
    genre     TEXT NOT NULL,
    emoji     TEXT NOT NULL DEFAULT '🎵',
    color     TEXT NOT NULL DEFAULT 'c1',
    bpm       INTEGER NOT NULL DEFAULT 110,
    music_key TEXT NOT NULL DEFAULT 'Am',
    mood      TEXT NOT NULL DEFAULT 'smooth',
    duration  INTEGER NOT NULL DEFAULT 180,
    owner_id  INTEGER,                         -- NULL = built-in catalog track
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INTEGER NOT NULL,
    track_id    TEXT    NOT NULL,
    added_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id)    REFERENCES tracks(id)    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id   INTEGER NOT NULL,
    track_id  TEXT    NOT NULL,
    liked_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );
`);

// ── Lightweight migrations (add columns to existing databases) ──
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
ensureColumn('tracks', 'art', 'TEXT');   // custom album-art URL (uploaded image)
ensureColumn('tracks', 'audio', 'TEXT'); // audio file URL (real music); NULL = use synthesizer

export default db;
