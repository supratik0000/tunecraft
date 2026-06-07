# 🎵 Tunecraft

A personal, **self-contained music player** inspired by Spotify's layout — but with
**no copyrighted content**:

- 🎹 **Audio is synthesized in the browser** with the Web Audio API from each track's
  tempo / key / mood / genre. Nothing is streamed, downloaded, or licensed.
- 🟣 **Original branding** — its own name (*Tunecraft*), an original equalizer-bars logo,
  and a violet brand color (deliberately **not** Spotify's green).
- 🛠️ A real **Node.js + Express backend** with a **SQLite** database, user accounts,
  playlists, synced likes, and an **AI assistant** that controls your library in plain English.

> This is an original work that *resembles* a streaming-app UI for learning/portfolio
> purposes. It contains no Spotify code, assets, trademarks, or audio.

---

## Features

| Area | What you get |
|------|--------------|
| **Accounts** | Email + password sign-up / login. Passwords hashed with bcrypt, sessions via JWT. |
| **Playlists** | Create, rename, delete, add/remove tracks — saved per user on the server. |
| **Liked songs** | Synced to your account (not just the browser). |
| **Track library** | Served by the API; you (or the AI) can add new tracks. |
| **Album art** | Upload custom artwork for any track (click the artwork in the player bar). |
| **AI assistant** | "Make a playlist called Road Trip and add Turbo Charged" → it actually does it. Runs on a **free** LLM provider. |
| **Player** | Play/pause, next/prev, shuffle, repeat, seek, volume, live waveform, keyboard shortcuts. |

---

## Project structure

```
spotify-clone-app/
├── public/              ← Frontend (served by the backend)
│   ├── index.html
│   ├── styles.css
│   ├── app.js           ← UI logic, talks to the API
│   └── synth.js         ← Web Audio synthesizer
├── server/              ← Backend (Node + Express + SQLite)
│   ├── index.js         ← App entry / route wiring / static hosting
│   ├── db.js            ← SQLite schema (node:sqlite, no native build needed)
│   ├── auth.js          ← Register / login / JWT middleware
│   ├── store.js         ← All data operations (shared by API + AI)
│   ├── library.js       ← REST routes: tracks, likes, playlists
│   ├── agent.js         ← The Claude-powered AI assistant (tool calling)
│   ├── catalog.js       ← Built-in starter tracks
│   ├── seed.js          ← Loads the catalog into the DB
│   └── .env.example     ← Copy to .env and configure
└── spotify-clone*.html  ← Older single-file prototypes (kept for reference)
```

---

## Running it

You need **Node.js 22.5+** (uses the built-in `node:sqlite`). You have v24 — good.

```bash
cd server
npm install
cp .env.example .env      # Windows PowerShell:  Copy-Item .env.example .env
npm start
```

Then open **http://localhost:4000**.

A demo account already exists if you want to skip sign-up:
`test@example.com` / `secret123`. (Delete `server/data/app.db` any time to start fresh.)

---

## Enabling the AI assistant (free)

The assistant is fully built but needs an API key. It's **provider-agnostic** and defaults to
**Groq**, which is free and fast. Steps:

1. Create a free key at <https://console.groq.com/keys> (no credit card).
2. Put it in `server/.env`:
   ```
   AI_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   ```
3. Restart the server. The "Ask AI" panel now performs real actions.

### Other free / local options

Set `AI_PROVIDER` and the matching key in `server/.env`:

| Provider | `AI_PROVIDER` | Key variable | Where / cost |
|---|---|---|---|
| **Groq** (default) | `groq` | `GROQ_API_KEY` | <https://console.groq.com/keys> — free |
| Google Gemini | `gemini` | `GEMINI_API_KEY` | <https://aistudio.google.com/apikey> — free tier |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | <https://openrouter.ai/keys> — has free models |
| Ollama (local) | `ollama` | *(none)* | <https://ollama.com> — runs on your PC, no key |
| OpenAI | `openai` | `OPENAI_API_KEY` | paid |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` | paid |

Override the model with `AI_MODEL=...`, or point at any OpenAI-compatible endpoint with
`AI_BASE_URL=...`. Without a key everything else works; the AI panel just shows a
"not configured" notice.

The assistant can only do what *you* could do in the UI — every tool it calls maps to the
same per-user functions in `store.js`.

---

## API reference (quick)

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` | – | Create account → `{ token, user }` |
| `POST /api/auth/login` | – | Log in → `{ token, user }` |
| `GET  /api/auth/me` | ✓ | Current user |
| `GET  /api/tracks` | – | List all tracks |
| `POST /api/tracks` | ✓ | Add a track |
| `POST /api/tracks/:id/art` | ✓ | Upload album art `{ dataUrl }` |
| `GET  /api/likes` | ✓ | Liked track ids |
| `PUT  /api/likes/:trackId` | ✓ | `{ liked: true|false }` |
| `GET  /api/playlists` | ✓ | List playlists with track ids |
| `POST /api/playlists` | ✓ | Create `{ name }` |
| `PATCH /api/playlists/:id` | ✓ | Rename `{ name }` |
| `DELETE /api/playlists/:id` | ✓ | Delete |
| `POST /api/playlists/:id/tracks` | ✓ | Add `{ trackId }` |
| `DELETE /api/playlists/:id/tracks/:trackId` | ✓ | Remove track |
| `POST /api/agent/chat` | ✓ | Talk to the AI `{ message, history }` |

Authenticated requests send `Authorization: Bearer <token>`.

---

## Tech notes

- **No native compilation** — uses Node's built-in SQLite, so `npm install` never needs
  Visual Studio / build tools.
- The database is a single file at `server/data/app.db` (git-ignored).
- License: MIT. Build on it freely.
