// Contact form endpoint.
const express = require('express');
const { query, ensureDb } = require('../db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const MAX = { name: 100, email: 150, subject: 150, message: 2000 };
const FAIL = 'Please enter a valid name, email and message.';

// The existing frontend submits new FormData(form) => multipart/form-data.
// Parse only simple text fields (no file uploads on this form) so we avoid a dep.
function parseMultipart(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('multipart/form-data')) return next();

  const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!m) return next();
  const boundary = '--' + (m[1] || m[2]).trim();

  let raw = '';
  req.setEncoding('utf8');
  req.on('data', c => {
    raw += c;
    if (raw.length > 1e6) req.destroy(); // 1MB cap, this form is text-only
  });
  req.on('error', () => next());
  req.on('end', () => {
    const body = {};
    for (const part of raw.split(boundary)) {
      const idx = part.indexOf('\r\n\r\n');
      if (idx === -1) continue;
      const name = /name="([^"]*)"/i.exec(part.slice(0, idx));
      if (!name) continue;
      body[name[1]] = part.slice(idx + 4).replace(/\r\n$/, '');
    }
    req.body = Object.assign({}, req.body, body);
    next();
  });
}

router.post('/contact', parseMultipart, async (req, res) => {
  const b = req.body || {};
  const str = v => (typeof v === 'string' ? v.trim() : '');
  const name = str(b.name);
  const email = str(b.email);
  const subject = str(b.subject);
  const message = str(b.message);

  const valid =
    name && message && EMAIL_RE.test(email) &&
    name.length <= MAX.name && email.length <= MAX.email &&
    subject.length <= MAX.subject && message.length <= MAX.message;

  if (!valid) return res.json({ success: false, message: FAIL });

  const saved = await ensureDb(res, () => query(
    'INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, subject || null, message]
  ), 'Could not save the message. Please try again later.');
  if (!saved) return;

  res.json({
    success: true,
    message: 'Message sent successfully. Abdul Wahab will get back to you soon.'
  });
});

module.exports = router;
