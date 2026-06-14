// POST /register, POST /login, GET /me
import { Router } from 'express';
import { getOne, run } from '../db/connection.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { signToken, publicUser } from './tokens.js';
import { authRequired } from './middleware.js';
import { emailFormatOk, domainHasMail } from './email-check.js';

export const authRouter = Router();

const MIN_PASSWORD = 6;

authRouter.post('/register', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const displayName = String(req.body?.displayName || '').trim() || email.split('@')[0];

  if (!emailFormatOk(email))         return res.status(400).json({ error: 'Enter a valid email address' });
  if (password.length < MIN_PASSWORD) return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });

  if (!(await domainHasMail(email))) {
    return res.status(400).json({ error: `That email domain doesn't seem to exist. Check for typos.` });
  }

  const exists = await getOne('SELECT 1 FROM users WHERE email = ?', [email]);
  if (exists) return res.status(409).json({ error: 'An account with that email already exists' });

  const info = await run(
    'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
    [email, hashPassword(password), displayName],
  );
  const user = await getOne('SELECT * FROM users WHERE id = ?', [Number(info.lastInsertRowid)]);

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get('/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
