// Tool definitions exposed to the LLM. Each entry maps 1:1 to an executor
// in executors.js. The same neutral form is converted to both Anthropic's
// schema and OpenAI's "function" schema below.
import { GENRES, MOODS } from '../services/meta.js';

export const TOOLS = [
  {
    name: 'list_tracks',
    description: 'List all available tracks (built-in catalog + the user\'s own). Use this to find a track by its name before adding it to a playlist or liking it.',
    input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Optional case-insensitive filter on name, artist, album, or genre.' } } },
  },
  {
    name: 'add_track',
    description: 'Create a new track in the library. Only "name" is required; sensible defaults are chosen for anything omitted.',
    input_schema: {
      type: 'object',
      properties: {
        name:   { type: 'string' },
        artist: { type: 'string' },
        album:  { type: 'string' },
        genre:  { type: 'string', enum: GENRES },
        mood:   { type: 'string', enum: MOODS },
        bpm:    { type: 'number' },
      },
      required: ['name'],
    },
  },
  { name: 'list_playlists',   description: 'List the user\'s playlists with their track counts.', input_schema: { type: 'object', properties: {} } },
  { name: 'create_playlist',  description: 'Create a new empty playlist.', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'rename_playlist',  description: 'Rename an existing playlist, identified by its current name.', input_schema: { type: 'object', properties: { currentName: { type: 'string' }, newName: { type: 'string' } }, required: ['currentName', 'newName'] } },
  { name: 'delete_playlist',  description: 'Delete a playlist by name.', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'add_track_to_playlist',      description: 'Add a track (by track name) to a playlist (by playlist name). The track must already exist — call add_track first if needed.', input_schema: { type: 'object', properties: { playlistName: { type: 'string' }, trackName: { type: 'string' } }, required: ['playlistName', 'trackName'] } },
  { name: 'remove_track_from_playlist', description: 'Remove a track (by name) from a playlist (by name).', input_schema: { type: 'object', properties: { playlistName: { type: 'string' }, trackName: { type: 'string' } }, required: ['playlistName', 'trackName'] } },
  { name: 'set_like', description: 'Like or unlike a track by name.', input_schema: { type: 'object', properties: { trackName: { type: 'string' }, liked: { type: 'boolean' } }, required: ['trackName', 'liked'] } },
];

export const anthropicTools = TOOLS;
export const openaiTools = TOOLS.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}));

// Tools that change persistent state. The route uses this so it can tell
// the client to refresh after a chat that mutated anything.
export const MUTATING = new Set([
  'add_track', 'create_playlist', 'rename_playlist', 'delete_playlist',
  'add_track_to_playlist', 'remove_track_from_playlist', 'set_like',
]);
