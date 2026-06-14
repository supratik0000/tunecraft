// All track-level data operations. Used by both the REST routes and the
// AI agent, so they share identical behaviour.
import { db } from '../db/connection.js';
import { GENRES, COLORS, MOODS, KEYS, AUDIO, pick } from './meta.js';

export function listTracks() {
  return db.prepare(
    'SELECT * FROM tracks ORDER BY owner_id IS NOT NULL, CAST(id AS INTEGER), id'
  ).all();
}

export function getTrack(id) {
  return db.prepare('SELECT * FROM tracks WHERE id = ?').get(String(id));
}

export function findTrackByName(name) {
  return db.prepare('SELECT * FROM tracks WHERE lower(name) = lower(?) LIMIT 1')
    .get(String(name).trim());
}

export function addTrack(input, ownerId = null) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('A track needs a name');
  const artist = String(input.artist || '').trim() || 'Unknown Artist';
  const album  = String(input.album  || '').trim() || 'Singles';
  const genre  = GENRES.includes(input.genre) ? input.genre : pick(GENRES, name);
  const id = 'u' + db.prepare('SELECT COALESCE(MAX(rowid),0)+1 AS n FROM tracks').get().n
                + '-' + Date.now().toString(36);

  const track = {
    id,
    name,
    artist,
    album,
    genre,
    emoji:     String(input.emoji || pick(['🎵','🎶','🎸','🎹','🥁','🎷','🎺','🪕','🎻','🎤'], name)),
    color:     COLORS.includes(input.color) ? input.color : pick(COLORS, artist),
    bpm:       Number.isFinite(+input.bpm)      ? Math.max(40, Math.min(220, +input.bpm)) : pick([72, 90, 110, 120, 128, 140], name),
    music_key: KEYS.includes(input.music_key)   ? input.music_key : pick(KEYS, name),
    mood:      MOODS.includes(input.mood)       ? input.mood      : pick(MOODS, album),
    duration:  Number.isFinite(+input.duration) ? +input.duration : 120 + (name.length * 17) % 120,
    art:       input.art   ? String(input.art)   : null,
    audio:     input.audio ? String(input.audio) : pick(AUDIO, name + artist),
    owner_id:  ownerId,
  };

  db.prepare(`INSERT INTO tracks
    (id,name,artist,album,genre,emoji,color,bpm,music_key,mood,duration,art,audio,owner_id)
    VALUES
    (@id,@name,@artist,@album,@genre,@emoji,@color,@bpm,@music_key,@mood,@duration,@art,@audio,@owner_id)`)
    .run(track);
  return track;
}

export function setTrackArt(trackId, artPath) {
  const r = db.prepare('UPDATE tracks SET art = ? WHERE id = ?').run(artPath, String(trackId));
  if (r.changes === 0) throw new Error('No such track');
  return getTrack(trackId);
}
