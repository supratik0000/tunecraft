# Tunecraft

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/tunecraft)

A self-contained music player you run on your own machine — or deploy free
to the public web with one click. Includes user accounts, playlists, liked
songs, an in-browser audio synthesizer, and an AI assistant that controls
your library in plain English.

Nothing is streamed or licensed: real audio comes from a small bundle of
royalty-free instrumental MP3s (algorithmically-generated SoundHelix demo
songs), and tracks without a file fall back to a Web Audio synthesizer that
generates sound from the track's tempo, key, mood and genre.

---

## Features

| Area | What you get |
|------|--------------|
| **Accounts**       | Email + password sign-up / login. Passwords hashed with bcrypt, sessions via JWT. |
| **Playlists**      | Create, rename, delete, add/remove tracks — saved per user on the server. |
| **Liked songs**    | Synced to your account (not just the browser). |
| **Real audio**     | Plays royalty-free instrumental tracks, with a Web Audio synthesizer fallback. |
| **Track library**  | Served by the API; you (or the AI) can add new tracks. |
| **Album art**      | Upload custom artwork for any track. |
| **AI assistant**   | "Make a playlist called Road Trip and add Turbo Charged" → it actually does it. Runs on a free LLM provider. |
| **Player**         | Play/pause, next/prev, shuffle, repeat, seek, volume, live waveform, keyboard shortcuts. |

---

## Project structure

The codebase is organised so each concern lives in its own folder — every
file has a single, focused job, which makes code review and debugging much
easier.

```
tunecraft/
├── public/                          ← Frontend (served by the backend)
│   ├── index.html
│   ├── audio/                       ← royalty-free MP3s (downloaded by a script)
│   ├── css/
│   │   ├── base.css                 ← design tokens, reset, scrollbars, toast
│   │   ├── layout.css               ← top brand bar, drawer, content shell
│   │   ├── player-bar.css           ← top sticky player strip
│   │   ├── home.css                 ← hero, chips, genre cards, viz strip
│   │   ├── tracks.css               ← track cards + add-to-playlist popover
│   │   ├── auth.css                 ← sign-in / sign-up overlay
│   │   └── ai-panel.css             ← assistant slide-out
│   └── js/
│       ├── main.js                  ← entry point — boots everything in order
│       ├── core/
│       │   ├── api.js               ← fetch wrapper + token storage
│       │   ├── state.js             ← single shared state object + loaders
│       │   ├── util.js              ← tiny DOM/string helpers
│       │   └── auth.js              ← auth overlay logic
│       ├── audio/
│       │   ├── synth.js             ← Web Audio synthesizer
│       │   └── player.js            ← file/synth dual-mode player
│       └── ui/
│           ├── tracks-render.js     ← card builder + "add to playlist" popover
│           ├── library-drawer.js    ← left drawer (playlists list, CRUD)
│           ├── views.js             ← home / list / search view switching
│           ├── playback.js          ← play queue, like, sync now-playing
│           ├── player-controls.js   ← player bar wiring, keyboard, art upload
│           ├── visualizer.js        ← waveform animation
│           └── ai-panel.js          ← assistant chat panel
│
├── server/                          ← Backend (Node + Express + SQLite)
│   ├── index.js                     ← entry — wires modules together
│   ├── package.json
│   ├── config/
│   │   └── env.js                   ← all process.env reads in one place
│   ├── db/
│   │   ├── connection.js            ← open SQLite, transaction helper
│   │   ├── schema.js                ← CREATE TABLE + migrations
│   │   ├── catalog.js               ← built-in starter tracks
│   │   └── seed.js                  ← idempotent catalog seeding
│   ├── auth/
│   │   ├── passwords.js             ← bcrypt hash / verify
│   │   ├── tokens.js                ← JWT sign / verify
│   │   ├── middleware.js            ← authRequired Express middleware
│   │   └── routes.js                ← /api/auth/register|login|me
│   ├── services/                    ← All data operations live here.
│   │   ├── meta.js                  ← shared enums (genres, moods, keys…)
│   │   ├── tracks.service.js
│   │   ├── likes.service.js
│   │   └── playlists.service.js
│   ├── routes/                      ← Thin HTTP layer; calls into services.
│   │   ├── _helpers.js
│   │   ├── tracks.routes.js
│   │   ├── art.routes.js
│   │   ├── likes.routes.js
│   │   ├── playlists.routes.js
│   │   └── health.routes.js
│   ├── ai/                          ← Natural-language assistant.
│   │   ├── providers.js             ← LLM provider registry
│   │   ├── tools.js                 ← tool schema (neutral form)
│   │   ├── executors.js             ← tool → service mapping
│   │   ├── system-prompt.js
│   │   ├── openai-runner.js         ← multi-turn loop (OpenAI-compat)
│   │   ├── anthropic-runner.js      ← multi-turn loop (Anthropic native)
│   │   └── routes.js                ← /api/agent/chat
│   ├── scripts/
│   │   └── fetch-audio.mjs          ← download royalty-free demo songs
│   └── data/                        ← runtime — gitignored
│       ├── app.db                   ← SQLite database
│       └── uploads/                 ← uploaded album art
│
├── install.bat                      ← one-click install (npm install + .env)
├── start.bat                        ← run the server
├── fetch-audio.bat                  ← download the demo MP3s
└── reset-db.bat                     ← wipe the database (asks first)
```

