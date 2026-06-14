// ─────────────────────────────────────────────────────────────
//  Tunecraft API server — entry point only. Each concern lives
//  in its own folder; this file just wires them up.
// ─────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PORT } from './config/env.js';
import { applySchema }   from './db/schema.js';
import { seedCatalog }   from './db/seed.js';

import { authRouter }       from './auth/routes.js';
import { tracksRouter }     from './routes/tracks.routes.js';
import { artRouter }        from './routes/art.routes.js';
import { likesRouter }      from './routes/likes.routes.js';
import { playlistsRouter }  from './routes/playlists.routes.js';
import { healthRouter }     from './routes/health.routes.js';
import { uploadsDir }       from './routes/art.routes.js';

import { agentRouter }      from './ai/routes.js';
import { aiStatus }         from './ai/providers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

await applySchema();
const seeded = await seedCatalog();

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));

// Static — uploaded album art
app.use('/uploads', express.static(uploadsDir));

// API
app.use('/api/auth',      authRouter);
app.use('/api/tracks',    tracksRouter);
app.use('/api/tracks',    artRouter);        // /api/tracks/:id/art
app.use('/api/likes',     likesRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/agent',     agentRouter);
app.use('/api/health',    healthRouter(seeded));

// Frontend (the same server hosts the SPA so there is one process to run)
const publicDir = join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  const ai = aiStatus();
  console.log(`\n  Tunecraft running at http://localhost:${PORT}`);
  console.log(`     API health:  http://localhost:${PORT}/api/health`);
  console.log(`     AI assistant: ${ai.enabled
    ? `enabled (${ai.name} · ${ai.model})`
    : `disabled (set a free ${ai.name} key as ${ai.keyEnv} in server/.env)`}\n`);
});
