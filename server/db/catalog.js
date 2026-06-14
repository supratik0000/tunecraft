// Built-in starter catalog — 30 tracks split evenly across English,
// Hindi/Bollywood-style, and Bengali-style. All titles, artists, and
// albums are ORIGINAL to Tunecraft. Audio comes from SoundHelix's
// freely-usable algorithmic demo songs (17 distinct tracks), assigned
// to each catalog entry so the audio variety roughly matches the
// genre/mood of the metadata.
//
// To use your own MP3 for any track:
//   1. Drop the file in public/audio/ (e.g. public/audio/my-song.mp3)
//   2. Change that track's `audio:` value below to '/audio/my-song.mp3'

export const CATALOG = [
  // ── English (10) ────────────────────────────────────────────────────
  { id:'e1',  name:'Neon Dreams',        artist:'Synthwave Studio', album:'Retro Future',   genre:'electronic', emoji:'🌆', color:'c1',  bpm:128, music_key:'Am', mood:'energetic',  audio:'/audio/song1.mp3'  },
  { id:'e2',  name:'Midnight Bloom',     artist:'Luna Waves',       album:'Night Garden',   genre:'ambient',    emoji:'🌸', color:'c5',  bpm:72,  music_key:'Cm', mood:'calm',       audio:'/audio/song13.mp3' },
  { id:'e3',  name:'Electric Soul',      artist:'The Voltage',      album:'High Power',     genre:'rock',       emoji:'⚡', color:'c6',  bpm:140, music_key:'Em', mood:'energetic',  audio:'/audio/song3.mp3'  },
  { id:'e4',  name:'Golden Hour',        artist:'Sunset Trio',      album:'Afternoon Jazz', genre:'jazz',       emoji:'🌅', color:'c8',  bpm:96,  music_key:'Dm', mood:'smooth',     audio:'/audio/song4.mp3'  },
  { id:'e5',  name:'Pixel Rain',         artist:'8-Bit Ocean',      album:'Digital Tides',  genre:'electronic', emoji:'🎮', color:'c3',  bpm:120, music_key:'Gm', mood:'playful',    audio:'/audio/song5.mp3'  },
  { id:'e6',  name:'Velvet Underground', artist:'Deep Groove',      album:'Soul Sessions',  genre:'pop',        emoji:'🎤', color:'c2',  bpm:110, music_key:'F',  mood:'smooth',     audio:'/audio/song6.mp3'  },
  { id:'e7',  name:'Morning Coffee',     artist:'Acoustic Lane',    album:'Simple Things',  genre:'folk',       emoji:'☕', color:'c7',  bpm:85,  music_key:'C',  mood:'calm',       audio:'/audio/song7.mp3'  },
  { id:'e8',  name:'Bass Drop',          artist:'Club 404',         album:'Floor Fillers',  genre:'electronic', emoji:'🔊', color:'c4',  bpm:145, music_key:'Bm', mood:'energetic',  audio:'/audio/song8.mp3'  },
  { id:'e9',  name:'Turbo Charged',      artist:'8-Bit Ocean',      album:'Level Up',       genre:'electronic', emoji:'🏎', color:'c1',  bpm:160, music_key:'Cm', mood:'energetic',  audio:'/audio/song12.mp3' },
  { id:'e10', name:'Silver Strings',     artist:'Quartet No. 5',    album:'Chamber Works',  genre:'classical',  emoji:'🎻', color:'c3',  bpm:80,  music_key:'G',  mood:'calm',       audio:'/audio/song11.mp3' },

  // ── Hindi / Bollywood-style (10) — original titles, romanised ──────
  { id:'h1',  name:'Saanjh Ki Dhun',     artist:'Raagmala',         album:'Shaam-e-Mehfil', genre:'bollywood', emoji:'🌆', color:'c8',  bpm:92,  music_key:'Dm', mood:'smooth',     audio:'/audio/song2.mp3'  },
  { id:'h2',  name:'Chaand Si Raat',     artist:'Sur Sangam',       album:'Chandni',        genre:'bollywood', emoji:'🌙', color:'c4',  bpm:78,  music_key:'Am', mood:'calm',       audio:'/audio/song9.mp3'  },
  { id:'h3',  name:'Dil Ka Rasta',       artist:'Dhun Collective',  album:'Safar',          genre:'bollywood', emoji:'❤️', color:'c10', bpm:104, music_key:'G',  mood:'smooth',     audio:'/audio/song10.mp3' },
  { id:'h4',  name:'Barsaat Ke Geet',    artist:'Megh Malhar',      album:'Saawan',         genre:'bollywood', emoji:'🌧', color:'c9',  bpm:88,  music_key:'Cm', mood:'melancholy', audio:'/audio/song14.mp3' },
  { id:'h5',  name:'Sapno Ki Udaan',     artist:'Indie Bazaar',     album:'Khwaab',         genre:'bollywood', emoji:'✨', color:'c2',  bpm:120, music_key:'F',  mood:'energetic',  audio:'/audio/song5.mp3'  },
  { id:'h6',  name:'Mausam Badle',       artist:'Saaz Aur Awaaz',   album:'Ritu',           genre:'bollywood', emoji:'🍃', color:'c7',  bpm:100, music_key:'D',  mood:'playful',    audio:'/audio/song15.mp3' },
  { id:'h7',  name:'Jaadu Hai Tujhmein', artist:'Raagmala',         album:'Shaam-e-Mehfil', genre:'bollywood', emoji:'🪔', color:'c10', bpm:96,  music_key:'Em', mood:'smooth',     audio:'/audio/song16.mp3' },
  { id:'h8',  name:'Sitaaron Ki Mehfil', artist:'Sur Sangam',       album:'Chandni',        genre:'bollywood', emoji:'⭐', color:'c4',  bpm:84,  music_key:'Am', mood:'calm',       audio:'/audio/song17.mp3' },
  { id:'h9',  name:'Naya Safar',         artist:'Indie Bazaar',     album:'Khwaab',         genre:'bollywood', emoji:'🛤', color:'c2',  bpm:118, music_key:'D',  mood:'energetic',  audio:'/audio/song1.mp3'  },
  { id:'h10', name:'Tere Bina',          artist:'Dhun Collective',  album:'Safar',          genre:'bollywood', emoji:'💫', color:'c10', bpm:90,  music_key:'Cm', mood:'melancholy', audio:'/audio/song9.mp3'  },

  // ── Bengali (10) — original titles, romanised ──────────────────────
  { id:'b1',  name:'Megher Gaan',        artist:'Megh Bela',        album:'Borsha',         genre:'bengali',   emoji:'☁️', color:'c9',  bpm:82,  music_key:'Cm', mood:'calm',       audio:'/audio/song13.mp3' },
  { id:'b2',  name:'Brishti Bheja',      artist:'Nodi O Surjo',     album:'Aakaash',        genre:'bengali',   emoji:'🌧', color:'c3',  bpm:90,  music_key:'Am', mood:'melancholy', audio:'/audio/song14.mp3' },
  { id:'b3',  name:'Nodir Pare',         artist:'Surolok',          album:'Bhatiyali',      genre:'bengali',   emoji:'🛶', color:'c5',  bpm:76,  music_key:'G',  mood:'calm',       audio:'/audio/song15.mp3' },
  { id:'b4',  name:'Sondhya Tara',       artist:'Ektara Ensemble',  album:'Gosthi',         genre:'bengali',   emoji:'🌟', color:'c1',  bpm:96,  music_key:'Em', mood:'smooth',     audio:'/audio/song16.mp3' },
  { id:'b5',  name:'Sonali Bikel',       artist:'Kolkata Sound',    album:'Bikel',          genre:'bengali',   emoji:'🌅', color:'c8',  bpm:108, music_key:'D',  mood:'playful',    audio:'/audio/song17.mp3' },
  { id:'b6',  name:'Mon Kemoner Gaan',   artist:'Baul Bandhan',     album:'Maati',          genre:'bengali',   emoji:'🪕', color:'c6',  bpm:84,  music_key:'Dm', mood:'melancholy', audio:'/audio/song11.mp3' },
  { id:'b7',  name:'Aakaash Pari',       artist:'Surolok',          album:'Bhatiyali',      genre:'bengali',   emoji:'🦋', color:'c5',  bpm:88,  music_key:'F',  mood:'calm',       audio:'/audio/song7.mp3'  },
  { id:'b8',  name:'Phuler Bagaan',      artist:'Ektara Ensemble',  album:'Gosthi',         genre:'bengali',   emoji:'🌺', color:'c1',  bpm:100, music_key:'D',  mood:'smooth',     audio:'/audio/song4.mp3'  },
  { id:'b9',  name:'Jhumur Taal',        artist:'Baul Bandhan',     album:'Maati',          genre:'bengali',   emoji:'🥁', color:'c6',  bpm:112, music_key:'Em', mood:'playful',    audio:'/audio/song6.mp3'  },
  { id:'b10', name:'Sromer Gaan',        artist:'Kolkata Sound',    album:'Bikel',          genre:'bengali',   emoji:'🌾', color:'c8',  bpm:80,  music_key:'Am', mood:'melancholy', audio:'/audio/song2.mp3'  },
];

// Deterministic duration so each track shows a reasonable length even
// before the browser has loaded the file. The real duration takes over
// from the audio element once playback starts.
let _idx = 0;
for (const t of CATALOG) {
  _idx++;
  t.duration = 120 + (_idx * 37) % 120;
}
