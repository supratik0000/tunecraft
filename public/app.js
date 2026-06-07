import { Synth } from './synth.js';

// ═══════════════════════════════════════════════════
//  API CLIENT
// ═══════════════════════════════════════════════════
const TOKEN_KEY = 'tc_token';
let token = localStorage.getItem(TOKEN_KEY) || null;

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) { const e = new Error(data.error || 'Request failed'); e.status = res.status; e.data = data; throw e; }
  return data;
}

// ═══════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════
const synth = new Synth();
let user = null;
let tracks = [];                 // all tracks
let trackById = new Map();
let likes = new Set();           // liked track ids
let playlists = [];              // [{id,name,trackIds}]
let queue = [], qIdx = -1, shuffled = false, repeated = false;
let currentView = { type: 'home' };
let dragging = false;

const $ = (id) => document.getElementById(id);
const fmt = (s) => { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s/60), ss = Math.floor(s%60); return `${m}:${String(ss).padStart(2,'0')}`; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2400);
}

function artHtml(t) {
  return t.art ? `<img class="art-img" src="${esc(t.art)}" alt="">` : esc(t.emoji);
}

function hsvg(on, sz = 15) {
  return on
    ? `<svg viewBox="0 0 24 24" fill="var(--rose)" stroke="none" width="${sz}" height="${sz}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="${sz}" height="${sz}"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;
}

// ═══════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════
let authMode = 'login';

function showAuth() { $('auth').classList.remove('hidden'); $('app').classList.add('hidden'); }
function showApp() { $('auth').classList.add('hidden'); $('app').classList.remove('hidden'); }

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  $('auth').classList.toggle('signup', signup);
  $('auth-title').textContent = signup ? 'Create your account' : 'Welcome back';
  $('auth-sub').textContent = signup ? 'Set up your personal Tunecraft library.' : 'Sign in to your Tunecraft account.';
  $('af-submit').textContent = signup ? 'Create account' : 'Sign in';
  $('auth-toggle').innerHTML = signup
    ? 'Already have an account? <a id="auth-switch">Sign in</a>'
    : 'New here? <a id="auth-switch">Create an account</a>';
  $('auth-switch').onclick = () => setAuthMode(signup ? 'login' : 'signup');
  $('auth-err').textContent = '';
}

$('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('af-email').value.trim();
  const password = $('af-pass').value;
  const displayName = $('af-name').value.trim();
  const btn = $('af-submit'); btn.disabled = true;
  $('auth-err').textContent = '';
  try {
    const path = authMode === 'signup' ? '/auth/register' : '/auth/login';
    const data = await api(path, { method: 'POST', body: { email, password, displayName } });
    token = data.token; localStorage.setItem(TOKEN_KEY, token);
    user = data.user;
    await bootApp();
  } catch (err) {
    $('auth-err').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

function signOut() {
  token = null; user = null; localStorage.removeItem(TOKEN_KEY);
  synth.stop();
  $('usermenu').classList.add('hidden');
  showAuth();
}
$('signout').addEventListener('click', signOut);
$('avatar').addEventListener('click', (e) => { e.stopPropagation(); $('usermenu').classList.toggle('hidden'); });
document.addEventListener('click', () => $('usermenu').classList.add('hidden'));
$('usermenu').addEventListener('click', (e) => e.stopPropagation());

// ═══════════════════════════════════════════════════
//  DATA LOADING
// ═══════════════════════════════════════════════════
async function loadTracks() {
  const { tracks: t } = await api('/tracks');
  tracks = t;
  trackById = new Map(tracks.map((x) => [String(x.id), x]));
}
async function loadLikes() {
  const { likes: l } = await api('/likes');
  likes = new Set(l.map(String));
}
async function loadPlaylists() {
  const { playlists: p } = await api('/playlists');
  playlists = p;
}

async function bootApp() {
  showApp();
  $('avatar').textContent = (user.displayName || user.email)[0].toUpperCase();
  $('um-name').textContent = user.displayName || 'You';
  $('um-mail').textContent = user.email;
  const h = new Date().getHours();
  $('greeting').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  await Promise.all([loadTracks(), loadLikes(), loadPlaylists()]);
  renderSidebar();
  renderHome();
}

// ═══════════════════════════════════════════════════
//  ROW RENDERING
// ═══════════════════════════════════════════════════
function buildRow(t, idx, ctx) {
  const isL = likes.has(String(t.id));
  const actionBtn = ctx?.playlistId
    ? `<button class="addb" data-remove="${t.id}" title="Remove from playlist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg></button>`
    : `<button class="addb" data-add="${t.id}" title="Add to playlist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button>`;
  return `<div class="row" data-idx="${idx}" tabindex="0">
    <div class="rnw">
      <span class="rnum">${idx+1}</span>
      <div class="rpi">
        <svg class="psv" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
        <div class="eq-bars"><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div></div>
      </div>
    </div>
    <div class="rmain">
      <div class="rart ${t.color}">${artHtml(t)}</div>
      <div class="rinfo">
        <div class="rtitle">${esc(t.name)}</div>
        <div class="rartist">${esc(t.artist)}</div>
      </div>
    </div>
    <div class="ralbum">${esc(t.album)}</div>
    <div class="rdw">
      ${actionBtn}
      <button class="hb${isL?' liked':''}" data-id="${t.id}">${hsvg(isL)}</button>
      <span class="rdur">${fmt(t.duration)}</span>
    </div>
  </div>`;
}

