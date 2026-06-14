// Tunecraft frontend entry point.
// Boots the auth overlay, then once signed in, brings the app shell to life.
import { api, getToken, clearToken } from './core/api.js';
import { state, loadEverything } from './core/state.js';
import { $ } from './core/util.js';
import { initAuth, onSignedIn, showAuth, showApp } from './core/auth.js';

import { initLibraryDrawer, renderLibrary } from './ui/library-drawer.js';
import { initViews, renderHome }            from './ui/views.js';
import { initPlayerControls }               from './ui/player-controls.js';
import { initPlaybackBridge }               from './ui/playback.js';
import { initVisualizer }                   from './ui/visualizer.js';
import { initAiPanel }                      from './ui/ai-panel.js';

// ── App boot (after a successful login) ─────────────────────
async function bootApp() {
  showApp();

  $('avatar-btn').textContent = (state.user.displayName || state.user.email)[0].toUpperCase();
  $('um-name').textContent = state.user.displayName || 'You';
  $('um-mail').textContent = state.user.email;

  const h = new Date().getHours();
  $('hero-greet').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  await loadEverything();
  renderLibrary();
  renderHome();
}

// ── One-time setup ──────────────────────────────────────────
initAuth();
onSignedIn(bootApp);

initLibraryDrawer();
initViews();
initPlaybackBridge();
initPlayerControls();
initVisualizer();
initAiPanel();

// ── Try silent re-auth using a stored token ────────────────
(async function init() {
  if (getToken()) {
    try {
      const { user } = await api('/auth/me');
      state.user = user;
      await bootApp();
      return;
    } catch {
      clearToken();
    }
  }
  showAuth();
})();
