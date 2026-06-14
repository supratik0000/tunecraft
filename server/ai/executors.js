// Each LLM tool name maps to one of these functions. They all take the
// signed-in user's id, so the agent can never do anything that user
// couldn't do themselves through the REST API.
import * as tracks    from '../services/tracks.service.js';
import * as likes     from '../services/likes.service.js';
import * as playlists from '../services/playlists.service.js';

async function resolvePlaylist(userId, name) {
  const p = await playlists.findPlaylistByName(userId, name);
  if (!p) {
    const list = await playlists.listPlaylists(userId);
    const existing = list.map((x) => x.name).join(', ') || '(none)';
    throw new Error(`No playlist named "${name}". Existing: ${existing}`);
  }
  return p;
}

async function resolveTrack(name) {
  const t = await tracks.findTrackByName(name);
  if (!t) throw new Error(`No track named "${name}". Add it first with add_track, or call list_tracks to see options.`);
  return t;
}

const EXECUTORS = {
  async list_tracks(userId, { query }) {
    let list = await tracks.listTracks();
    if (query) {
      const q = String(query).toLowerCase();
      list = list.filter((t) => [t.name, t.artist, t.album, t.genre].some((f) => String(f).toLowerCase().includes(q)));
    }
    return { count: list.length, tracks: list.slice(0, 60).map((t) => ({ name: t.name, artist: t.artist, genre: t.genre })) };
  },
  async add_track(userId, input) {
    const t = await tracks.addTrack(input, userId);
    return { added: { name: t.name, artist: t.artist, genre: t.genre } };
  },
  async list_playlists(userId) {
    const list = await playlists.listPlaylists(userId);
    return { playlists: list.map((p) => ({ name: p.name, trackCount: p.trackIds.length })) };
  },
  async create_playlist(userId, { name }) {
    const p = await playlists.createPlaylist(userId, name);
    return { created: p.name };
  },
  async rename_playlist(userId, { currentName, newName }) {
    const p = await resolvePlaylist(userId, currentName);
    const renamed = await playlists.renamePlaylist(userId, p.id, newName);
    return { renamed: renamed.name };
  },
  async delete_playlist(userId, { name }) {
    const p = await resolvePlaylist(userId, name);
    await playlists.deletePlaylist(userId, p.id);
    return { deleted: name };
  },
  async add_track_to_playlist(userId, { playlistName, trackName }) {
    const p = await resolvePlaylist(userId, playlistName);
    const t = await resolveTrack(trackName);
    await playlists.addTrackToPlaylist(userId, p.id, t.id);
    return { added: t.name, to: p.name };
  },
  async remove_track_from_playlist(userId, { playlistName, trackName }) {
    const p = await resolvePlaylist(userId, playlistName);
    const t = await resolveTrack(trackName);
    await playlists.removeTrackFromPlaylist(userId, p.id, t.id);
    return { removed: t.name, from: p.name };
  },
  async set_like(userId, { trackName, liked }) {
    const t = await resolveTrack(trackName);
    await likes.setLike(userId, t.id, !!liked);
    return { track: t.name, liked: !!liked };
  },
};

export async function runTool(userId, name, args) {
  if (!EXECUTORS[name]) return { error: `Unknown tool ${name}` };
  try { return await EXECUTORS[name](userId, args || {}); }
  catch (e) { return { error: e.message }; }
}