function renderRows(el, list, ctx = {}) {
  el.innerHTML = list.length
    ? list.map((t, i) => buildRow(t, i, ctx)).join('')
    : `<div class="empty"><h3>Nothing here yet</h3><p>${esc(ctx.emptyMsg || 'No tracks')}</p></div>`;
  el.querySelectorAll('.row').forEach((row) => {
    const t = list[+row.dataset.idx];
    row.addEventListener('click', (e) => {
      if (e.target.closest('.hb') || e.target.closest('.addb')) return;
      playQueue(list, +row.dataset.idx);
    });
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter') row.click(); });
  });
  el.querySelectorAll('.hb').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleLike(btn.dataset.id); });
  });
  el.querySelectorAll('.addb[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openAddMenu(btn.dataset.add, btn); });
  });
  el.querySelectorAll('.addb[data-remove]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await api(`/playlists/${ctx.playlistId}/tracks/${btn.dataset.remove}`, { method: 'DELETE' });
      await loadPlaylists();
      toast('Removed from playlist');
      openPlaylist(ctx.playlistId);
      renderSidebar();
    });
  });
  highlightPlaying();
}

function highlightPlaying() {
  const cur = queue[qIdx];
  document.querySelectorAll('.row').forEach((r) => {
    const t = currentRowList?.[+r.dataset.idx];
    r.classList.toggle('playing', !!(cur && t && String(t.id) === String(cur.id)));
  });
}
let currentRowList = [];

// ═══════════════════════════════════════════════════
//  ADD-TO-PLAYLIST MENU
// ═══════════════════════════════════════════════════
function openAddMenu(trackId, anchor) {
  document.querySelectorAll('.addmenu').forEach((m) => m.remove());
  const menu = document.createElement('div');
  menu.className = 'usermenu addmenu';
  const r = anchor.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.left = Math.max(8, r.left - 150) + 'px';
  menu.style.top = (r.bottom + 6) + 'px';
  menu.style.zIndex = 400;
  const items = playlists.map((p) => `<button data-pl="${p.id}">${esc(p.name)}</button>`).join('')
    || '<div class="um-mail">No playlists yet</div>';
  menu.innerHTML = `<div class="um-name" style="font-size:12px">Add to playlist</div>${items}<button data-newpl="1" style="color:var(--brand)">+ New playlist…</button>`;
  document.body.appendChild(menu);
  const close = () => menu.remove();
  setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
  menu.addEventListener('click', async (e) => {
    e.stopPropagation();
    const plBtn = e.target.closest('[data-pl]');
    const newBtn = e.target.closest('[data-newpl]');
    if (plBtn) {
      await api(`/playlists/${plBtn.dataset.pl}/tracks`, { method: 'POST', body: { trackId } });
      await loadPlaylists(); renderSidebar(); toast('Added to playlist'); close();
    } else if (newBtn) {
      close();
      const name = prompt('New playlist name:');
      if (!name) return;
      const { playlist } = await api('/playlists', { method: 'POST', body: { name } });
      await api(`/playlists/${playlist.id}/tracks`, { method: 'POST', body: { trackId } });
      await loadPlaylists(); renderSidebar(); toast(`Added to “${name}”`);
    }
  });
}

