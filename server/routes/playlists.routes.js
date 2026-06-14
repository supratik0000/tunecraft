import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { handle } from './_helpers.js';
import {
  listPlaylists, createPlaylist, renamePlaylist, deletePlaylist,
  addTrackToPlaylist, removeTrackFromPlaylist,
} from '../services/playlists.service.js';

export const playlistsRouter = Router();

playlistsRouter.use(authRequired);

playlistsRouter.get('/', handle(async (req, res) => {
  res.json({ playlists: await listPlaylists(req.user.id) });
}));

playlistsRouter.post('/', handle(async (req, res) => {
  res.status(201).json({ playlist: await createPlaylist(req.user.id, req.body?.name) });
}));

playlistsRouter.patch('/:id', handle(async (req, res) => {
  res.json({ playlist: await renamePlaylist(req.user.id, +req.params.id, req.body?.name) });
}));

playlistsRouter.delete('/:id', handle(async (req, res) => {
  await deletePlaylist(req.user.id, +req.params.id);
  res.json({ ok: true });
}));

playlistsRouter.post('/:id/tracks', handle(async (req, res) => {
  res.json({ playlist: await addTrackToPlaylist(req.user.id, +req.params.id, req.body?.trackId) });
}));

playlistsRouter.delete('/:id/tracks/:trackId', handle(async (req, res) => {
  res.json({ playlist: await removeTrackFromPlaylist(req.user.id, +req.params.id, req.params.trackId) });
}));
