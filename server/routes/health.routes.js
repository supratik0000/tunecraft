import { Router } from 'express';

export function healthRouter(seededTrackCount) {
  const r = Router();
  r.get('/', (req, res) => res.json({ ok: true, tracks: seededTrackCount }));
  return r;
}