// ═══════════════════════════════════════════════════
//  SIDEBAR (playlists)
// ═══════════════════════════════════════════════════
function renderSidebar(filter = '') {
  const f = filter.toLowerCase();
  const likedCount = likes.size;
  let html = `<div class="side-label">Playlists <button id="add-pl2" title="New playlist">+</button></div>`;
  html += `<div class="pl-item" data-liked="1">
      <div class="pl-ic liked">♥</div>
      <div class="pl-info"><div class="pl-name">Liked Songs</div><div class="pl-meta">${likedCount} song${likedCount===1?'':'s'}</div></div>
    </div>`;
  for (const p of playlists) {
    if (f && !p.name.toLowerCase().includes(f)) continue;
    html += `<div class="pl-item" data-pl="${p.id}">
      <div class="pl-ic">♪</div>
      <div class="pl-info"><div class="pl-name">${esc(p.name)}</div><div class="pl-meta">${p.trackIds.length} song${p.trackIds.length===1?'':'s'}</div></div>
    </div>`;
  }
  $('slist').innerHTML = html;
  $('slist').querySelector('[data-liked]')?.addEventListener('click', openLiked);
  $('slist').querySelectorAll('[data-pl]').forEach((el) => el.addEventListener('click', () => openPlaylist(+el.dataset.pl)));
  $('add-pl2')?.addEventListener('click', (e) => { e.stopPropagation(); createPlaylistPrompt(); });
  // reflect active view
  if (currentView.type === 'liked') $('slist').querySelector('[data-liked]')?.classList.add('on');
  if (currentView.type === 'playlist') $('slist').querySelector(`[data-pl="${currentView.id}"]`)?.classList.add('on');
}

async function createPlaylistPrompt() {
  const name = prompt('New playlist name:');
  if (!name || !name.trim()) return;
  await api('/playlists', { method: 'POST', body: { name: name.trim() } });
  await loadPlaylists(); renderSidebar();
  toast(`Created “${name.trim()}”`);
}
$('new-pl-btn').addEventListener('click', createPlaylistPrompt);
$('sf').addEventListener('input', (e) => renderSidebar(e.target.value));

// ═══════════════════════════════════════════════════
//  VIEWS
// ═══════════════════════════════════════════════════
function showOnly(viewId) {
  ['home-c', 'search-sec', 'list-view'].forEach((id) => $(id).classList.toggle('hidden', id !== viewId));
}

function renderHome() {
  currentView = { type: 'home' };
  showOnly('home-c');
  loadMain('all');
  renderSidebar($('sf').value);
}
let mainGenre = 'all';
function filterByGenre(g) { return (g === 'all' || !g) ? tracks : tracks.filter((t) => t.genre === g); }
function loadMain(genre = mainGenre) {
  mainGenre = genre;
  const list = filterByGenre(genre);
  currentRowList = list;
  renderRows($('tlist'), list, { emptyMsg: 'No tracks in this genre' });
}

function openLiked() {
  currentView = { type: 'liked' };
  const list = tracks.filter((t) => likes.has(String(t.id)));
  showListView({ kind: 'Playlist', title: 'Liked Songs', sub: `${list.length} song${list.length===1?'':'s'} you love`, list, ctx: {} });
  renderSidebar($('sf').value);
}

function openPlaylist(id) {
  const p = playlists.find((x) => x.id === id);
  if (!p) { renderHome(); return; }
  currentView = { type: 'playlist', id };
  const list = p.trackIds.map((tid) => trackById.get(String(tid))).filter(Boolean);
  showListView({
    kind: 'Playlist', title: p.name, sub: `${list.length} song${list.length===1?'':'s'}`,
    list, ctx: { playlistId: id, emptyMsg: 'Add songs from Home or ask the AI assistant' },
    rename: () => renamePlaylist(p), del: () => deletePlaylist(p),
  });
  renderSidebar($('sf').value);
}

function openGenre(g, label) {
  currentView = { type: 'genre', g };
  const list = filterByGenre(g);
  showListView({ kind: 'Genre', title: label, sub: `${list.length} tracks`, list, ctx: {} });
}

