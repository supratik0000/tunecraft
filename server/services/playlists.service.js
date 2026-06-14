import { db } from '../db/connection.js';
import { getTrack } from './tracks.service.js';

function attachTrackIds(p) {
  p.trackIds = db.prepare(
    'SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at'
  ).all(p.id).map((r) => r.track_id);
  return p;
}

export function listPlaylists(userId) {
  const rows = db.prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at').all(userId);
  return rows.map(attachTrackIds);
}

export function getPlaylist(userId, playlistId) {
  const p = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
  return p ? attachTrackIds(p) : null;
}

export function findPlaylistByName(userId, name) {
  const p = db.prepare('SELECT * FROM playlists WHERE user_id = ? AND lower(name) = lower(?) LIMIT 1')
    .get(userId, String(name).trim());
  return p ? attachTrackIds(p) : null;
}

export function createPlaylist(userId, name) {
  name = String(name || '').trim();
  if (!name) throw new Error('A playlist needs a name');
  const info = db.prepare('INSERT INTO playlists (user_id, name) VALUES (?, ?)').run(userId, name);
  return getPlaylist(userId, Number(info.lastInsertRowid));
}

export function renamePlaylist(userId, playlistId, name) {
  name = String(name || '').trim();
  if (!name) throw new Error('A playlist needs a name');
  const r = db.prepare('UPDATE playlists SET name = ? WHERE id = ? AND user_id = ?')
    .run(name, playlistId, userId);
  if (r.changes === 0) throw new Error('No such playlist');
  return getPlaylist(userId, playlistId);
}

export function deletePlaylist(userId, playlistId) {
  const r = db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?').run(playlistId, userId);
  if (r.changes === 0) throw new Error('No such playlist');
  return true;
}

function assertOwnedPlaylist(userId, playlistId) {
  const ok = db.prepare('SELECT 1 FROM playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
  if (!ok) throw new Error('No such playlist');
}

export function addTrackToPlaylist(userId, playlistId, trackId) {
  assertOwnedPlaylist(userId, playlistId);
  if (!getTrack(trackId)) throw new Error('No such track');
  db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)')
    .run(playlistId, String(trackId));
  return getPlaylist(userId, playlistId);
}

export function removeTrackFromPlaylist(userId, playlistId, trackId) {
  assertOwnedPlaylist(userId, playlistId);
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?')
    .run(playlistId, String(trackId));
  return getPlaylist(userId, playlistId);
}
