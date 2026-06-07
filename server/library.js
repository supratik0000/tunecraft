// ─────────────────────────────────────────────────────────────
//  Library routes — tracks (public), likes & playlists (per user)
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { authRequired } from './auth.js';
import * as store from './store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const uploadsDir = join(__dirname, 'data', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

export const libraryRouter = Router();

const IMAGE_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

// Wrap a handler so thrown errors become clean 400s instead of crashes.
const handle = (fn) => (req, res) => {
  try { fn(req, res); }
  catch (e) { res.status(400).json({ error: e.message || 'Request failed' }); }
};

// ── Tracks (catalog is public; adding requires login) ──
libraryRouter.get('/tracks', handle((req, res) => {
  res.json({ tracks: store.listTracks() });
}));

libraryRouter.post('/tracks', authRequired, handle((req, res) => {
  res.status(201).json({ track: store.addTrack(req.body || {}, req.user.id) });
}));

// Upload custom album art for a track. Body: { dataUrl: "data:image/png;base64,..." }
libraryRouter.post('/tracks/:id/art', authRequired, handle((req, res) => {
  const track = store.getTrack(req.params.id);
  if (!track) throw new Error('No such track');

  const dataUrl = String(req.body?.dataUrl || '');
  const m = dataUrl.match(/^data:([\w/+-]+);base64,(.+)$/);
  if (!m) throw new Error('Send an image as a base64 data URL');
  const ext = IMAGE_EXT[m[1].toLowerCase()];
  if (!ext) throw new Error('Unsupported image type (use PNG, JPEG, WebP, or GIF)');

  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > 3 * 1024 * 1024) throw new Error('Image is too large (max 3 MB)');

  const filename = `${String(track.id).replace(/[^\w-]/g, '')}.${ext}`;
  writeFileSync(join(uploadsDir, filename), buffer);
  const artPath = `/uploads/${filename}`;
  res.json({ track: store.setTrackArt(track.id, artPath) });
}));

// ── Likes ──
libraryRouter.get('/likes', authRequired, handle((req, res) => {
  res.json({ likes: store.listLikes(req.user.id) });
}));

libraryRouter.put('/likes/:trackId', authRequired, handle((req, res) => {
  const liked = req.body?.liked !== false;
  store.setLike(req.user.id, req.params.trackId, liked);
  res.json({ trackId: req.params.trackId, liked });
}));

// ── Playlists ──
libraryRouter.get('/playlists', authRequired, handle((req, res) => {
  res.json({ playlists: store.listPlaylists(req.user.id) });
}));

libraryRouter.post('/playlists', authRequired, handle((req, res) => {
  res.status(201).json({ playlist: store.createPlaylist(req.user.id, req.body?.name) });
}));

libraryRouter.patch('/playlists/:id', authRequired, handle((req, res) => {
  res.json({ playlist: store.renamePlaylist(req.user.id, +req.params.id, req.body?.name) });
}));

libraryRouter.delete('/playlists/:id', authRequired, handle((req, res) => {
  store.deletePlaylist(req.user.id, +req.params.id);
  res.json({ ok: true });
}));

libraryRouter.post('/playlists/:id/tracks', authRequired, handle((req, res) => {
  res.json({ playlist: store.addTrackToPlaylist(req.user.id, +req.params.id, req.body?.trackId) });
}));

libraryRouter.delete('/playlists/:id/tracks/:trackId', authRequired, handle((req, res) => {
  res.json({ playlist: store.removeTrackFromPlaylist(req.user.id, +req.params.id, req.params.trackId) });
}));
