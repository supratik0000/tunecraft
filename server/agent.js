// ─────────────────────────────────────────────────────────────
//  AI agent — natural-language control of the music library.
//
//  Provider-agnostic: works with any free (or paid) LLM that
//  supports tool/function calling. Default is Groq (fast + free).
//  Pick a provider in .env via AI_PROVIDER. Every tool maps to a
//  store function scoped to the signed-in user, so the agent can
//  only do what the user could do themselves through the UI.
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { authRequired } from './auth.js';
import * as store from './store.js';

// ── Provider registry ───────────────────────────────────────
// kind 'openai' = any OpenAI-compatible HTTP API (Groq, Gemini's
// compatibility endpoint, OpenRouter, Together, Ollama, OpenAI…).
const PROVIDERS = {
  groq:       { kind: 'openai', baseURL: 'https://api.groq.com/openai/v1',                         model: 'llama-3.3-70b-versatile',              keyEnv: 'GROQ_API_KEY' },
  gemini:     { kind: 'openai', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-2.0-flash',                   keyEnv: 'GEMINI_API_KEY' },
  openrouter: { kind: 'openai', baseURL: 'https://openrouter.ai/api/v1',                           model: 'meta-llama/llama-3.3-70b-instruct:free', keyEnv: 'OPENROUTER_API_KEY' },
  ollama:     { kind: 'openai', baseURL: 'http://localhost:11434/v1',                              model: 'llama3.1',                             keyEnv: null /* local, no key */ },
  openai:     { kind: 'openai', baseURL: 'https://api.openai.com/v1',                              model: 'gpt-4o-mini',                          keyEnv: 'OPENAI_API_KEY' },
  anthropic:  { kind: 'anthropic',                                                                 model: 'claude-haiku-4-5-20251001',            keyEnv: 'ANTHROPIC_API_KEY' },
};

function resolveProvider() {
  const name = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const base = PROVIDERS[name] || PROVIDERS.groq;
  const apiKey = process.env.AI_API_KEY || (base.keyEnv ? process.env[base.keyEnv] : '') || '';
  const model = process.env.AI_MODEL || base.model;
  const baseURL = process.env.AI_BASE_URL || base.baseURL;
  // Local providers (ollama) need no key; everything else does.
  const enabled = base.keyEnv === null ? true : !!apiKey;
  return { name, kind: base.kind, apiKey, model, baseURL, enabled, keyEnv: base.keyEnv };
}

let CFG = resolveProvider();

// ── Tool catalog (neutral form) ─────────────────────────────
const TOOLS = [
  { name: 'list_tracks', description: 'List all available tracks (built-in catalog + the user\'s own). Use this to find a track by its name before adding it to a playlist or liking it.',
    input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Optional case-insensitive filter on name, artist, album, or genre.' } } } },
  { name: 'add_track', description: 'Create a new track in the library. Only "name" is required; sensible defaults are chosen for anything omitted.',
    input_schema: { type: 'object', properties: { name: { type: 'string' }, artist: { type: 'string' }, album: { type: 'string' }, genre: { type: 'string', enum: store.META.GENRES }, mood: { type: 'string', enum: store.META.MOODS }, bpm: { type: 'number' } }, required: ['name'] } },
  { name: 'list_playlists', description: 'List the user\'s playlists with their track counts.', input_schema: { type: 'object', properties: {} } },
  { name: 'create_playlist', description: 'Create a new empty playlist.', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'rename_playlist', description: 'Rename an existing playlist, identified by its current name.', input_schema: { type: 'object', properties: { currentName: { type: 'string' }, newName: { type: 'string' } }, required: ['currentName', 'newName'] } },
  { name: 'delete_playlist', description: 'Delete a playlist by name.', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'add_track_to_playlist', description: 'Add a track (by track name) to a playlist (by playlist name). The track must already exist — call add_track first if needed.', input_schema: { type: 'object', properties: { playlistName: { type: 'string' }, trackName: { type: 'string' } }, required: ['playlistName', 'trackName'] } },
  { name: 'remove_track_from_playlist', description: 'Remove a track (by name) from a playlist (by name).', input_schema: { type: 'object', properties: { playlistName: { type: 'string' }, trackName: { type: 'string' } }, required: ['playlistName', 'trackName'] } },
  { name: 'set_like', description: 'Like or unlike a track by name.', input_schema: { type: 'object', properties: { trackName: { type: 'string' }, liked: { type: 'boolean' } }, required: ['trackName', 'liked'] } },
];

const anthropicTools = TOOLS;
const openaiTools = TOOLS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));

// ── Tool executors (run server-side, scoped to userId) ──────
function resolvePlaylist(userId, name) {
  const p = store.findPlaylistByName(userId, name);
  if (!p) throw new Error(`No playlist named "${name}". Existing: ${store.listPlaylists(userId).map((x) => x.name).join(', ') || '(none)'}`);
  return p;
}
function resolveTrack(name) {
  const t = store.findTrackByName(name);
  if (!t) throw new Error(`No track named "${name}". Add it first with add_track, or call list_tracks to see options.`);
  return t;
}

