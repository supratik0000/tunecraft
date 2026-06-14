// Playback orchestration — bridges the audio Player to the rest of the UI.
// All "play this list", "next/prev", "toggle like" actions go through here
// so the now-playing display, library, and views stay in sync.
import { state, loadPlaylists } from '../core/state.js';
import { api } from '../core/api.js';
import { $, esc, heartSvg, toast } from '../core/util.js';
import { player } from '../audio/player.js';
import { highlightPlaying } from './tracks-render.js';
import { renderLibrary } from './library-drawer.js';
import { refreshCurrentView } from './views.js';

export function playQueue(list, idx) {
  state.queue = list.slice();
  state.qIdx = idx;
  play(state.queue[state.qIdx]);
}

export function play(t) {
  if (!t) return;
  state.qIdx = state.queue.findIndex((x) => String(x.id) === String(t.id));
  player.load(t);
  player.play();
  player.setVolume(parseFloat($('pb-vol-fill').style.width) / 100 || 0.7);

  $('pb-title').textContent = t.name;
  $('pb-artist').textContent = t.artist;

  const art = $('pb-art');
  art.className = `pb-art ${esc(t.color)}`;
  art.innerHTML = `${t.art ? `<img src="${esc(t.art)}" alt="">` : `<span class="pb-art-emoji">${esc(t.emoji)}</span>`}<span class="pb-art-cam">📷</span>`;
  $('pb-play-icon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

  syncNowHeart();
  highlightPlaying();
}

export function goNext() {
  if (!state.queue.length) return;
  state.qIdx = state.shuffled
    ? Math.floor(Math.random() * state.queue.length)
    : (state.qIdx + 1) % state.queue.length;
  play(state.queue[state.qIdx]);
}

export function goPrev() {
  if (!state.queue.length) return;
  if (player.currentTime > 3) { player.seek(0); return; }
  state.qIdx = (state.qIdx - 1 + state.queue.length) % state.queue.length;
  play(state.queue[state.qIdx]);
}

export async function toggleLike(id) {
  id = String(id);
  const nowLiked = !state.likes.has(id);
  try {
    await api(`/likes/${id}`, { method: 'PUT', body: { liked: nowLiked } });
  } catch (e) { toast(e.message); return; }
  if (nowLiked) state.likes.add(id); else state.likes.delete(id);

  // Update any visible heart buttons for this track
  document.querySelectorAll(`.heart-btn[data-id="${id}"]`).forEach((b) => {
    b.classList.toggle('liked', nowLiked);
    b.innerHTML = heartSvg(nowLiked);
  });
  syncNowHeart();
  renderLibrary();
  if (state.view.type === 'liked') refreshCurrentView();
  toast(nowLiked ? '♥ Added to Liked Songs' : 'Removed from Liked Songs');
}

export function syncNowHeart() {
  const t = state.queue[state.qIdx];
  if (!t) return;
  const on = state.likes.has(String(t.id));
  const heart = $('pb-heart');
  heart.classList.toggle('liked', on);
  heart.innerHTML = heartSvg(on, 18);
}

// Wire up the audio engine's callbacks once.
let dragging = false;
export function initPlaybackBridge() {
  player.ontime = (cur, dur) => {
    if (dragging) return;
    $('pb-fill').style.width = (cur / dur * 100) + '%';
    $('pb-cur').textContent = (cur ? `${Math.floor(cur / 60)}:${String(Math.floor(cur % 60)).padStart(2, '0')}` : '0:00');
    $('pb-tot').textContent = (dur ? `${Math.floor(dur / 60)}:${String(Math.floor(dur % 60)).padStart(2, '0')}` : '0:00');
  };
  player.onended = () => { state.repeated ? player.play() : goNext(); };

  // Scrub by clicking/dragging the progress track.
  const track = $('pb-track');
  const doScrub = (e) => {
    const r = track.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    $('pb-fill').style.width = (p * 100) + '%';
    player.seek(p);
  };
  track.addEventListener('mousedown', (e) => { dragging = true; doScrub(e); });
  document.addEventListener('mousemove', (e) => { if (dragging) doScrub(e); });
  document.addEventListener('mouseup', () => { dragging = false; });
}
