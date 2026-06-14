// Sign-in / sign-up overlay. Owns the auth modal DOM and exposes
// promises the rest of the app awaits on.
import { api, setToken, clearToken } from './api.js';
import { state } from './state.js';
import { $ } from './util.js';
import { player } from '../audio/player.js';

let authMode = 'login';
let onSignedInCallback = null;

export function onSignedIn(cb) { onSignedInCallback = cb; }

export function showAuth() { $('auth').classList.remove('hidden'); $('app').classList.add('hidden'); }
export function showApp()  { $('auth').classList.add('hidden');    $('app').classList.remove('hidden'); }

export function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  $('auth').classList.toggle('signup', signup);
  $('auth-title').textContent = signup ? 'Create your account' : 'Welcome back';
  $('auth-sub').textContent   = signup ? 'Set up your personal Tunecraft library.' : 'Sign in to your Tunecraft account.';
  $('af-submit').textContent  = signup ? 'Create account' : 'Sign in';
  $('auth-toggle').innerHTML  = signup
    ? 'Already have an account? <a id="auth-switch">Sign in</a>'
    : 'New here? <a id="auth-switch">Create an account</a>';
  $('auth-switch').onclick = () => setAuthMode(signup ? 'login' : 'signup');
  $('auth-err').textContent = '';
}

export function initAuth() {
  setAuthMode('login');

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
      setToken(data.token);
      state.user = data.user;
      await onSignedInCallback?.();
    } catch (err) {
      $('auth-err').textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $('signout-btn').addEventListener('click', signOut);
  $('avatar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('usermenu').classList.toggle('hidden');
  });
  document.addEventListener('click', () => $('usermenu').classList.add('hidden'));
  $('usermenu').addEventListener('click', (e) => e.stopPropagation());
}

export function signOut() {
  clearToken();
  state.user = null;
  player.stop();
  $('usermenu').classList.add('hidden');
  showAuth();
}
