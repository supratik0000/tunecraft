// ─────────────────────────────────────────────────────────────
//  Tunecraft API server
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { seedCatalog } from './seed.js';
import { authRouter } from './auth.js';
import { libraryRouter, uploadsDir } from './library.js';
import { agentRouter, aiStatus } from './agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// Make sure the built-in catalog is present on every boot.
const seeded = seedCatalog();

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' })); // generous limit so base64 album-art fits

// Uploaded album art
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRouter);
app.use('/api', libraryRouter);
app.use('/api/agent', agentRouter);
app.get('/api/health', (req, res) => res.json({ ok: true, tracks: seeded }));

// Serve the frontend (../public) so one server runs the whole app.
const publicDir = join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  const ai = aiStatus();
  console.log(`\n  🎵 Tunecraft running at http://localhost:${PORT}`);
  console.log(`     API health:  http://localhost:${PORT}/api/health`);
  console.log(`     AI assistant: ${ai.enabled
    ? `enabled (${ai.name} · ${ai.model})`
    : `disabled (set a free ${ai.name} key as ${ai.keyEnv} in server/.env)`}\n`);
});
