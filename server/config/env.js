// Centralised environment-variable access.
// Everything that reads process.env should go through here so it is easy to
// see at a glance what config the server actually depends on.
import 'dotenv/config';

export const PORT = Number(process.env.PORT) || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
export const TOKEN_TTL = '30d';

export const AI = {
  provider: (process.env.AI_PROVIDER || 'groq').toLowerCase(),
  model:    process.env.AI_MODEL    || '',
  baseURL:  process.env.AI_BASE_URL || '',
  apiKey:   process.env.AI_API_KEY  || '',
  keys: {
    groq:       process.env.GROQ_API_KEY       || '',
    gemini:     process.env.GEMINI_API_KEY     || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
    openai:     process.env.OPENAI_API_KEY     || '',
    anthropic:  process.env.ANTHROPIC_API_KEY  || '',
  },
};
