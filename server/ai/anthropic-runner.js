// Multi-turn tool-using loop against Anthropic's native messages API.
import Anthropic from '@anthropic-ai/sdk';
import { anthropicTools, MUTATING } from './tools.js';
import { runTool } from './executors.js';
import { SYSTEM_PROMPT } from './system-prompt.js';

const MAX_STEPS = 8;

export async function runAnthropic(cfg, userId, history, userMessage) {
  const client = new Anthropic({ apiKey: cfg.apiKey });
  const messages = [...history, { role: 'user', content: userMessage }];
  const system = [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }];
  let changed = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.messages.create({
      model: cfg.model,
      max_tokens: 1024,
      system,
      tools: anthropicTools,
      messages,
    });
    if (response.stop_reason !== 'tool_use') {
      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      return { reply: text || 'Done.', changed };
    }
    messages.push({ role: 'assistant', content: response.content });
    const results = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const result = runTool(userId, block.name, block.input);
      if (MUTATING.has(block.name) && !result.error) changed = true;
      results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
    }
    messages.push({ role: 'user', content: results });
  }
  return { reply: 'That took too many steps — could you simplify the request?', changed };
}
