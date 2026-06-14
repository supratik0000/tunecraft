import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { handle } from './_helpers.js';
import { listLikes, setLike } from '../services/likes.service.js';

export const likesRouter = Router();

likesRouter.get('/', authRequired, handle(async (req, res) => {
  res.json({ likes: await listLikes(req.user.id) });
}));

likesRouter.put('/:trackId', authRequired, handle(async (req, res) => {
  const liked = req.body?.liked !== false;
  await setLike(req.user.id, req.params.trackId, liked);
  res.json({ trackId: req.params.trackId, liked });
}));
