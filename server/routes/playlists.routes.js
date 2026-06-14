import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { handle } from './_helpers.js';
import {
  listPlaylists, createPlaylist, renamePlaylist, deletePlaylist,
  addTrackToPlaylist, removeTrackFromPlaylist,
} from '../services/playlists.service.js';

export const playlistsRouter = Router();

playlistsRouter.use(authRequired); // every playlist route requires a session

playlistsRouter.get('/', handle((req, res) => {
  res.json({ playlists: listPlaylists(req.user.id) });
}));

playlistsRouter.post('/', handle((req, res) => {
  res.status(201).json({ playlist: createPlaylist(req.user.id, req.body?.name) });
}));

playlistsRouter.patch('/:id', handle((req, res) => {
  res.json({ playlist: renamePlaylist(req.user.id, +req.params.id, req.body?.name) });
}));

playlistsRouter.delete('/:id', handle((req, res) => {
  deletePlaylist(req.user.id, +req.params.id);
  res.json({ ok: true });
}));

playlistsRouter.post('/:id/tracks', handle((req, res) => {
  res.json({ playlist: addTrackToPlaylist(req.user.id, +req.params.id, req.body?.trackId) });
}));

playlistsRouter.delete('/:id/tracks/:trackId', handle((req, res) => {
  res.json({ playlist: removeTrackFromPlaylist(req.user.id, +req.params.id, req.params.trackId) });
}));
