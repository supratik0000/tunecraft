// LLM provider registry. Every entry except 'anthropic' speaks the OpenAI
// chat-completions protocol (Groq, Gemini's OpenAI-compat endpoint, OpenRouter,
// Ollama, OpenAI itself). 'anthropic' uses the native Anthropic SDK.
import { AI } from '../config/env.js';

export const PROVIDERS = {
  groq:       { kind: 'openai',    baseURL: 'https://api.groq.com/openai/v1',                          model: 'llama-3.3-70b-versatile',                  keyEnv: 'GROQ_API_KEY' },
  gemini:     { kind: 'openai',    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-2.0-flash',                        keyEnv: 'GEMINI_API_KEY' },
  openrouter: { kind: 'openai',    baseURL: 'https://openrouter.ai/api/v1',                            model: 'meta-llama/llama-3.3-70b-instruct:free',  keyEnv: 'OPENROUTER_API_KEY' },
  ollama:     { kind: 'openai',    baseURL: 'http://localhost:11434/v1',                               model: 'llama3.1',                                keyEnv: null },
  openai:     { kind: 'openai',    baseURL: 'https://api.openai.com/v1',                               model: 'gpt-4o-mini',                             keyEnv: 'OPENAI_API_KEY' },
  anthropic:  { kind: 'anthropic',                                                                     model: 'claude-haiku-4-5-20251001',               keyEnv: 'ANTHROPIC_API_KEY' },
};

// Re-resolve on every chat request so an .env change takes effect on restart
// without code rebuilds.
export function resolveProvider() {
  const name = AI.provider;
  const base = PROVIDERS[name] || PROVIDERS.groq;

  const envKey = base.keyEnv
    ? ({ GROQ_API_KEY: AI.keys.groq, GEMINI_API_KEY: AI.keys.gemini,
         OPENROUTER_API_KEY: AI.keys.openrouter, OPENAI_API_KEY: AI.keys.openai,
         ANTHROPIC_API_KEY: AI.keys.anthropic })[base.keyEnv] || ''
    : '';

  const apiKey  = AI.apiKey || envKey;
  const model   = AI.model   || base.model;
  const baseURL = AI.baseURL || base.baseURL;
  const enabled = base.keyEnv === null ? true : !!apiKey;

  return { name, kind: base.kind, apiKey, model, baseURL, enabled, keyEnv: base.keyEnv };
}

export const aiStatus = resolveProvider;
