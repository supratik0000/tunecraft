// View switching — home, list (playlist / liked / genre), search.
// Owns the brand-bar nav tabs and the chip / hero / genre-card events.
import { state } from '../core/state.js';
import { $, $$, esc } from '../core/util.js';
import { renderTracks } from './tracks-render.js';
import { playQueue } from './playback.js';
import { renamePlaylist, deletePlaylist, renderLibrary } from './library-drawer.js';

const VIEWS = ['view-home', 'view-list', 'view-search', 'view-credits'];
function showOnly(id) { VIEWS.forEach((v) => $(v).classList.toggle('hidden', v !== id)); }

export function openCredits() {
  state.view = { type: 'credits' };
  showOnly('view-credits');
  setNavTab('credits');
  $('content').scrollTo({ top: 0 });
}

function setNavTab(name) {
  $$('.bb-tab').forEach((t) => t.classList.toggle('on', t.dataset.nav === name));
}

// ── Home ────────────────────────────────────────────────────
function filterByGenre(g) {
  return (g === 'all' || !g) ? state.tracks : state.tracks.filter((t) => t.genre === g);
}

export function renderHome() {
  state.view = { type: 'home' };
  showOnly('view-home');
  setNavTab('home');
  loadMain(state.mainGenre);
  renderLibrary($('ld-filter').value);
}

export function loadMain(genre = state.mainGenre) {
  state.mainGenre = genre;
  const list = filterByGenre(genre);
  state.currentRowList = list;
  renderTracks($('home-cards'), list, { emptyMsg: 'No tracks in this genre' });
}

export const goHome = renderHome;

// ── List view: liked / playlist / genre ─────────────────────
export function openLiked() {
  state.view = { type: 'liked' };
  const list = state.tracks.filter((t) => state.likes.has(String(t.id)));
  showListView({
    kind: 'Playlist',
    title: 'Liked Songs',
    sub: `${list.length} song${list.length === 1 ? '' : 's'} you love`,
    list, ctx: {},
  });
  renderLibrary($('ld-filter').value);
}

export function openPlaylist(id) {
  const p = state.playlists.find((x) => x.id === id);
  if (!p) { renderHome(); return; }
  state.view = { type: 'playlist', id };
  const list = p.trackIds.map((tid) => state.trackById.get(String(tid))).filter(Boolean);
  showListView({
    kind: 'Playlist',
    title: p.name,
    sub:  `${list.length} song${list.length === 1 ? '' : 's'}`,
    list,
    ctx:  { playlistId: id, emptyMsg: 'Add songs from Home or ask the AI assistant', onRefresh: () => openPlaylist(id) },
    rename: () => renamePlaylist(p),
    del:    () => deletePlaylist(p),
  });
  renderLibrary($('ld-filter').value);
}

export function openGenre(g, label) {
  state.view = { type: 'genre', g };
  const list = filterByGenre(g);
  showListView({ kind: 'Genre', title: label, sub: `${list.length} tracks`, list, ctx: {} });
}

function showListView({ kind, title, sub, list, ctx, rename, del }) {
  showOnly('view-list');
  $('list-kind').textContent = kind;
  $('list-title').textContent = title;
  $('list-sub').textContent = sub;
  state.currentRowList = list;
  renderTracks($('list-cards'), list, ctx);

  $('list-play').onclick = () => { if (list.length) playQueue(list, 0); };
  $('list-rename').classList.toggle('hidden', !rename);
  $('list-delete').classList.toggle('hidden', !del);
  if (rename) $('list-rename').onclick = rename;
  if (del)    $('list-delete').onclick = del;

  $('content').scrollTo({ top: 0 });
}

// ── Search ──────────────────────────────────────────────────
let searchTimer;
function doSearch(q) {
  showOnly('view-search');
  $('search-title').textContent = `"${q}"`;
  const res = state.tracks.filter((t) =>
    [t.name, t.artist, t.album, t.genre].some((f) => String(f).toLowerCase().includes(q))
  );
  state.currentRowList = res;
  state.view = { type: 'search', q };
  renderTracks($('search-cards'), res, { emptyMsg: 'No matches' });
}

// ── Refresh after AI mutation ───────────────────────────────
export function refreshCurrentView() {
  const v = state.view;
  if (v.type === 'home')     loadMain();
  else if (v.type === 'liked')    openLiked();
  else if (v.type === 'playlist') openPlaylist(v.id);
  else if (v.type === 'genre')    openGenre(v.g, $('list-title').textContent);
  else if (v.type === 'search')   doSearch(v.q);
}

// ── Wire-up ─────────────────────────────────────────────────
export function initViews() {
  // Brand-bar nav tabs
  $$('.bb-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.nav;
      if (target === 'home')    { $('search-input').value = ''; renderHome(); }
      if (target === 'browse')  { renderHome(); document.getElementById('genre-section')?.scrollIntoView({ behavior: 'smooth' }); }
      if (target === 'ai')      { /* handled in ai-panel.js */ }
      if (target === 'credits') { openCredits(); }
      setNavTab(target);
    });
  });

  // Genre chips
  $$('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach((c) => c.classList.remove('on'));
      chip.classList.add('on');
      $('search-input').value = '';
      renderHome();
      loadMain(chip.dataset.genre);
    });
  });

  // Genre cards
  $$('.genre-card').forEach((card) => {
    card.addEventListener('click', () =>
      openGenre(card.dataset.genre, card.querySelector('h3').textContent)
    );
  });

  // Hero buttons
  $('hero-shuffle').addEventListener('click', () => {
    state.shuffled = true;
    $('pb-shuffle').classList.add('on');
    if (state.tracks.length) playQueue(state.tracks, Math.floor(Math.random() * state.tracks.length));
  });
  $('hero-browse').addEventListener('click', () =>
    document.getElementById('genre-section')?.scrollIntoView({ behavior: 'smooth' })
  );
  $('home-shuffle-list').addEventListener('click', () => {
    const list = [...filterByGenre(state.mainGenre)].sort(() => Math.random() - 0.5);
    state.currentRowList = list;
    renderTracks($('home-cards'), list, {});
  });

  // Back / clear buttons
  $('list-back').addEventListener('click', renderHome);
  $('search-clear').addEventListener('click', () => { $('search-input').value = ''; renderHome(); });
  $('credits-back').addEventListener('click', renderHome);

  // Top-bar search input
  $('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim().toLowerCase();
    if (!q) { renderHome(); return; }
    searchTimer = setTimeout(() => doSearch(q), 250);
  });
}