function showListView({ kind, title, sub, list, ctx, rename, del }) {
  showOnly('list-view');
  $('lv-kind').textContent = kind;
  $('lv-title').textContent = title;
  $('lv-sub').textContent = sub;
  currentRowList = list;
  renderRows($('lv-list'), list, ctx);
  $('lv-play').onclick = () => { if (list.length) playQueue(list, 0); };
  $('lv-rename').classList.toggle('hidden', !rename);
  $('lv-delete').classList.toggle('hidden', !del);
  if (rename) $('lv-rename').onclick = rename;
  if (del) $('lv-delete').onclick = del;
  $('main').scrollTo({ top: 0 });
}
$('lv-back').addEventListener('click', renderHome);

async function renamePlaylist(p) {
  const name = prompt('Rename playlist:', p.name);
  if (!name || !name.trim()) return;
  await api(`/playlists/${p.id}`, { method: 'PATCH', body: { name: name.trim() } });
  await loadPlaylists(); renderSidebar(); openPlaylist(p.id);
}
async function deletePlaylist(p) {
  if (!confirm(`Delete playlist “${p.name}”?`)) return;
  await api(`/playlists/${p.id}`, { method: 'DELETE' });
  await loadPlaylists(); renderHome();
  toast('Playlist deleted');
}

// ═══════════════════════════════════════════════════
//  PLAYBACK
// ═══════════════════════════════════════════════════
function playQueue(list, idx) { queue = list.slice(); qIdx = idx; play(queue[qIdx]); }

function play(t) {
  if (!t) return;
  qIdx = queue.findIndex((x) => String(x.id) === String(t.id));
  synth.load(t); synth.play();
  synth.setVolume(parseFloat($('vf').style.width) / 100 || 0.7);
  $('ntitle').textContent = t.name;
  $('nartist').textContent = t.artist;
  const na = $('na'); na.className = `na ${t.color}`;
  na.innerHTML = `${t.art ? `<img class="art-img" src="${esc(t.art)}" alt="">` : `<span class="na-emoji">${esc(t.emoji)}</span>`}<span class="na-cam">📷</span>`;
  $('picon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  syncNowHeart();
  highlightPlaying();
}

synth.ontime = (cur, dur) => {
  if (dragging) return;
  $('pfill').style.width = (cur/dur*100) + '%';
  $('tcur').textContent = fmt(cur);
  $('ttot').textContent = fmt(dur);
};
synth.onended = () => { repeated ? synth.play() : goNext(); };

function goNext() {
  if (!queue.length) return;
  qIdx = shuffled ? Math.floor(Math.random()*queue.length) : (qIdx+1) % queue.length;
  play(queue[qIdx]);
}
function goPrev() {
  if (!queue.length) return;
  if (synth.currentTime > 3) { synth.seek(0); return; }
  qIdx = (qIdx-1+queue.length) % queue.length;
  play(queue[qIdx]);
}

async function toggleLike(id) {
  id = String(id);
  const nowLiked = !likes.has(id);
  try {
    await api(`/likes/${id}`, { method: 'PUT', body: { liked: nowLiked } });
  } catch (e) { toast(e.message); return; }
  if (nowLiked) likes.add(id); else likes.delete(id);
  // update any visible heart buttons for this track
  document.querySelectorAll(`.hb[data-id="${id}"]`).forEach((b) => {
    b.classList.toggle('liked', nowLiked); b.innerHTML = hsvg(nowLiked);
  });
  syncNowHeart();
  renderSidebar($('sf').value);
  if (currentView.type === 'liked') openLiked();
  toast(nowLiked ? '♥ Added to Liked Songs' : 'Removed from Liked Songs');
}
function syncNowHeart() {
  const t = queue[qIdx]; if (!t) return;
  const on = likes.has(String(t.id));
  $('nheart').classList.toggle('liked', on);
  $('nheart').innerHTML = hsvg(on, 18);
}

$('playb').addEventListener('click', () => {
  if (!synth.track) { toast('Pick a track first!'); return; }
  if (synth.isPlaying) { synth.pause(); $('picon').innerHTML = '<polygon points="5,3 19,12 5,21"/>'; }
  else { synth.play(); $('picon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'; }
});
$('nextb').addEventListener('click', goNext);
$('prevb').addEventListener('click', goPrev);
$('shuf').addEventListener('click', () => { shuffled = !shuffled; $('shuf').classList.toggle('on', shuffled); toast(shuffled ? '🔀 Shuffle on' : 'Shuffle off'); });
$('repb').addEventListener('click', () => { repeated = !repeated; $('repb').classList.toggle('on', repeated); toast(repeated ? '🔁 Repeat on' : 'Repeat off'); });
$('nheart').addEventListener('click', () => { const t = queue[qIdx]; if (t) toggleLike(t.id); });

// ── Album-art upload (click the now-playing artwork) ──
$('na').addEventListener('click', () => {
  if (!queue[qIdx]) { toast('Play a track first to set its artwork'); return; }
  $('art-input').click();
});
$('art-input').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  const t = queue[qIdx];
  if (!file || !t) return;
  if (file.size > 3 * 1024 * 1024) { toast('Image too large (max 3 MB)'); return; }
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
  });
  try {
    const { track } = await api(`/tracks/${t.id}/art`, { method: 'POST', body: { dataUrl } });
    // update local copies and re-render everything showing this track
    trackById.set(String(track.id), track);
    const inQueue = queue.find((x) => String(x.id) === String(track.id)); if (inQueue) inQueue.art = track.art;
    const inTracks = tracks.find((x) => String(x.id) === String(track.id)); if (inTracks) inTracks.art = track.art;
    if (String(queue[qIdx]?.id) === String(track.id)) {
      $('na').innerHTML = `<img class="art-img" src="${esc(track.art)}" alt=""><span class="na-cam">📷</span>`;
    }
    refreshCurrentView();
    toast('🖼 Artwork updated');
  } catch (err) { toast(err.message); }
});

