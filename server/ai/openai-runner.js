// Multi-turn tool-using loop against any OpenAI chat-completions endpoint.
import OpenAI from 'openai';
import { openaiTools, MUTATING } from './tools.js';
import { runTool } from './executors.js';
import { SYSTEM_PROMPT } from './system-prompt.js';

const MAX_STEPS = 8;

export async function runOpenAI(cfg, userId, history, userMessage) {
  const client = new OpenAI({ apiKey: cfg.apiKey || 'not-needed', baseURL: cfg.baseURL });
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userMessage }];
  let changed = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const resp = await client.chat.completions.create({
      model: cfg.model,
      max_tokens: 1024,
      messages,
      tools: openaiTools,
      tool_choice: 'auto',
    });
    const msg = resp.choices?.[0]?.message;
    if (!msg) break;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { reply: (msg.content || 'Done.').trim(), changed };
    }
    messages.push(msg);
    for (const tc of msg.tool_calls) {
      let args = {};
      try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      const result = runTool(userId, tc.function.name, args);
      if (MUTATING.has(tc.function.name) && !result.error) changed = true;
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }
  return { reply: 'That took too many steps — could you simplify the request?', changed };
}
