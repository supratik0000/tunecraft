// Seed the built-in catalog into the tracks table (idempotent).
// Run with:  npm run seed   (also runs automatically on server start)
import { pathToFileURL } from 'node:url';
import { db, transaction } from './db.js';
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

// Allow running directly: `node seed.js`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = seedCatalog();
  console.log(`Seeded ${n} catalog tracks into the database.`);
}