$('ptrack').addEventListener('mousedown', (e) => { dragging = true; doScrub(e); });
document.addEventListener('mousemove', (e) => { if (dragging) doScrub(e); });
document.addEventListener('mouseup', () => { dragging = false; });
function doScrub(e) {
  const r = $('ptrack').getBoundingClientRect();
  const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  $('pfill').style.width = (p*100) + '%';
  synth.seek(p);
}
$('vt').addEventListener('click', (e) => {
  const r = $('vt').getBoundingClientRect();
  const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  $('vf').style.width = (p*100) + '%'; synth.setVolume(p);
});
let muted = false, prevV = 0.7;
$('vbtn').addEventListener('click', () => { muted = !muted; synth.setVolume(muted ? 0 : prevV); $('vf').style.width = (muted ? 0 : prevV*100) + '%'; });

document.addEventListener('keydown', (e) => {
  if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); $('playb').click(); }
  if (e.code === 'ArrowRight') synth.seek(Math.min(1, (synth.currentTime+10)/synth.duration));
  if (e.code === 'ArrowLeft')  synth.seek(Math.max(0, (synth.currentTime-10)/synth.duration));
});

// ── Waveform visualizer ──
const vizEl = $('viz');
for (let i = 0; i < 30; i++) { const b = document.createElement('div'); b.className = 'viz-bar'; b.style.height = '4px'; vizEl.appendChild(b); }
const vizBars = vizEl.querySelectorAll('.viz-bar');
function animateViz() {
  requestAnimationFrame(animateViz);
  const data = synth.getWaveform();
  vizBars.forEach((b, i) => {
    const v = data[i] || 0;
    b.style.height = (synth.isPlaying ? Math.max(4, v/255*52) : 4) + 'px';
    b.style.opacity = synth.isPlaying ? '0.8' : '0.3';
  });
}
animateViz();

// ── Search ──
let sTimer;
$('si').addEventListener('input', (e) => {
  clearTimeout(sTimer);
  const q = e.target.value.trim().toLowerCase();
  if (!q) { renderHome(); return; }
  sTimer = setTimeout(() => doSearch(q), 250);
});
function doSearch(q) {
  showOnly('search-sec');
  $('sh').textContent = `“${q}”`;
  const res = tracks.filter((t) => [t.name,t.artist,t.album,t.genre].some((f) => String(f).toLowerCase().includes(q)));
  currentRowList = res;
  renderRows($('sr'), res, { emptyMsg: 'No matches' });
}
$('cs').addEventListener('click', () => { $('si').value = ''; renderHome(); });

