// Left-side library drawer — playlist list + Liked Songs entry, with
// search, create, rename, delete. Slides in/out from the brand bar's
// Library button.
import { state, loadPlaylists } from '../core/state.js';
import { api } from '../core/api.js';
import { $, $$, esc, toast } from '../core/util.js';
import { openLiked, openPlaylist, refreshCurrentView, goHome } from './views.js';

export function initLibraryDrawer() {
  $('lib-toggle').addEventListener('click', toggleDrawer);
  $('backdrop').addEventListener('click', closeAllOverlays);

  $('ld-new-btn').addEventListener('click', createPlaylistPrompt);
  $('ld-filter').addEventListener('input', (e) => renderLibrary(e.target.value));
}

export function openDrawer()  { $('libdrawer').classList.add('open');    $('backdrop').classList.add('on'); }
export function closeDrawer() { $('libdrawer').classList.remove('open'); maybeHideBackdrop(); }
export function toggleDrawer(){ $('libdrawer').classList.contains('open') ? closeDrawer() : openDrawer(); }

function maybeHideBackdrop() {
  const aiOpen  = $('ai-panel').classList.contains('open');
  const libOpen = $('libdrawer').classList.contains('open');
  if (!aiOpen && !libOpen) $('backdrop').classList.remove('on');
}
export function closeAllOverlays() {
  $('libdrawer').classList.remove('open');
  $('ai-panel').classList.remove('open');
  $('backdrop').classList.remove('on');
}

export function renderLibrary(filter = '') {
  const f = filter.toLowerCase();
  const likedCount = state.likes.size;

  let html = `<div class="ld-label">Playlists</div>`;
  html += `<div class="ld-item" data-liked="1">
    <div class="ld-ic liked">♥</div>
    <div class="ld-info"><div class="ld-name">Liked Songs</div><div class="ld-meta">${likedCount} song${likedCount === 1 ? '' : 's'}</div></div>
  </div>`;

  for (const p of state.playlists) {
    if (f && !p.name.toLowerCase().includes(f)) continue;
    html += `<div class="ld-item" data-pl="${p.id}">
      <div class="ld-ic">♪</div>
      <div class="ld-info"><div class="ld-name">${esc(p.name)}</div><div class="ld-meta">${p.trackIds.length} song${p.trackIds.length === 1 ? '' : 's'}</div></div>
    </div>`;
  }
  $('ld-list').innerHTML = html;

  $('ld-list').querySelector('[data-liked]')?.addEventListener('click', () => { openLiked(); closeDrawer(); });
  $$('[data-pl]', $('ld-list')).forEach((el) => {
    el.addEventListener('click', () => { openPlaylist(+el.dataset.pl); closeDrawer(); });
  });

  // Reflect active selection
  if (state.view.type === 'liked')    $('ld-list').querySelector('[data-liked]')?.classList.add('on');
  if (state.view.type === 'playlist') $('ld-list').querySelector(`[data-pl="${state.view.id}"]`)?.classList.add('on');
}

export async function createPlaylistPrompt() {
  const name = prompt('New playlist name:');
  if (!name || !name.trim()) return;
  try {
    await api('/playlists', { method: 'POST', body: { name: name.trim() } });
    await loadPlaylists();
    renderLibrary($('ld-filter').value);
    toast(`Created "${name.trim()}"`);
  } catch (err) { toast(err.message); }
}

export async function renamePlaylist(p) {
  const name = prompt('Rename playlist:', p.name);
  if (!name || !name.trim()) return;
  try {
    await api(`/playlists/${p.id}`, { method: 'PATCH', body: { name: name.trim() } });
    await loadPlaylists();
    renderLibrary();
    openPlaylist(p.id);
  } catch (err) { toast(err.message); }
}

export async function deletePlaylist(p) {
  if (!confirm(`Delete playlist "${p.name}"?`)) return;
  try {
    await api(`/playlists/${p.id}`, { method: 'DELETE' });
    await loadPlaylists();
    goHome();
    toast('Playlist deleted');
  } catch (err) { toast(err.message); }
}
