// Express middleware: require a valid Bearer token, attach req.user.
import { getOne } from '../db/connection.js';
import { verifyToken } from './tokens.js';

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    const payload = verifyToken(token);
    const user = await getOne('SELECT * FROM users WHERE id = ?', [payload.uid]);
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}