---

## Quick start (Windows)

```
install.bat        ← run once on first checkout
fetch-audio.bat    ← run once to get the MP3s
start.bat          ← start the server, opens browser at http://localhost:4000
```

A demo account already exists if you want to skip sign-up:
`test@example.com` / `secret123`. Run `reset-db.bat` to start fresh.

## Quick start (manual)

You need **Node.js 22.5+** (uses the built-in `node:sqlite`).

```bash
cd server
npm install
cp .env.example .env       # PowerShell: Copy-Item .env.example .env
npm run fetch-audio        # downloads royalty-free songs into public/audio/
npm start
```

Then open <http://localhost:4000>.

> **Audio files** are not committed (they're ~65 MB). `npm run fetch-audio`
> downloads SoundHelix demo songs (algorithmically generated, free to use).
> Tracks without an audio file automatically fall back to the Web Audio
> synthesizer.

---

## Enabling the AI assistant (free)

The assistant is fully built but needs an API key. It is provider-agnostic
and defaults to **Groq**, which is free and fast.

1. Get a free key at <https://console.groq.com/keys> (no credit card).
2. Put it in `server/.env`:
   ```
   AI_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   ```
3. Restart the server. The "Assistant" panel now performs real actions.

### Other free / local options

Set `AI_PROVIDER` and the matching key in `server/.env`:

| Provider           | `AI_PROVIDER` | Key variable          | Where / cost |
|--------------------|---------------|-----------------------|---|
| **Groq** (default) | `groq`        | `GROQ_API_KEY`        | <https://console.groq.com/keys> — free |
| Google Gemini      | `gemini`      | `GEMINI_API_KEY`      | <https://aistudio.google.com/apikey> — free tier |
| OpenRouter         | `openrouter`  | `OPENROUTER_API_KEY`  | <https://openrouter.ai/keys> — has free models |
| Ollama (local)     | `ollama`      | *(none)*              | <https://ollama.com> — runs on your PC, no key |
| OpenAI             | `openai`      | `OPENAI_API_KEY`      | paid |
| Anthropic          | `anthropic`   | `ANTHROPIC_API_KEY`   | paid |

Override the model with `AI_MODEL=...`, or point at any OpenAI-compatible
endpoint with `AI_BASE_URL=...`. Without a key everything else works; the
assistant panel just shows a "not configured" notice.

The assistant can only do what you could do in the UI — every tool it calls
maps to the same per-user service function.

---

## API reference (quick)

| Method & path                             | Auth | Purpose |
|-------------------------------------------|:----:|---|
| `POST /api/auth/register`                 | –    | Create account → `{ token, user }` |
| `POST /api/auth/login`                    | –    | Log in → `{ token, user }` |
| `GET  /api/auth/me`                       | ✓    | Current user |
| `GET  /api/tracks`                        | –    | List all tracks |
| `POST /api/tracks`                        | ✓    | Add a track |
| `POST /api/tracks/:id/art`                | ✓    | Upload album art `{ dataUrl }` |
| `GET  /api/likes`                         | ✓    | Liked track ids |
| `PUT  /api/likes/:trackId`                | ✓    | `{ liked: true|false }` |
| `GET  /api/playlists`                     | ✓    | List playlists with track ids |
| `POST /api/playlists`                     | ✓    | Create `{ name }` |
| `PATCH /api/playlists/:id`                | ✓    | Rename `{ name }` |
| `DELETE /api/playlists/:id`               | ✓    | Delete |
| `POST /api/playlists/:id/tracks`          | ✓    | Add `{ trackId }` |
| `DELETE /api/playlists/:id/tracks/:trackId` | ✓  | Remove track |
| `POST /api/agent/chat`                    | ✓    | Talk to the AI `{ message, history }` |

Authenticated requests send `Authorization: Bearer <token>`.

---

## Hosting it free on Render

The repo includes a [`render.yaml`](render.yaml) blueprint. To host a public
copy at `https://<your-name>.onrender.com` at no cost:

1. Push this repo to your own GitHub account.
2. Update the `Deploy to Render` badge URL at the top of this README so it
   points at your fork.
3. Click the badge. Sign in to Render with GitHub, pick the repo, and let
   Render apply the blueprint. The first deploy takes ~3 min (it downloads
   the demo MP3s during build).
4. In the Render dashboard, open the new service → **Environment** → paste
   your free Groq key as `GROQ_API_KEY` if you want the AI assistant.

**Free-tier caveats:**
- The service sleeps after 15 min of inactivity. First request after a
  sleep takes ~30s while it wakes.
- The filesystem is ephemeral — accounts and playlists reset on each
  redeploy. The built-in catalog re-seeds automatically. For persistent
  user data, attach a Render disk ($1/mo) or move to Postgres.

---

## Tech notes

- **No native compilation** — uses Node's built-in SQLite, so `npm install`
  never needs Visual Studio / build tools.
- The database is a single file at `server/data/app.db` (git-ignored).
- License: MIT. Build on it freely.
