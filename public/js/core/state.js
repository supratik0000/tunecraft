// Shared mutable application state. Single source of truth.
// Modules import these directly; everyone reads/writes the same objects.
import { api } from './api.js';

export const state = {
  user: null,
  tracks: [],
  trackById: new Map(),
  likes: new Set(),
  playlists: [],
  queue: [],
  qIdx: -1,
  shuffled: false,
  repeated: false,
  view: { type: 'home' },   // { type: 'home' | 'liked' | 'playlist' | 'genre' | 'search', id?, g?, q? }
  mainGenre: 'all',
  currentRowList: [],
};

export async function loadTracks() {
  const { tracks } = await api('/tracks');
  state.tracks = tracks;
  state.trackById = new Map(tracks.map((t) => [String(t.id), t]));
}
export async function loadLikes() {
  const { likes } = await api('/likes');
  state.likes = new Set(likes.map(String));
}
export async function loadPlaylists() {
  const { playlists } = await api('/playlists');
  state.playlists = playlists;
}
export async function loadEverything() {
  await Promise.all([loadTracks(), loadLikes(), loadPlaylists()]);
}
