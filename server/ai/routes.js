// POST /api/agent/chat — natural-language control of the user's library.
import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { resolveProvider } from './providers.js';
import { runOpenAI } from './openai-runner.js';
import { runAnthropic } from './anthropic-runner.js';

const HISTORY_LIMIT = 12;

export const agentRouter = Router();

agentRouter.post('/chat', authRequired, async (req, res) => {
  const cfg = resolveProvider();
  if (!cfg.enabled) {
    return res.status(503).json({
      error: `The AI assistant is not configured. Add a free ${cfg.name} key as ${cfg.keyEnv} in server/.env to enable it.`,
      disabled: true,
    });
  }

  const userMessage = String(req.body?.message || '').trim();
  if (!userMessage) return res.status(400).json({ error: 'Empty message' });

  const history = (Array.isArray(req.body?.history) ? req.body.history : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const out = cfg.kind === 'anthropic'
      ? await runAnthropic(cfg, req.user.id, history, userMessage)
      : await runOpenAI(cfg, req.user.id, history, userMessage);
    res.json(out);
  } catch (e) {
    console.error('Agent error:', e?.status || '', e?.message || e);
    const hint = e?.status === 401 ? ' (the API key looks invalid)' : '';
    res.status(502).json({ error: `The AI assistant had a problem${hint}. Check the server logs and your ${cfg.keyEnv || 'provider'} setting.` });
  }
});

agentRouter.get('/status', (req, res) => {
  const c = resolveProvider();
  res.json({ enabled: c.enabled, provider: c.name, model: c.enabled ? c.model : null });
});
