// Database connection — @libsql/client speaks SQLite SQL but works against
// both a local file (for dev) and a hosted Turso database (for production).
// The same code path runs in both modes; only the URL changes.
//
// Local dev:  file:./data/app.db        — a regular SQLite file on disk
// Turso prod: libsql://your-db.turso.io — hosted database + auth token
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { TURSO } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const url = TURSO.url || `file:${join(dataDir, 'app.db')}`;
const authToken = TURSO.token || undefined;

export const db = createClient({ url, authToken });

// ── Query helpers ───────────────────────────────────────────
// Thin wrappers over db.execute so the rest of the codebase reads
// naturally without having to think about Row vs row vs rowsAffected
// every time.

export async function getOne(sql, args = []) {
  const r = await db.execute({ sql, args });
  return r.rows[0];
}

export async function getAll(sql, args = []) {
  const r = await db.execute({ sql, args });
  return r.rows;
}

export async function run(sql, args = []) {
  return db.execute({ sql, args });
}

// Batch of statements inside a write transaction.
// Pass an array of { sql, args } objects.
export async function batchWrite(statements) {
  return db.batch(statements, 'write');
}
