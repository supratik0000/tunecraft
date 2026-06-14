// JWT sign + verify. Secret is read from config/env.js.
import jwt from 'jsonwebtoken';
import { JWT_SECRET, TOKEN_TTL } from '../config/env.js';

export function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function publicUser(u) {
  return { id: u.id, email: u.email, displayName: u.display_name };
}
