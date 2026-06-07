// ─────────────────────────────────────────────────────────────
//  Built-in track catalog.
//  These are NOT real songs — the frontend synthesizes audio from
//  the bpm / key / mood / genre fields using the Web Audio API,
//  so there is nothing to license or infringe.
// ─────────────────────────────────────────────────────────────
export const CATALOG = [
  { id:'1',  name:'Neon Dreams',        artist:'Synthwave Studio', album:'Retro Future',   genre:'electronic', emoji:'🌆', color:'c1',  bpm:128, music_key:'Am', mood:'energetic'  },
  { id:'2',  name:'Midnight Bloom',     artist:'Luna Waves',       album:'Night Garden',   genre:'ambient',    emoji:'🌸', color:'c5',  bpm:72,  music_key:'Cm', mood:'calm'       },
  { id:'3',  name:'Electric Soul',      artist:'The Voltage',      album:'High Power',     genre:'rock',       emoji:'⚡', color:'c6',  bpm:140, music_key:'Em', mood:'energetic'  },
  { id:'4',  name:'Golden Hour',        artist:'Sunset Trio',      album:'Afternoon Jazz', genre:'jazz',       emoji:'🌅', color:'c8',  bpm:96,  music_key:'Dm', mood:'smooth'     },
  { id:'5',  name:'Pixel Rain',         artist:'8-Bit Ocean',      album:'Digital Tides',  genre:'electronic', emoji:'🎮', color:'c3',  bpm:120, music_key:'Gm', mood:'playful'    },
  { id:'6',  name:'Velvet Underground', artist:'Deep Groove',      album:'Soul Sessions',  genre:'pop',        emoji:'🎤', color:'c2',  bpm:110, music_key:'F',  mood:'smooth'     },
  { id:'7',  name:'Morning Coffee',     artist:'Acoustic Lane',    album:'Simple Things',  genre:'folk',       emoji:'☕', color:'c7',  bpm:85,  music_key:'C',  mood:'calm'       },
  { id:'8',  name:'Bass Drop',          artist:'Club 404',         album:'Floor Fillers',  genre:'electronic', emoji:'🔊', color:'c4',  bpm:145, music_key:'Bm', mood:'energetic'  },
  { id:'9',  name:'Rainy Window',       artist:'The Still Life',   album:'Quiet Hours',    genre:'ambient',    emoji:'🌧', color:'c9',  bpm:60,  music_key:'Am', mood:'melancholy' },
  { id:'10', name:'Street Groove',      artist:'Urban Poets',      album:'City Nights',    genre:'hiphop',     emoji:'🎧', color:'c10', bpm:90,  music_key:'Dm', mood:'smooth'     },
  { id:'11', name:'Silver Strings',     artist:'Quartet No. 5',    album:'Chamber Works',  genre:'classical',  emoji:'🎻', color:'c3',  bpm:80,  music_key:'G',  mood:'calm'       },
  { id:'12', name:'Crash Landing',      artist:'The Voltage',      album:'High Power',     genre:'rock',       emoji:'🚀', color:'c6',  bpm:155, music_key:'E',  mood:'energetic'  },
  { id:'13', name:'Horizon Line',       artist:'Luna Waves',       album:'Night Garden',   genre:'ambient',    emoji:'🌌', color:'c5',  bpm:68,  music_key:'F',  mood:'calm'       },
  { id:'14', name:'Funky Town',         artist:'Groove Machine',   album:'Retro Funk',     genre:'pop',        emoji:'🕺', color:'c2',  bpm:118, music_key:'Bb', mood:'playful'    },
  { id:'15', name:'Deep Blue',          artist:'Oceanic',          album:'Tides',          genre:'ambient',    emoji:'🌊', color:'c9',  bpm:65,  music_key:'Cm', mood:'melancholy' },
  { id:'16', name:'Jazz Cat',           artist:'Sunset Trio',      album:'Late Night',     genre:'jazz',       emoji:'🐱', color:'c8',  bpm:100, music_key:'Fm', mood:'smooth'     },
  { id:'17', name:'Revolution',         artist:'Power Chord',      album:'Stand Up',       genre:'rock',       emoji:'✊', color:'c6',  bpm:138, music_key:'Am', mood:'energetic'  },
  { id:'18', name:'Chill Pill',         artist:'Soft Focus',       album:'Easy Now',       genre:'pop',        emoji:'💊', color:'c2',  bpm:95,  music_key:'D',  mood:'calm'       },
  { id:'19', name:'Forest Walk',        artist:'Acoustic Lane',    album:'Trails',         genre:'folk',       emoji:'🌲', color:'c7',  bpm:78,  music_key:'A',  mood:'calm'       },
  { id:'20', name:'Turbo Charged',      artist:'8-Bit Ocean',      album:'Level Up',       genre:'electronic', emoji:'🏎', color:'c1',  bpm:160, music_key:'Cm', mood:'energetic'  },
];

// Deterministic duration (seconds), same formula the original app used.
for (const t of CATALOG) t.duration = 120 + (parseInt(t.id, 10) * 37) % 120;
