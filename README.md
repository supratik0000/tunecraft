# Tunecraft

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/supratik0000/tunecraft)

A self-hosted, full-stack music player with user accounts, playlists, an
AI assistant that controls the library by natural language, and a Web
Audio synthesizer that procedurally generates audio when no MP3 file is
available. Built as a single repo containing a Node + Express + libSQL
backend and a vanilla-JS frontend, deployed for free on Render with
Turso for persistent storage.

**Live:** https://tunecraft-waqe.onrender.com

---

## Table of contents

1. [What it does](#what-it-does)
2. [Tech stack](#tech-stack)
3. [Architecture at a glance](#architecture-at-a-glance)
4. [Project layout](#project-layout)
5. [Design decisions and why](#design-decisions-and-why)
6. [Database schema](#database-schema)
7. [Authentication flow](#authentication-flow)
8. [AI assistant (function calling)](#ai-assistant-function-calling)
9. [Frontend module map](#frontend-module-map)
10. [Running it locally](#running-it-locally)
11. [Deployment](#deployment)
12. [API reference](#api-reference)
13. [Trade-offs I made](#trade-offs-i-made)
14. [What I would build next](#what-i-would-build-next)

---

## What it does

| Area | Capability |
|---|---|
| Accounts | Email + password sign-up, real-domain email validation (DNS MX lookup), password visibility toggle, JWT sessions valid for 30 days. |
| Library | 30 built-in tracks across English, Hindi-Bollywood-style, and Bengali-style genres. All track names, artists, and albums are original. |
| Playlists | Per-user CRUD: create, rename, delete, add/remove tracks. |
| Liked songs | Synced to the user's account, not just the browser. |
| Real audio | 17 royalty-free SoundHelix tracks distributed across the catalog (each MP3 backs ≈2 catalog entries). |
| Audio fallback | Tracks without an MP3 are synthesised in-browser from `bpm`, `music_key`, `mood`, and `genre` using the Web Audio API. |
| Album art | Users can upload a custom image per track (PNG/JPEG/WebP/GIF, max 3 MB, decoded server-side). |
| AI assistant | Natural-language control — "make a Road Trip playlist and add Turbo Charged" actually does it. Multi-provider: Groq (default, free), Gemini, OpenRouter, Ollama, OpenAI, Anthropic. |
| Player | Play/pause, prev/next, shuffle, repeat, seek, volume, live waveform visualiser, keyboard shortcuts. |

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend runtime | Node.js 22.5+ | Uses the built-in `node:sqlite` for local dev, no native build tools required. |
| Web framework | Express 4 | Smallest surface area for the routes I needed; nothing benefits from a heavier framework. |
| Database client | `@libsql/client` | Works against both a local SQLite file (dev) and a hosted Turso database (prod) with the same code path. |
| Persistence (prod) | Turso (libSQL) — free tier | Solves Render's ephemeral-filesystem problem at $0. |
| Auth | `bcryptjs` + `jsonwebtoken` | Industry standard; bcryptjs avoids native builds. |
| Email validation | Node's built-in `dns.promises` MX lookup | Rejects fake domains without paying for an external service. |
| AI provider | Provider-agnostic abstraction | Works with any OpenAI-compatible endpoint OR the Anthropic SDK. Default Groq for the free tier. |
| Frontend | Vanilla ES modules + CSS, no build step | The whole app fits comfortably without Vite/Webpack overhead. Static files served by Express. |
| Audio | Web Audio API (synth) + `<audio>` element (file playback) | Real-time visualiser uses the same AnalyserNode in both modes. |
| Hosting | Render (free) | Auto-deploys on push to `main`, free TLS, blueprint config in `render.yaml`. |

---

## Architecture at a glance

```
┌──────────────────────────────────────────────────────────────────┐
│                      Browser (vanilla ES modules)                │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Player   │  │ Library    │  │ AI Panel │  │ Auth overlay  │   │
│  │ controls │  │ drawer     │  │ chat     │  │ sign-in/up    │   │
│  └────┬─────┘  └──────┬─────┘  └─────┬────┘  └──────┬────────┘   │
│       └───────┬───────┴───────┬──────┴──────────────┘            │
│               ▼               ▼                                  │
│         ┌──────────┐   ┌──────────────┐                          │
│         │ state.js │   │ api.js       │  ← fetch wrapper w/ JWT  │
│         └──────────┘   └─────┬────────┘                          │
└─────────────────────────────┬┼──────────────────────────────────┘
                              ││
                          HTTPS │ Bearer token
                              ▼▼
┌──────────────────────────────────────────────────────────────────┐
│                  Express server  (server/index.js)               │
│                                                                  │
│  /api/auth/*    ──► auth/routes.js   ──► passwords.js / tokens.js│
│  /api/tracks    ──► routes/tracks    ──► services/tracks.service │
│  /api/likes     ──► routes/likes     ──► services/likes.service  │
│  /api/playlists ──► routes/playlists ──► services/playlists.svc  │
│  /api/agent/*   ──► ai/routes.js     ──► ai/openai|anthropic-run │
│                                          └─► ai/executors        │
│                                              └─► services/*      │
│                                                                  │
│  routes/_helpers.js   handle() — async error → 400 wrapper       │
│  auth/middleware.js   authRequired — JWT verify + req.user       │
└─────────────────────────────┬──────────────────────────────────┬─┘
                              │                                  │
                              ▼                                  ▼
                      ┌──────────────┐                  ┌────────────────┐
                      │ Turso (prod) │   or local file: │ data/app.db    │
                      │ libSQL       │   (dev fallback) │ SQLite         │
                      └──────────────┘                  └────────────────┘
```

Key property: **the REST routes and the AI agent both call the same service
functions**, so the assistant can only do what the user could do themselves
through the UI.

---

## Project layout

I organised the code so every file has a single, focused job. This made
review and debugging much easier as the project grew.

```
tunecraft/
├── public/                          ← Frontend (served by the backend)
│   ├── index.html
│   ├── audio/                       ← MP3s downloaded by fetch-audio
│   ├── css/                         ← Split by concern, no build step
│   │   ├── base.css                 ← design tokens, reset, toast
│   │   ├── layout.css               ← top brand bar, library drawer, credits
│   │   ├── player-bar.css           ← sticky top player strip
│   │   ├── home.css                 ← hero, chips, genre cards, viz strip
│   │   ├── tracks.css               ← card grid, "add to playlist" popover
│   │   ├── auth.css                 ← sign-in / sign-up overlay + eye toggle
│   │   └── ai-panel.css             ← right-side assistant slide-out
│   │
│   └── js/
│       ├── main.js                  ← Entry — boots everything in order
│       ├── core/
│       │   ├── api.js               ← fetch wrapper + token storage
│       │   ├── state.js             ← single shared state object + loaders
│       │   ├── util.js              ← DOM helpers, esc, fmt, toast
│       │   └── auth.js              ← Auth overlay, password eye, email hint
│       ├── audio/
│       │   ├── synth.js             ← Web Audio synthesiser
│       │   └── player.js            ← Dual-mode (file or synth) player
│       └── ui/
│           ├── tracks-render.js     ← Card builder + add-to-playlist menu
│           ├── library-drawer.js    ← Left slide-out (playlist CRUD UI)
│           ├── views.js             ← Home / list / search / credits switch
│           ├── playback.js          ← Play queue, like sync, now-playing
│           ├── player-controls.js   ← Player-bar wiring, keyboard, art upload
│           ├── visualizer.js        ← Waveform animation
│           └── ai-panel.js          ← Assistant chat panel
│
├── server/                          ← Backend (Node + Express + libSQL)
│   ├── index.js                     ← Entry — wires modules together
│   ├── package.json
│   ├── config/
│   │   └── env.js                   ← Every process.env read in one place
│   ├── db/
│   │   ├── connection.js            ← libSQL client + getOne/getAll/run helpers
│   │   ├── schema.js                ← CREATE TABLE + lightweight migrations
│   │   ├── catalog.js               ← Built-in starter tracks (30 entries)
│   │   └── seed.js                  ← Idempotent batched seeding
│   ├── auth/
│   │   ├── passwords.js             ← bcrypt hash / verify
│   │   ├── tokens.js                ← JWT sign / verify
│   │   ├── middleware.js            ← authRequired Express middleware
│   │   ├── email-check.js           ← Format + DNS MX-record validation
│   │   └── routes.js                ← /api/auth/register|login|me
│   ├── services/                    ← All data operations live here.
│   │   ├── meta.js                  ← shared enums (genres, moods, keys…)
│   │   ├── tracks.service.js
│   │   ├── likes.service.js
│   │   └── playlists.service.js
│   ├── routes/                      ← Thin HTTP layer; delegates to services.
│   │   ├── _helpers.js              ← async handle() wrapper
│   │   ├── tracks.routes.js
│   │   ├── art.routes.js
│   │   ├── likes.routes.js
│   │   ├── playlists.routes.js
│   │   └── health.routes.js
│   ├── ai/                          ← Natural-language assistant.
│   │   ├── providers.js             ← LLM provider registry
│   │   ├── tools.js                 ← Tool schema (neutral form)
│   │   ├── executors.js             ← Tool name → service function mapping
│   │   ├── system-prompt.js
│   │   ├── openai-runner.js         ← Multi-turn loop (OpenAI-compat)
│   │   ├── anthropic-runner.js      ← Multi-turn loop (Anthropic native)
│   │   └── routes.js                ← /api/agent/chat
│   ├── scripts/
│   │   └── fetch-audio.mjs          ← Downloads royalty-free demo songs
│   └── data/                        ← runtime — gitignored
│       ├── app.db                   ← Local SQLite (dev only)
│       └── uploads/                 ← Uploaded album art
│
├── install.bat                      ← one-click install (npm install + .env)
├── start.bat                        ← run the server
├── fetch-audio.bat                  ← download the demo MP3s
├── reset-db.bat                     ← wipe the local database
└── render.yaml                      ← Render.com one-click deploy blueprint
```

---

## Design decisions and why

### Single shared state instead of a state-management library

The frontend has ≈14 modules but only a few pieces of data they all need
(`tracks`, `likes`, `playlists`, `queue`, current `view`). I exported a
mutable `state` object from `state.js` and let modules read/write directly.
No Redux, no Zustand, no observer machinery. For an app this size, that
indirection would cost more in mental overhead than it would save in
correctness.

### Two-layer backend: routes are thin, services own the logic

Every REST route in `routes/*.routes.js` is a 2–3 line wrapper around a
service call. The service files (`services/*.service.js`) contain all the
SQL and validation. This lets me call the same services from the AI agent
without going through HTTP, so the assistant cannot accidentally do
something the REST API wouldn't allow.

### libSQL with a dual-mode URL

I wrote the data layer against `@libsql/client`. When `TURSO_DATABASE_URL`
is set, it talks to Turso; when it's blank, the same client opens a local
SQLite file. That means the same code runs in development and production
without any abstractions or feature flags.

### Provider-agnostic AI assistant

The assistant's "neutral" tool schema in `ai/tools.js` is converted into
both Anthropic's tool format and OpenAI's `function` calling format. Two
runners (`openai-runner.js`, `anthropic-runner.js`) implement the multi-turn
loop, but the tools, the system prompt, and the executors are shared. To
add another provider that speaks the OpenAI chat-completions protocol
(Together, Fireworks, etc.), I just add a row to the `PROVIDERS` registry.

### Email validation that fails open

The MX-record check rejects obviously-fake domains like `test@asdf.qqq`,
but if DNS itself is unreachable (rare, but happens on flaky networks)
the signup is allowed through. I'd rather let in one bogus email than
block a real user because of a transient infra problem.

### Card-grid frontend over the row-table pattern

I deliberately picked a structurally distinct layout from the common
left-rail + bottom-player layout. The brand bar lives at the top, the
player strip is sticky just below it, and the library is a slide-out
drawer rather than always-visible. Cards instead of table rows. Beyond
just being different, the card grid wraps cleanly on narrow viewports
without a separate mobile codepath.

---

## Database schema

Five tables — `users`, `tracks`, `playlists`, `playlist_tracks`, `likes`.
SQLite-flavoured DDL in `server/db/schema.js`:

```
users
  id INTEGER PK            email TEXT UNIQUE       password_hash TEXT
  display_name TEXT        created_at TEXT

tracks
  id TEXT PK               name TEXT               artist TEXT
  album TEXT               genre TEXT              emoji TEXT
  color TEXT               bpm INTEGER             music_key TEXT
  mood TEXT                duration INTEGER        art TEXT (nullable)
  audio TEXT               owner_id INTEGER → users.id (nullable: catalog)
  created_at TEXT

playlists
  id INTEGER PK            user_id INTEGER → users.id
  name TEXT                created_at TEXT

playlist_tracks            (composite PK)
  playlist_id INTEGER → playlists.id
  track_id    TEXT    → tracks.id
  added_at    TEXT

likes                      (composite PK)
  user_id     INTEGER → users.id
  track_id    TEXT    → tracks.id
  liked_at    TEXT
```

Catalog tracks have `owner_id = NULL`; user-added tracks set it to the
creator. The seed function (`server/db/seed.js`) deletes stale catalog
rows whose IDs are no longer in `CATALOG`, then upserts the current
catalog — so renaming or removing an entry in code propagates to the
DB on the next boot. User data is never touched.

---

## Authentication flow

```
                   client (browser)                server
─────────────────────────────────────────────────────────────────────
        1. POST /api/auth/register
              { email, password,                  ┌──────────────┐
                displayName }      ─────────────► │ format check │
                                                  │ MX lookup    │
                                                  │ uniqueness   │
                                                  │ bcrypt hash  │
                                                  │ INSERT user  │
                                                  │ sign JWT     │
                                                  └──────┬───────┘
        4. store JWT in localStorage  ◄──────────────────┘
           under key "tc_token"           { token, user }

        5. every later request →
           Authorization: Bearer <jwt>          ┌─────────────────┐
                              ──────────────►  │ authRequired    │
                                                │ middleware:     │
                                                │ verify signature│
                                                │ load user from  │
                                                │ DB, attach to   │
                                                │ req.user        │
                                                └────────┬────────┘
                                                          ▼
                                                  the actual route
```

- Passwords are bcrypt-hashed with cost factor 10.
- JWT is signed with `JWT_SECRET` (Render generates it once via
  `generateValue: true` in `render.yaml`).
- 30-day TTL on the token. On startup the client tries `GET /api/auth/me`
  silently — if it 401s, the token is cleared and the auth overlay shows.

---

## AI assistant (function calling)

The assistant operates by issuing **tool calls** that map 1:1 to service
functions. Workflow for "make a playlist called Road Trip and add Turbo
Charged":

```
user prompt ─► OpenAI/Anthropic provider with tools:[…] in the request

LLM ───► tool_call: create_playlist({ name: "Road Trip" })
                           ↓
                 ai/executors.create_playlist(userId, …)
                           ↓
                 services/playlists.createPlaylist(userId, "Road Trip")
                           ↓
                 returns { created: "Road Trip" }

LLM ───► tool_call: add_track_to_playlist({ playlistName: "Road Trip",
                                            trackName:    "Turbo Charged" })
                           ↓
                 resolve playlist by name, resolve track by name,
                 services/playlists.addTrackToPlaylist(…)
                           ↓
                 returns { added: "Turbo Charged", to: "Road Trip" }

LLM ───► final assistant message: "Done — Road Trip created and
                                    Turbo Charged is in it."
```

Implementation notes:

- The tool schema in `ai/tools.js` is provider-neutral; it's converted to
  both Anthropic's format and OpenAI's `{ type: 'function', function: {…} }`
  format at the bottom of the file.
- Each LLM turn that calls a tool whose name is in a `MUTATING` set bumps
  a `changed` flag. When the round-trip ends, the API response includes
  `{ reply, changed }`. If `changed === true`, the frontend re-fetches
  tracks/likes/playlists and re-renders.
- A hard cap of 8 tool-calling steps prevents runaway loops.

---

## Frontend module map

The frontend has no build step. Browser ES modules import from each other
directly. The boot sequence is in `js/main.js`:

```
initAuth        — wires the sign-in form and the password eye toggle
initLibraryDrawer — wires the drawer toggle
initViews         — wires nav tabs, chips, genre cards, hero buttons
initPlaybackBridge — wires the audio engine callbacks to the UI
initPlayerControls — wires play/pause/next/prev/volume/shortcuts
initVisualizer    — starts the requestAnimationFrame loop
initAiPanel       — wires the chat input + send
↓ (after first sign-in)
bootApp           — loads tracks/likes/playlists, renders the library
                    and the home view
```

Modules collaborate via the shared `state` object exported from
`core/state.js`. After any mutation that affects what the user sees
(a new playlist, a like change, an AI-driven update), the responsible
module calls `renderLibrary()` and/or `refreshCurrentView()`.

---

## Running it locally

You need Node.js 22.5 or newer.

```powershell
git clone https://github.com/supratik0000/tunecraft.git
cd tunecraft
.\install.bat          # npm install + creates server\.env from .env.example
.\fetch-audio.bat      # downloads the 17 SoundHelix MP3s
.\start.bat            # runs the server, opens the browser at :4000
```

By default the server uses a local SQLite file (`server/data/app.db`).
No external service is required.

A demo account exists at `test@example.com / secret123` (only after the
DB has been seeded once; reset with `reset-db.bat`).

To enable the AI assistant, drop a free Groq key into `server/.env`:

```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

Other supported providers: Gemini (free tier), OpenRouter (free models),
Ollama (local, no key), OpenAI (paid), Anthropic (paid).

---

## Deployment

### Render

The repo ships with a `render.yaml` blueprint, so deployment is one click
from the "Deploy to Render" badge at the top. Render's free tier covers
this app with two trade-offs:

- 15-minute idle sleep — first request after a sleep takes ~30 s while
  the container wakes.
- Ephemeral filesystem — the local SQLite file is wiped every redeploy.
  This is solved by attaching Turso (next section).

Render auto-deploys on every push to `main`.

### Turso (persistent database)

For real persistence I use Turso, a managed libSQL service. The free
tier covers 9 GB / 1 B reads / 25 M writes per month — far more than
this app will ever consume. Setup is three values:

1. Sign up at https://turso.tech (GitHub OAuth).
2. Create a database named `tunecraft` in the dashboard.
3. Copy the `libsql://…` URL and a generated auth token.
4. In the Render dashboard → Environment, set
   `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
5. Render redeploys; from then on every account and playlist persists.

The server code is the same regardless — `db/connection.js` opens
whichever URL is configured.

---

## API reference

| Method & path                                | Auth | Purpose |
|----------------------------------------------|:----:|---|
| `POST /api/auth/register`                    | –    | Create account → `{ token, user }` |
| `POST /api/auth/login`                       | –    | Log in → `{ token, user }` |
| `GET  /api/auth/me`                          | ✓    | Current user |
| `GET  /api/tracks`                           | –    | List all tracks |
| `POST /api/tracks`                           | ✓    | Add a track |
| `POST /api/tracks/:id/art`                   | ✓    | Upload album art `{ dataUrl }` |
| `GET  /api/likes`                            | ✓    | Liked track ids |
| `PUT  /api/likes/:trackId`                   | ✓    | `{ liked: true \| false }` |
| `GET  /api/playlists`                        | ✓    | List with track ids |
| `POST /api/playlists`                        | ✓    | Create `{ name }` |
| `PATCH /api/playlists/:id`                   | ✓    | Rename `{ name }` |
| `DELETE /api/playlists/:id`                  | ✓    | Delete |
| `POST /api/playlists/:id/tracks`             | ✓    | Add `{ trackId }` |
| `DELETE /api/playlists/:id/tracks/:trackId`  | ✓    | Remove track |
| `POST /api/agent/chat`                       | ✓    | Talk to AI `{ message, history }` |
| `GET  /api/agent/status`                     | –    | Whether the AI is configured |
| `GET  /api/health`                           | –    | Service liveness + catalog count |

Auth header on protected requests: `Authorization: Bearer <jwt>`.

---

## Trade-offs I made

| Trade-off | What I chose | What I gave up |
|---|---|---|
| **No build step on the frontend.** Vanilla ES modules instead of Vite/Webpack. | Zero build complexity, instant edit-reload, simpler deployment. | TypeScript, JSX, code-splitting, tree-shaking. Acceptable at this size. |
| **JWT in localStorage** instead of HttpOnly cookies. | Simpler implementation, works fine for a single-origin SPA. | More XSS exposure. I'd switch to HttpOnly + SameSite for a production product. |
| **Real audio = SoundHelix only.** I deliberately do not host commercial music. | Legal safety — the app can sit on a public URL without DMCA risk. | Recognisable songs. The catalog metadata is original Bollywood/Bengali names, but the actual audio is the same SoundHelix instrumental rotation. |
| **Synchronous-feeling service layer, even though libSQL is async.** | Routes await services directly; no callback nesting. | A small amount of `async/await` noise in service calls. |
| **No client-side bundler.** Each module is its own file the browser fetches. | Easy to inspect what the browser does. | More HTTP requests on first load. HTTP/2 multiplexing makes this a non-issue in practice. |
| **Render free tier.** | $0 hosting, public URL, TLS for free. | 15-min idle sleep, longer build times because MP3s download every deploy. |

---

## What I would build next

- **Move JWT to HttpOnly cookies** with a CSRF token, so a script injection
  can't read the session.
- **Confirmation-email flow** using a transactional service (Resend / SendGrid
  free tier). Today email validity is checked at the DNS level; the next step
  is verifying the address actually receives mail.
- **Rate limiting** on `/api/auth/login` and `/api/agent/chat` (per-IP token
  bucket).
- **Audio streaming** with `Range` requests so seeking large files doesn't
  re-download from zero.
- **Mobile UI pass** — the layout is responsive but the player bar gets
  cramped under ~700 px and could collapse further.
- **Turso embedded-replica** — keep a local read-only SQLite cache that
  syncs from Turso, removing the per-query network hop.

---

## License

MIT. Build on it freely.
