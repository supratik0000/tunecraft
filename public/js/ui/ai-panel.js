// AI assistant slide-out panel. Talks to /api/agent/chat.
import { state, loadEverything } from '../core/state.js';
import { api } from '../core/api.js';
import { $, $$ } from '../core/util.js';
import { renderLibrary } from './library-drawer.js';
import { refreshCurrentView } from './views.js';

let history = [];
let greeted = false;

function open() {
  $('ai-panel').classList.add('open');
  $('backdrop').classList.add('on');
  if (!greeted) {
    addBot(`Hi ${state.user?.displayName || 'there'}! I can add songs, build playlists, and organise your library. Try "make a playlist called Road Trip and add Turbo Charged".`);
    greeted = true;
  }
  $('ai-text').focus();
}

function close() {
  $('ai-panel').classList.remove('open');
  const libOpen = $('libdrawer').classList.contains('open');
  if (!libOpen) $('backdrop').classList.remove('on');
}

function addMsg(text, cls) {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  el.textContent = text;
  const body = $('ai-body');
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  return el;
}
const addBot = (t) => addMsg(t, 'bot');
const addUser = (t) => addMsg(t, 'user');

async function send(text) {
  text = text.trim();
  if (!text) return;
  addUser(text);
  history.push({ role: 'user', content: text });
  $('ai-text').value = '';
  $('ai-send').disabled = true;

  const typing = document.createElement('div');
  typing.className = 'typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  const body = $('ai-body');
  body.appendChild(typing);
  body.scrollTop = body.scrollHeight;

  try {
    const data = await api('/agent/chat', {
      method: 'POST',
      body: { message: text, history: history.slice(0, -1) },
    });
    typing.remove();
    addBot(data.reply);
    history.push({ role: 'assistant', content: data.reply });

    if (data.changed) {
      await loadEverything();
      renderLibrary($('ld-filter').value);
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

export function initAiPanel() {
  $('ai-close').addEventListener('click', close);

  // Nav tab "Assistant" opens the panel
  $$('.bb-tab').forEach((tab) => {
    if (tab.dataset.nav === 'ai') tab.addEventListener('click', open);
  });

  $('ai-send').addEventListener('click', () => send($('ai-text').value));
  $('ai-text').addEventListener('keydown', (e) => { if (e.key === 'Enter') send($('ai-text').value); });
  $$('button', $('ai-suggest')).forEach((b) => b.addEventListener('click', () => send(b.dataset.q)));
}