// ── Chips / genre cards / hero ──
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
    chip.classList.add('on');
    $('si').value = '';
    renderHome();
    loadMain(chip.dataset.g);
  });
});
document.querySelectorAll('.gc').forEach((card) => {
  card.addEventListener('click', () => openGenre(card.dataset.g, card.querySelector('h3').textContent));
});
$('shuffle-btn2').addEventListener('click', () => {
  shuffled = true; $('shuf').classList.add('on');
  playQueue(tracks, Math.floor(Math.random()*tracks.length));
  toast('🔀 Shuffling all tracks');
});
$('browse-btn').addEventListener('click', () => $('main').scrollTo({ top: $('gsec').offsetTop - 80, behavior: 'smooth' }));
$('rfr').addEventListener('click', () => {
  const shuffledList = [...filterByGenre(mainGenre)].sort(() => Math.random() - .5);
  currentRowList = shuffledList;
  renderRows($('tlist'), shuffledList, {});
  toast('↻ Shuffled list');
});

// ── Rail nav ──
function setNav(id) { ['nb-home','nb-search','nb-ai'].forEach((x) => $(x).classList.toggle('on', x === id)); }
$('nb-home').addEventListener('click', () => { setNav('nb-home'); $('si').value = ''; renderHome(); });
$('nb-search').addEventListener('click', () => { setNav('nb-search'); $('si').focus(); });
$('nb-ai').addEventListener('click', () => { setNav('nb-ai'); openAI(); });

// ═══════════════════════════════════════════════════
//  AI ASSISTANT
// ═══════════════════════════════════════════════════
let aiHistory = [];
let aiGreeted = false;

function openAI() { $('ai-panel').classList.add('open'); if (!aiGreeted) { addBot(`Hi ${user?.displayName || 'there'}! I can add songs, build playlists, and organize your library. Try “make a playlist called Road Trip and add Turbo Charged”.`); aiGreeted = true; } $('ai-text').focus(); }
function closeAI() { $('ai-panel').classList.remove('open'); }
$('ai-open').addEventListener('click', openAI);
$('ai-close').addEventListener('click', closeAI);

function addMsg(text, cls) {
  const el = document.createElement('div');
  el.className = 'msg ' + cls; el.textContent = text;
  $('ai-body').appendChild(el); $('ai-body').scrollTop = $('ai-body').scrollHeight;
  return el;
}
const addBot = (t) => addMsg(t, 'bot');
const addUser = (t) => addMsg(t, 'user');

async function sendAI(text) {
  text = text.trim(); if (!text) return;
  addUser(text);
  aiHistory.push({ role: 'user', content: text });
  $('ai-text').value = '';
  $('ai-send').disabled = true;
  const typing = document.createElement('div');
  typing.className = 'typing'; typing.innerHTML = '<span></span><span></span><span></span>';
  $('ai-body').appendChild(typing); $('ai-body').scrollTop = $('ai-body').scrollHeight;
  try {
    const data = await api('/agent/chat', { method: 'POST', body: { message: text, history: aiHistory.slice(0, -1) } });
    typing.remove();
    addBot(data.reply);
    aiHistory.push({ role: 'assistant', content: data.reply });
    if (data.changed) {
      await Promise.all([loadTracks(), loadLikes(), loadPlaylists()]);
      renderSidebar($('sf').value);
      refreshCurrentView();
    }
  } catch (err) {
    typing.remove();
    if (err.status === 503) addMsg(err.message, 'sys');
    else addMsg('⚠ ' + err.message, 'sys');
  } finally {
    $('ai-send').disabled = false;
    $('ai-text').focus();
  }
}
function refreshCurrentView() {
  if (currentView.type === 'home') loadMain();
  else if (currentView.type === 'liked') openLiked();
  else if (currentView.type === 'playlist') openPlaylist(currentView.id);
  else if (currentView.type === 'genre') openGenre(currentView.g, $('lv-title').textContent);
}
$('ai-send').addEventListener('click', () => sendAI($('ai-text').value));
$('ai-text').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAI($('ai-text').value); });
$('ai-suggest').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => sendAI(b.dataset.q)));

// ═══════════════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════════════
(async function init() {
  setAuthMode('login');
  if (token) {
    try { const { user: u } = await api('/auth/me'); user = u; await bootApp(); return; }
    catch { token = null; localStorage.removeItem(TOKEN_KEY); }
  }
  showAuth();
})();
