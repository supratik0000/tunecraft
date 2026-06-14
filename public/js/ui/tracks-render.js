// Renders tracks as cards (the layout's primary track representation).
// Also owns the "add to playlist" popover used from each card.
import { state, loadPlaylists } from '../core/state.js';
import { api } from '../core/api.js';
import { $, $$, esc, fmt, heartSvg, artHtml, toast } from '../core/util.js';
import { playQueue, toggleLike } from './playback.js';
import { renderLibrary } from './library-drawer.js';

// ── Card builder ────────────────────────────────────────────
function buildCard(t, idx, ctx) {
  const liked = state.likes.has(String(t.id));
  const actionBtn = ctx?.playlistId
    ? `<button class="tcard-iconbtn" data-remove="${t.id}" title="Remove from playlist">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
       </button>`
    : `<button class="tcard-iconbtn" data-add="${t.id}" title="Add to playlist">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
       </button>`;

  return `<div class="tcard" data-idx="${idx}" tabindex="0">
    <div class="tcard-art ${esc(t.color)}">
      ${artHtml(t)}
      <button class="tcard-play" title="Play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>
    </div>
    <div class="tcard-title">${esc(t.name)}</div>
    <div class="tcard-artist">${esc(t.artist)}</div>
    <div class="tcard-meta">
      <span class="tcard-dur">${fmt(t.duration)}</span>
      <div class="tcard-actions">
        ${actionBtn}
        <button class="tcard-iconbtn heart-btn${liked ? ' liked' : ''}" data-id="${t.id}" title="${liked ? 'Unlike' : 'Like'}">${heartSvg(liked)}</button>
      </div>
    </div>
  </div>`;
}

export function renderTracks(el, list, ctx = {}) {
  el.innerHTML = list.length
    ? list.map((t, i) => buildCard(t, i, ctx)).join('')
    : `<div class="empty"><h3>Nothing here yet</h3><p>${esc(ctx.emptyMsg || 'No tracks')}</p></div>`;

  $$('.tcard', el).forEach((card) => {
    const t = list[+card.dataset.idx];
    if (!t) return;

    const playIt = (e) => {
      if (e.target.closest('.heart-btn') || e.target.closest('[data-add]') || e.target.closest('[data-remove]')) return;
      playQueue(list, +card.dataset.idx);
    };
    card.addEventListener('click', playIt);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') card.click(); });

    const heart = card.querySelector('.heart-btn');
    heart.addEventListener('click', (e) => { e.stopPropagation(); toggleLike(heart.dataset.id); });

    const addBtn = card.querySelector('[data-add]');
    if (addBtn) addBtn.addEventListener('click', (e) => { e.stopPropagation(); openAddMenu(addBtn.dataset.add, addBtn); });

    const removeBtn = card.querySelector('[data-remove]');
    if (removeBtn) {
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await api(`/playlists/${ctx.playlistId}/tracks/${removeBtn.dataset.remove}`, { method: 'DELETE' });
          await loadPlaylists();
          toast('Removed from playlist');
          ctx.onRefresh?.();
          renderLibrary();
        } catch (err) { toast(err.message); }
      });
    }
  });

  highlightPlaying(list);
}

export function highlightPlaying(list = state.currentRowList) {
  const cur = state.queue[state.qIdx];
  $$('.tcard').forEach((card) => {
    const t = list?.[+card.dataset.idx];
    card.classList.toggle('playing', !!(cur && t && String(t.id) === String(cur.id)));
  });
}

// ── "Add to playlist" popover ───────────────────────────────
function openAddMenu(trackId, anchor) {
  $$('.addmenu').forEach((m) => m.remove());
  const menu = document.createElement('div');
  menu.className = 'addmenu';

  const r = anchor.getBoundingClientRect();
  menu.style.left = Math.max(8, r.left - 150) + 'px';
  menu.style.top = (r.bottom + 6) + 'px';

  const items = state.playlists.map((p) => `<button data-pl="${p.id}">${esc(p.name)}</button>`).join('')
    || '<div class="empty" style="padding:8px 6px;font-size:12px">No playlists yet</div>';

  menu.innerHTML = `<div class="addmenu-title">Add to playlist</div>${items}<button class="new-pl" data-newpl="1">+ New playlist…</button>`;
  document.body.appendChild(menu);

  const close = () => menu.remove();
  setTimeout(() => document.addEventListener('click', close, { once: true }), 0);

  menu.addEventListener('click', async (e) => {
    e.stopPropagation();
    const plBtn = e.target.closest('[data-pl]');
    const newBtn = e.target.closest('[data-newpl]');
    if (plBtn) {
      try {
        await api(`/playlists/${plBtn.dataset.pl}/tracks`, { method: 'POST', body: { trackId } });
        await loadPlaylists();
        renderLibrary();
        toast('Added to playlist');
      } catch (err) { toast(err.message); }
      close();
    } else if (newBtn) {
      close();
      const name = prompt('New playlist name:');
      if (!name) return;
      try {
        const { playlist } = await api('/playlists', { method: 'POST', body: { name } });
        await api(`/playlists/${playlist.id}/tracks`, { method: 'POST', body: { trackId } });
        await loadPlaylists();
        renderLibrary();
        toast(`Added to "${name}"`);
      } catch (err) { toast(err.message); }
    }
  });
}
