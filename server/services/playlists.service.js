import { getOne, getAll, run } from '../db/connection.js';
import { getTrack } from './tracks.service.js';

async function attachTrackIds(p) {
  const rows = await getAll(
    'SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at',
    [p.id],
  );
  p.trackIds = rows.map((r) => r.track_id);
  return p;
}

export async function listPlaylists(userId) {
  const rows = await getAll('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at', [userId]);
  return Promise.all(rows.map(attachTrackIds));
}

export async function getPlaylist(userId, playlistId) {
  const p = await getOne('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [playlistId, userId]);
  return p ? attachTrackIds(p) : null;
}

export async function findPlaylistByName(userId, name) {
  const p = await getOne(
    'SELECT * FROM playlists WHERE user_id = ? AND lower(name) = lower(?) LIMIT 1',
    [userId, String(name).trim()],
  );
  return p ? attachTrackIds(p) : null;
}

export async function createPlaylist(userId, name) {
  name = String(name || '').trim();
  if (!name) throw new Error('A playlist needs a name');
  const info = await run('INSERT INTO playlists (user_id, name) VALUES (?, ?)', [userId, name]);
  return getPlaylist(userId, Number(info.lastInsertRowid));
}

export async function renamePlaylist(userId, playlistId, name) {
  name = String(name || '').trim();
  if (!name) throw new Error('A playlist needs a name');
  const r = await run(
    'UPDATE playlists SET name = ? WHERE id = ? AND user_id = ?',
    [name, playlistId, userId],
  );
  if (r.rowsAffected === 0) throw new Error('No such playlist');
  return getPlaylist(userId, playlistId);
}

export async function deletePlaylist(userId, playlistId) {
  const r = await run('DELETE FROM playlists WHERE id = ? AND user_id = ?', [playlistId, userId]);
  if (r.rowsAffected === 0) throw new Error('No such playlist');
  return true;
}

async function assertOwnedPlaylist(userId, playlistId) {
  const ok = await getOne('SELECT 1 FROM playlists WHERE id = ? AND user_id = ?', [playlistId, userId]);
  if (!ok) throw new Error('No such playlist');
}

export async function addTrackToPlaylist(userId, playlistId, trackId) {
  await assertOwnedPlaylist(userId, playlistId);
  if (!(await getTrack(trackId))) throw new Error('No such track');
  await run(
    'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)',
    [playlistId, String(trackId)],
  );
  return getPlaylist(userId, playlistId);
}

export async function removeTrackFromPlaylist(userId, playlistId, trackId) {
  await assertOwnedPlaylist(userId, playlistId);
  await run(
    'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
    [playlistId, String(trackId)],
  );
  return getPlaylist(userId, playlistId);
}
