// Downloads the royalty-free demo songs used by the player into
// public/audio/. Run with:  npm run fetch-audio
// These are SoundHelix example songs (algorithmically generated, free to use).
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', '..', 'public', 'audio');
mkdirSync(outDir, { recursive: true });

const COUNT = 8;
const url = (i) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i}.mp3`;

let downloaded = 0, skipped = 0;
for (let i = 1; i <= COUNT; i++) {
  const dest = join(outDir, `song${i}.mp3`);
  if (existsSync(dest)) { skipped++; console.log(`song${i}.mp3 already present — skipping`); continue; }
  process.stdout.write(`Downloading song${i}.mp3 ... `);
  try {
    const res = await fetch(url(i));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    downloaded++;
    console.log(`done (${(buf.length / 1e6).toFixed(1)} MB)`);
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
  }
}
console.log(`\nFinished. ${downloaded} downloaded, ${skipped} already present, in ${outDir}`);
