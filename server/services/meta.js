// Shared enumerations + helpers used by services and the AI tool schema.
export const GENRES = ['pop', 'rock', 'electronic', 'ambient', 'hiphop', 'jazz', 'classical', 'folk', 'bollywood', 'bengali'];
export const COLORS = ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'];
export const MOODS  = ['energetic', 'calm', 'smooth', 'playful', 'melancholy'];
export const KEYS   = ['Am','Cm','Em','Dm','Gm','Bm','Fm','C','D','E','F','G','A','Bb'];
export const AUDIO  = [
  '/audio/song1.mp3','/audio/song2.mp3','/audio/song3.mp3','/audio/song4.mp3',
  '/audio/song5.mp3','/audio/song6.mp3','/audio/song7.mp3','/audio/song8.mp3',
];

// Deterministic-ish picker — same seed string always picks the same item.
// Used so AI-added tracks get sensible varied defaults without random output.
export function pick(arr, seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}
