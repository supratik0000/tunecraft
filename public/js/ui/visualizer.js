// Animates the waveform strip on the home view.
import { $ } from '../core/util.js';
import { player } from '../audio/player.js';

const BAR_COUNT = 32;

export function initVisualizer() {
  const wrap = $('viz-strip');
  if (!wrap) return;
  // Create the bar elements once.
  for (let i = 0; i < BAR_COUNT; i++) {
    const b = document.createElement('div');
    b.className = 'viz-bar';
    b.style.height = '4px';
    wrap.appendChild(b);
  }
  const bars = wrap.querySelectorAll('.viz-bar');

  function tick() {
    requestAnimationFrame(tick);
    const data = player.getWaveform();
    bars.forEach((b, i) => {
      const v = data[i] || 0;
      b.style.height  = (player.isPlaying ? Math.max(4, v / 255 * 42) : 4) + 'px';
      b.style.opacity = player.isPlaying ? '0.85' : '0.3';
    });
  }
  tick();
}
