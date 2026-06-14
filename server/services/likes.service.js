import { db } from '../db/connection.js';
import { getTrack } from './tracks.service.js';

export function listLikes(userId) {
  return db.prepare('SELECT track_id FROM likes WHERE user_id = ?')
    .all(userId)
    .map((r) => r.track_id);
}

export function setLike(userId, trackId, liked) {
  if (!getTrack(trackId)) throw new Error('No such track');
  if (liked) {
    db.prepare('INSERT OR IGNORE INTO likes (user_id, track_id) VALUES (?, ?)')
      .run(userId, String(trackId));
  } else {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND track_id = ?')
      .run(userId, String(trackId));
  }
  return liked;
}
