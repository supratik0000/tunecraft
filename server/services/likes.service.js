import { getAll, run } from '../db/connection.js';
import { getTrack } from './tracks.service.js';

export async function listLikes(userId) {
  const rows = await getAll('SELECT track_id FROM likes WHERE user_id = ?', [userId]);
  return rows.map((r) => r.track_id);
}

export async function setLike(userId, trackId, liked) {
  if (!(await getTrack(trackId))) throw new Error('No such track');
  if (liked) {
    await run('INSERT OR IGNORE INTO likes (user_id, track_id) VALUES (?, ?)', [userId, String(trackId)]);
  } else {
    await run('DELETE FROM likes WHERE user_id = ? AND track_id = ?', [userId, String(trackId)]);
  }
  return liked;
}
