// ─────────────────────────────────────────────────────────────
//  Store — all data operations in one place.
//  Both the REST routes and the AI agent call these functions, so
//  the agent can never do anything the normal API couldn't.
// ─────────────────────────────────────────────────────────────
import { db } from './db.js';

const GENRES = ['pop', 'rock', 'electronic', 'ambient', 'hiphop', 'jazz', 'classical', 'folk', 'bollywood', 'bengali'];
const COLORS = ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'];
const MOODS  = ['energetic', 'calm', 'smooth', 'playful', 'melancholy'];
const KEYS   = ['Am','Cm','Em','Dm','Gm','Bm','Fm','C','D','E','F','G','A','Bb'];
const AUDIO  = ['/audio/song1.mp3','/audio/song2.mp3','/audio/song3.mp3','/audio/song4.mp3','/audio/song5.mp3','/audio/song6.mp3','/audio/song7.mp3','/audio/song8.mp3'];

// Deterministic-ish picker so AI-added tracks get sensible varied defaults
// without needing the caller to specify everything.
function pick(arr, seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

// ── Tracks ──────────────────────────────────────────────────
export function listTracks() {
  return db.prepare('SELECT * FROM tracks ORDER BY owner_id IS NOT NULL, CAST(id AS INTEGER), id').all();
}

export function getTrack(id) {
  return db.prepare('SELECT * FROM tracks WHERE id = ?').get(String(id));
}

export function findTrackByName(name) {
  return db.prepare('SELECT * FROM tracks WHERE lower(name) = lower(?) LIMIT 1').get(String(name).trim());
}

export function addTrack(input, ownerId = null) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('A track needs a name');
  const artist = String(input.artist || '').trim() || 'Unknown Artist';
  const album  = String(input.album || '').trim() || 'Singles';
  const genre  = GENRES.includes(input.genre) ? input.genre : pick(GENRES, name);
  const id = 'u' + db.prepare('SELECT COALESCE(MAX(rowid),0)+1 AS n FROM tracks').get().n + '-' + Date.now().toString(36);

  const track = {
    id,
    name,
    artist,
    album,
    genre,
    emoji: String(input.emoji || pick(['🎵','🎶','🎸','🎹','🥁','🎷','🎺','🪕','🎻','🎤'], name)),
    color: COLORS.includes(input.color) ? input.color : pick(COLORS, artist),
    bpm: Number.isFinite(+input.bpm) ? Math.max(40, Math.min(220, +input.bpm)) : pick([72, 90, 110, 120, 128, 140], name),
    music_key: KEYS.includes(input.music_key) ? input.music_key : pick(KEYS, name),
    mood: MOODS.includes(input.mood) ? input.mood : pick(MOODS, album),
    duration: Number.isFinite(+input.duration) ? +input.duration : 120 + (name.length * 17) % 120,
    art: input.art ? String(input.art) : null,
    audio: input.audio ? String(input.audio) : pick(AUDIO, name + artist),
    owner_id: ownerId,
  };

  db.prepare(`INSERT INTO tracks (id,name,artist,album,genre,emoji,color,bpm,music_key,mood,duration,art,audio,owner_id)
    VALUES (@id,@name,@artist,@album,@genre,@emoji,@color,@bpm,@music_key,@mood,@duration,@art,@audio,@owner_id)`).run(track);
  return track;
}

export function setTrackArt(trackId, artPath) {
  const r = db.prepare('UPDATE tracks SET art = ? WHERE id = ?').run(artPath, String(trackId));
  if (r.changes === 0) throw new Error('No such track');
  return getTrack(trackId);
}

// ── Likes ───────────────────────────────────────────────────
export function listLikes(userId) {
  return db.prepare('SELECT track_id FROM likes WHERE user_id = ?').all(userId).map((r) => r.track_id);
}

export function setLike(userId, trackId, liked) {
  if (!getTrack(trackId)) throw new Error('No such track');
  if (liked) {
    db.prepare('INSERT OR IGNORE INTO likes (user_id, track_id) VALUES (?, ?)').run(userId, String(trackId));
  } else {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND track_id = ?').run(userId, String(trackId));
  }
  return liked;
}

// ── Playlists ───────────────────────────────────────────────
export function listPlaylists(userId) {
  const rows = db.prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at').all(userId);
  return rows.map((p) => ({
    ...p,
    trackIds: db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at').all(p.id).map((r) => r.track_id),
  }));
}

export function getPlaylist(userId, playlistId) {
  const p = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
  if (!p) return null;
  p.trackIds = db.prepare('SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at').all(p.id).map((r) => r.track_id);
  return p;
}

export function findPlaylistByName(userId, name) {
  const p = db.prepare('SELECT * FROM playlists WHERE user_id = ? AND lower(name) = lower(?) LIMIT 1').get(userId, String(name).trim());
  return p ? getPlaylist(userId, p.id) : null;
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
  const r = db.prepare('UPDATE playlists SET name = ? WHERE id = ? AND user_id = ?').run(name, playlistId, userId);
  if (r.changes === 0) throw new Error('No such playlist');
  return getPlaylist(userId, playlistId);
}

export function deletePlaylist(userId, playlistId) {
  const r = db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?').run(playlistId, userId);
  if (r.changes === 0) throw new Error('No such playlist');
  return true;
}

export function addTrackToPlaylist(userId, playlistId, trackId) {
  const p = db.prepare('SELECT 1 FROM playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
  if (!p) throw new Error('No such playlist');
  if (!getTrack(trackId)) throw new Error('No such track');
  db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)').run(playlistId, String(trackId));
  return getPlaylist(userId, playlistId);
}

export function removeTrackFromPlaylist(userId, playlistId, trackId) {
  const p = db.prepare('SELECT 1 FROM playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
  if (!p) throw new Error('No such playlist');
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlistId, String(trackId));
  return getPlaylist(userId, playlistId);
}

export const META = { GENRES, MOODS };
