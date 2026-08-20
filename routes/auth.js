// Admin auth: JWT in an httpOnly cookie.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDb, query } = require('../db');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mudasirnadeem7979@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KHAN123';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is not set — using an insecure dev default. Set it in production.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

const COOKIE = 'aw_token';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: MAX_AGE,
  path: '/'
});

function checkPassword(password) {
  if (ADMIN_PASSWORD_HASH) return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  return password === ADMIN_PASSWORD;
}

function readToken(req) {
  const fromCookie = req.cookies && req.cookies[COOKIE];
  if (fromCookie) return fromCookie;
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
}

// Named export: protects admin routes.
function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

// Look the user up in the users table. Returns null if absent OR if the DB is
// unreachable, so the env-admin fallback below still works without Postgres.
async function findUser(email) {
  try {
    await initDb();
    const r = await query(
      'SELECT email, password_hash, role FROM users WHERE lower(email) = lower($1)',
      [email]
    );
    return r.rows[0] || null;
  } catch (err) {
    console.error('db error:', err.message);
    return null;
  }
}

router.post('/login', async (req, res) => {
  const b = req.body || {};
  const email = typeof b.email === 'string' ? b.email.trim() : '';
  const password = typeof b.password === 'string' ? b.password : '';

  const user = email ? await findUser(email) : null;
  if (user) {
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE, token, cookieOpts());
    return res.json({ success: true });
  }

  const ok = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && checkPassword(password);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, cookieOpts());
  res.json({ success: true });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ success: false });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, email: payload.email });
  } catch (err) {
    res.status(401).json({ success: false });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
