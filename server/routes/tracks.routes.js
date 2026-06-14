import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { handle } from './_helpers.js';
import { listTracks, addTrack } from '../services/tracks.service.js';

export const tracksRouter = Router();

tracksRouter.get('/', handle(async (req, res) => {
  res.json({ tracks: await listTracks() });
}));

tracksRouter.post('/', authRequired, handle(async (req, res) => {
  res.status(201).json({ track: await addTrack(req.body || {}, req.user.id) });
}));
