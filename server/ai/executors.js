// Each LLM tool name maps to one of these functions. They all take the
// signed-in user's id, so the agent can never do anything that user couldn't
// do themselves through the REST API.
import * as tracks    from '../services/tracks.service.js';
import * as likes     from '../services/likes.service.js';
import * as playlists from '../services/playlists.service.js';

function resolvePlaylist(userId, name) {
  const p = playlists.findPlaylistByName(userId, name);
  if (!p) {
    const existing = playlists.listPlaylists(userId).map((x) => x.name).join(', ') || '(none)';
    throw new Error(`No playlist named "${name}". Existing: ${existing}`);
  }
  return p;
}
function resolveTrack(name) {
  const t = tracks.findTrackByName(name);
  if (!t) throw new Error(`No track named "${name}". Add it first with add_track, or call list_tracks to see options.`);
  return t;
}

const EXECUTORS = {
  list_tracks(userId, { query }) {
    let list = tracks.listTracks();
    if (query) {
      const q = String(query).toLowerCase();
      list = list.filter((t) => [t.name, t.artist, t.album, t.genre].some((f) => String(f).toLowerCase().includes(q)));
    }
    return { count: list.length, tracks: list.slice(0, 60).map((t) => ({ name: t.name, artist: t.artist, genre: t.genre })) };
  },
  add_track(userId, input) {
    const t = tracks.addTrack(input, userId);
    return { added: { name: t.name, artist: t.artist, genre: t.genre } };
  },
  list_playlists(userId) {
    return { playlists: playlists.listPlaylists(userId).map((p) => ({ name: p.name, trackCount: p.trackIds.length })) };
  },
  create_playlist(userId, { name }) {
    return { created: playlists.createPlaylist(userId, name).name };
  },
  rename_playlist(userId, { currentName, newName }) {
    const p = resolvePlaylist(userId, currentName);
    return { renamed: playlists.renamePlaylist(userId, p.id, newName).name };
  },
  delete_playlist(userId, { name }) {
    const p = resolvePlaylist(userId, name);
    playlists.deletePlaylist(userId, p.id);
    return { deleted: name };
  },
  add_track_to_playlist(userId, { playlistName, trackName }) {
    const p = resolvePlaylist(userId, playlistName);
    const t = resolveTrack(trackName);
    playlists.addTrackToPlaylist(userId, p.id, t.id);
    return { added: t.name, to: p.name };
  },
  remove_track_from_playlist(userId, { playlistName, trackName }) {
    const p = resolvePlaylist(userId, playlistName);
    const t = resolveTrack(trackName);
    playlists.removeTrackFromPlaylist(userId, p.id, t.id);
    return { removed: t.name, from: p.name };
  },
  set_like(userId, { trackName, liked }) {
    const t = resolveTrack(trackName);
    likes.setLike(userId, t.id, !!liked);
    return { track: t.name, liked: !!liked };
  },
};

export function runTool(userId, name, args) {
  if (!EXECUTORS[name]) return { error: `Unknown tool ${name}` };
  try { return EXECUTORS[name](userId, args || {}); }
  catch (e) { return { error: e.message }; }
}
