import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { handle } from './_helpers.js';
import { listTracks, addTrack } from '../services/tracks.service.js';

export const tracksRouter = Router();

tracksRouter.get('/', handle((req, res) => {
  res.json({ tracks: listTracks() });
}));

tracksRouter.post('/', authRequired, handle((req, res) => {
  res.status(201).json({ track: addTrack(req.body || {}, req.user.id) });
}));
