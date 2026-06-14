// Built-in starter catalog. These titles, artists and albums are original.
// The frontend plays a small set of royalty-free SoundHelix MP3s and falls
// back to its Web Audio synthesizer when no file is present, so nothing
// in here is licensed material.
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

  { id:'21', name:'Saanjh Ki Dhun',    artist:'Raagmala',        album:'Shaam-e-Mehfil', genre:'bollywood', emoji:'🌆', color:'c8',  bpm:92,  music_key:'Dm', mood:'smooth'     },
  { id:'22', name:'Chaand Si Raat',    artist:'Sur Sangam',      album:'Chandni',        genre:'bollywood', emoji:'🌙', color:'c4',  bpm:78,  music_key:'Am', mood:'calm'       },
  { id:'23', name:'Dil Ka Rasta',      artist:'Dhun Collective', album:'Safar',          genre:'bollywood', emoji:'❤️', color:'c10', bpm:104, music_key:'G',  mood:'smooth'     },
  { id:'24', name:'Barsaat Ke Geet',   artist:'Megh Malhar',     album:'Saawan',         genre:'bollywood', emoji:'🌧', color:'c9',  bpm:88,  music_key:'Cm', mood:'melancholy' },
  { id:'25', name:'Sapno Ki Udaan',    artist:'Indie Bazaar',    album:'Khwaab',         genre:'bollywood', emoji:'✨', color:'c2',  bpm:120, music_key:'F',  mood:'energetic'  },
  { id:'26', name:'Mausam Badle',      artist:'Saaz Aur Awaaz',  album:'Ritu',           genre:'bollywood', emoji:'🍃', color:'c7',  bpm:100, music_key:'D',  mood:'playful'    },

  { id:'27', name:'Megher Gaan',       artist:'Megh Bela',       album:'Borsha',         genre:'bengali',   emoji:'☁️', color:'c9',  bpm:82,  music_key:'Cm', mood:'calm'       },
  { id:'28', name:'Brishti Bheja',     artist:'Nodi O Surjo',    album:'Aakaash',        genre:'bengali',   emoji:'🌧', color:'c3',  bpm:90,  music_key:'Am', mood:'melancholy' },
  { id:'29', name:'Nodir Pare',        artist:'Surolok',         album:'Bhatiyali',      genre:'bengali',   emoji:'🛶', color:'c5',  bpm:76,  music_key:'G',  mood:'calm'       },
  { id:'30', name:'Sondhya Tara',      artist:'Ektara Ensemble', album:'Gosthi',         genre:'bengali',   emoji:'🌟', color:'c1',  bpm:96,  music_key:'Em', mood:'smooth'     },
  { id:'31', name:'Sonali Bikel',      artist:'Kolkata Sound',   album:'Bikel',          genre:'bengali',   emoji:'🌅', color:'c8',  bpm:108, music_key:'D',  mood:'playful'    },
  { id:'32', name:'Mon Kemoner Gaan',  artist:'Baul Bandhan',    album:'Maati',          genre:'bengali',   emoji:'🪕', color:'c6',  bpm:84,  music_key:'Dm', mood:'melancholy' },
];

for (const t of CATALOG) t.duration = 120 + (parseInt(t.id, 10) * 37) % 120;

const AUDIO_FILES = [
  '/audio/song1.mp3', '/audio/song2.mp3', '/audio/song3.mp3', '/audio/song4.mp3',
  '/audio/song5.mp3', '/audio/song6.mp3', '/audio/song7.mp3', '/audio/song8.mp3',
];
CATALOG.forEach((t, i) => { t.audio = AUDIO_FILES[i % AUDIO_FILES.length]; });
