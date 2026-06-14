// POST /register, POST /login, GET /me
import { Router } from 'express';
import { db } from '../db/connection.js';
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

  // Verify the email's domain actually accepts mail — catches typos like
  // "you@gmial.con" and outright fake "test@asdf.qqq" addresses.
  if (!(await domainHasMail(email))) {
    return res.status(400).json({ error: `That email domain doesn't seem to exist. Check for typos.` });
  }

  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'An account with that email already exists' });

  const info = db.prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)')
    .run(email, hashPassword(password), displayName);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid));

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post('/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get('/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
