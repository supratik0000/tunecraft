// Wires the player bar's controls — play/pause, prev/next, shuffle/repeat,
// volume, album-art upload, keyboard shortcuts.
import { state } from '../core/state.js';
import { api } from '../core/api.js';
import { $, esc, toast } from '../core/util.js';
import { player } from '../audio/player.js';
import { goNext, goPrev, toggleLike } from './playback.js';
import { refreshCurrentView } from './views.js';

export function initPlayerControls() {
  $('pb-play').addEventListener('click', () => {
    if (!player.track) { toast('Pick a track first'); return; }
    if (player.isPlaying) {
      player.pause();
      $('pb-play-icon').innerHTML = '<polygon points="5,3 19,12 5,21"/>';
    } else {
      player.play();
      $('pb-play-icon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    }
  });

  $('pb-next').addEventListener('click', goNext);
  $('pb-prev').addEventListener('click', goPrev);

  $('pb-shuffle').addEventListener('click', () => {
    state.shuffled = !state.shuffled;
    $('pb-shuffle').classList.toggle('on', state.shuffled);
    toast(state.shuffled ? '🔀 Shuffle on' : 'Shuffle off');
  });
  $('pb-repeat').addEventListener('click', () => {
    state.repeated = !state.repeated;
    $('pb-repeat').classList.toggle('on', state.repeated);
    toast(state.repeated ? '🔁 Repeat on' : 'Repeat off');
  });

  $('pb-heart').addEventListener('click', () => {
    const t = state.queue[state.qIdx];
    if (t) toggleLike(t.id);
  });

  // Volume
  $('pb-vol-track').addEventListener('click', (e) => {
    const r = $('pb-vol-track').getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    $('pb-vol-fill').style.width = (p * 100) + '%';
    player.setVolume(p);
  });
  let muted = false, prevV = 0.7;
  $('pb-vol-btn').addEventListener('click', () => {
    muted = !muted;
    player.setVolume(muted ? 0 : prevV);
    $('pb-vol-fill').style.width = (muted ? 0 : prevV * 100) + '%';
  });

  // Album-art upload
  $('pb-art').addEventListener('click', () => {
    if (!state.queue[state.qIdx]) { toast('Play a track first to set its artwork'); return; }
    $('art-input').click();
  });
  $('art-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const t = state.queue[state.qIdx];
    if (!file || !t) return;
    if (file.size > 3 * 1024 * 1024) { toast('Image too large (max 3 MB)'); return; }

    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    try {
      const { track } = await api(`/tracks/${t.id}/art`, { method: 'POST', body: { dataUrl } });
      state.trackById.set(String(track.id), track);
      const inQueue  = state.queue.find((x) => String(x.id) === String(track.id));
      if (inQueue) inQueue.art = track.art;
      const inTracks = state.tracks.find((x) => String(x.id) === String(track.id));
      if (inTracks) inTracks.art = track.art;

      if (String(state.queue[state.qIdx]?.id) === String(track.id)) {
        $('pb-art').innerHTML = `<img src="${esc(track.art)}" alt=""><span class="pb-art-cam">📷</span>`;
      }
      refreshCurrentView();
      toast('🖼 Artwork updated');
    } catch (err) { toast(err.message); }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space')      { e.preventDefault(); $('pb-play').click(); }
    if (e.code === 'ArrowRight') player.seek(Math.min(1, (player.currentTime + 10) / player.duration));
    if (e.code === 'ArrowLeft')  player.seek(Math.max(0, (player.currentTime - 10) / player.duration));
  });
}
