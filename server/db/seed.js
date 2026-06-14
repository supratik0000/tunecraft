// Idempotently insert the built-in catalog into the tracks table.
// Runs on every server boot; user-added tracks (owner_id IS NOT NULL) are
// left alone.
import { pathToFileURL } from 'node:url';
import { batchWrite, getAll } from './connection.js';
import { applySchema } from './schema.js';
import { CATALOG } from './catalog.js';

const INSERT_SQL = `
  INSERT INTO tracks (id, name, artist, album, genre, emoji, color, bpm, music_key, mood, duration, audio, owner_id)
  VALUES (:id, :name, :artist, :album, :genre, :emoji, :color, :bpm, :music_key, :mood, :duration, :audio, NULL)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, artist=excluded.artist, album=excluded.album, genre=excluded.genre,
    emoji=excluded.emoji, color=excluded.color, bpm=excluded.bpm, music_key=excluded.music_key,
    mood=excluded.mood, duration=excluded.duration, audio=excluded.audio
  WHERE tracks.owner_id IS NULL
`;

export async function seedCatalog() {
  const catalogIds = new Set(CATALOG.map((r) => r.id));
  const existing = await getAll('SELECT id FROM tracks WHERE owner_id IS NULL');

  const statements = [];
  for (const row of existing) {
    if (!catalogIds.has(row.id)) {
      statements.push({ sql: 'DELETE FROM tracks WHERE id = ?', args: [row.id] });
    }
  }
  for (const r of CATALOG) {
    statements.push({
      sql: INSERT_SQL,
      args: {
        id: r.id, name: r.name, artist: r.artist, album: r.album,
        genre: r.genre, emoji: r.emoji, color: r.color, bpm: r.bpm,
        music_key: r.music_key, mood: r.mood, duration: r.duration,
        audio: r.audio,
      },
    });
  }
  await batchWrite(statements);
  return CATALOG.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await applySchema();
  const n = await seedCatalog();
  console.log(`Seeded ${n} catalog tracks into the database.`);
}
