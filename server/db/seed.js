// Idempotently insert the built-in catalog into the tracks table.
// Runs on every server boot; user-added tracks (owner_id IS NOT NULL) are
// left alone.
import { pathToFileURL } from 'node:url';
import { db, transaction } from './connection.js';
import { applySchema } from './schema.js';
import { CATALOG } from './catalog.js';

export function seedCatalog() {
  const insert = db.prepare(`
    INSERT INTO tracks (id, name, artist, album, genre, emoji, color, bpm, music_key, mood, duration, audio, owner_id)
    VALUES (@id, @name, @artist, @album, @genre, @emoji, @color, @bpm, @music_key, @mood, @duration, @audio, NULL)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, artist=excluded.artist, album=excluded.album, genre=excluded.genre,
      emoji=excluded.emoji, color=excluded.color, bpm=excluded.bpm, music_key=excluded.music_key,
      mood=excluded.mood, duration=excluded.duration, audio=excluded.audio
    WHERE tracks.owner_id IS NULL
  `);
  transaction(() => CATALOG.forEach((r) => insert.run(r)));
  return CATALOG.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  applySchema();
  const n = seedCatalog();
  console.log(`Seeded ${n} catalog tracks into the database.`);
}
