// Schema definition + lightweight in-place migrations.
// Runs once on server boot from index.js.
import { db } from './connection.js';

export function applySchema() {
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
      owner_id  INTEGER,
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

  ensureColumn('tracks', 'art',   'TEXT');
  ensureColumn('tracks', 'audio', 'TEXT');
}

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
