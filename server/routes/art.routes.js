// Custom album-art upload. Accepts a base64 data URL in the request body,
// writes the decoded bytes to data/uploads/<trackId>.<ext>, and stores the
// public URL on the track.
import { Router } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { authRequired } from '../auth/middleware.js';
import { handle } from './_helpers.js';
import { getTrack, setTrackArt } from '../services/tracks.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const uploadsDir = join(__dirname, '..', 'data', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const IMAGE_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 3 * 1024 * 1024;

export const artRouter = Router();

artRouter.post('/:id/art', authRequired, handle((req, res) => {
  const track = getTrack(req.params.id);
  if (!track) throw new Error('No such track');

  const dataUrl = String(req.body?.dataUrl || '');
  const m = dataUrl.match(/^data:([\w/+-]+);base64,(.+)$/);
  if (!m) throw new Error('Send an image as a base64 data URL');
  const ext = IMAGE_EXT[m[1].toLowerCase()];
  if (!ext) throw new Error('Unsupported image type (use PNG, JPEG, WebP, or GIF)');

  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > MAX_BYTES) throw new Error('Image is too large (max 3 MB)');

  const filename = `${String(track.id).replace(/[^\w-]/g, '')}.${ext}`;
  writeFileSync(join(uploadsDir, filename), buffer);
  res.json({ track: setTrackArt(track.id, `/uploads/${filename}`) });
}));