const EXECUTORS = {
  list_tracks(userId, { query }) {
    let tracks = store.listTracks();
    if (query) { const q = String(query).toLowerCase(); tracks = tracks.filter((t) => [t.name, t.artist, t.album, t.genre].some((f) => String(f).toLowerCase().includes(q))); }
    return { count: tracks.length, tracks: tracks.slice(0, 60).map((t) => ({ name: t.name, artist: t.artist, genre: t.genre })) };
  },
  add_track(userId, input) { const t = store.addTrack(input, userId); return { added: { name: t.name, artist: t.artist, genre: t.genre } }; },
  list_playlists(userId) { return { playlists: store.listPlaylists(userId).map((p) => ({ name: p.name, trackCount: p.trackIds.length })) }; },
  create_playlist(userId, { name }) { return { created: store.createPlaylist(userId, name).name }; },
  rename_playlist(userId, { currentName, newName }) { const p = resolvePlaylist(userId, currentName); return { renamed: store.renamePlaylist(userId, p.id, newName).name }; },
  delete_playlist(userId, { name }) { const p = resolvePlaylist(userId, name); store.deletePlaylist(userId, p.id); return { deleted: name }; },
  add_track_to_playlist(userId, { playlistName, trackName }) { const p = resolvePlaylist(userId, playlistName); const t = resolveTrack(trackName); store.addTrackToPlaylist(userId, p.id, t.id); return { added: t.name, to: p.name }; },
  remove_track_from_playlist(userId, { playlistName, trackName }) { const p = resolvePlaylist(userId, playlistName); const t = resolveTrack(trackName); store.removeTrackFromPlaylist(userId, p.id, t.id); return { removed: t.name, from: p.name }; },
  set_like(userId, { trackName, liked }) { const t = resolveTrack(trackName); store.setLike(userId, t.id, !!liked); return { track: t.name, liked: !!liked }; },
};

const MUTATING = new Set(['add_track', 'create_playlist', 'rename_playlist', 'delete_playlist', 'add_track_to_playlist', 'remove_track_from_playlist', 'set_like']);

function runTool(userId, name, args) {
  if (!EXECUTORS[name]) return { error: `Unknown tool ${name}` };
  try { return EXECUTORS[name](userId, args || {}); }
  catch (e) { return { error: e.message }; }
}

const SYSTEM = `You are the in-app assistant for Tunecraft, a personal music player.
You help the signed-in user manage their music library through conversation: adding tracks, creating and editing playlists, organising songs, and liking tracks.

Guidelines:
- Use the tools to actually perform actions. Never claim you did something without calling the matching tool.
- To add an existing track to a playlist you need the exact track name; if unsure, call list_tracks first. If the track does not exist yet, call add_track, then add_track_to_playlist.
- Tracks are procedurally synthesized (there is no real audio file), so you can freely invent fun songs when asked.
- Be concise and friendly. Confirm what you did in one or two sentences.
- If a request is ambiguous (e.g. which playlist), ask a short clarifying question instead of guessing destructively.`;

// ── OpenAI-compatible run loop ──────────────────────────────
async function runOpenAI(cfg, userId, history, userMessage) {
  const client = new OpenAI({ apiKey: cfg.apiKey || 'not-needed', baseURL: cfg.baseURL });
  const messages = [{ role: 'system', content: SYSTEM }, ...history, { role: 'user', content: userMessage }];
  let changed = false;

  for (let step = 0; step < 8; step++) {
    const resp = await client.chat.completions.create({ model: cfg.model, max_tokens: 1024, messages, tools: openaiTools, tool_choice: 'auto' });
    const msg = resp.choices?.[0]?.message;
    if (!msg) break;
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { reply: (msg.content || 'Done.').trim(), changed };
    }
    messages.push(msg);
    for (const tc of msg.tool_calls) {
      let args = {};
      try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      const result = runTool(userId, tc.function.name, args);
      if (MUTATING.has(tc.function.name) && !result.error) changed = true;
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }
  return { reply: 'That took too many steps — could you simplify the request?', changed };
}

// ── Anthropic run loop ──────────────────────────────────────
async function runAnthropic(cfg, userId, history, userMessage) {
  const client = new Anthropic({ apiKey: cfg.apiKey });
  const messages = [...history, { role: 'user', content: userMessage }];
  const system = [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }];
  let changed = false;

  for (let step = 0; step < 8; step++) {
    const response = await client.messages.create({ model: cfg.model, max_tokens: 1024, system, tools: anthropicTools, messages });
    if (response.stop_reason !== 'tool_use') {
      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      return { reply: text || 'Done.', changed };
    }
    messages.push({ role: 'assistant', content: response.content });
    const results = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const result = runTool(userId, block.name, block.input);
      if (MUTATING.has(block.name) && !result.error) changed = true;
      results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
    }
    messages.push({ role: 'user', content: results });
  }
  return { reply: 'That took too many steps — could you simplify the request?', changed };
}

export function aiStatus() { return resolveProvider(); }

export const agentRouter = Router();

// POST /api/agent/chat  { message, history?: [{role, content}] }
agentRouter.post('/chat', authRequired, async (req, res) => {
  CFG = resolveProvider(); // re-read each request so .env edits take effect on restart
  if (!CFG.enabled) {
    return res.status(503).json({
      error: `The AI assistant is not configured. Add a free ${CFG.name} key as ${CFG.keyEnv} in server/.env to enable it.`,
      disabled: true,
    });
  }

  const userMessage = String(req.body?.message || '').trim();
  if (!userMessage) return res.status(400).json({ error: 'Empty message' });

  const history = (Array.isArray(req.body?.history) ? req.body.history : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const out = CFG.kind === 'anthropic'
      ? await runAnthropic(CFG, req.user.id, history, userMessage)
      : await runOpenAI(CFG, req.user.id, history, userMessage);
    res.json(out);
  } catch (e) {
    console.error('Agent error:', e?.status || '', e?.message || e);
    const hint = e?.status === 401 ? ' (the API key looks invalid)' : '';
    res.status(502).json({ error: `The AI assistant had a problem${hint}. Check the server logs and your ${CFG.keyEnv || 'provider'} setting.` });
  }
});

agentRouter.get('/status', (req, res) => {
  const c = resolveProvider();
  res.json({ enabled: c.enabled, provider: c.name, model: c.enabled ? c.model : null });
});
