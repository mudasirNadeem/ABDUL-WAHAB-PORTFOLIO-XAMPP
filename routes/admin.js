// Admin API: read/manage contact messages. Every route requires a valid token.
const express = require('express');
const { query, ensureDb } = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

// Reject non-numeric :id before it reaches SQL.
function getId(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid id.' });
    return null;
  }
  return id;
}

router.get('/messages', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  let limit = parseInt(req.query.limit, 10);
  if (Number.isNaN(limit) || limit < 1) limit = 200;
  if (limit > 1000) limit = 1000;

  const sql = q
      ? `SELECT id, name, email, subject, message, is_read, created_at FROM messages
         WHERE name ILIKE $1 OR email ILIKE $1 OR subject ILIKE $1 OR message ILIKE $1
         ORDER BY created_at DESC LIMIT $2`
      : `SELECT id, name, email, subject, message, is_read, created_at FROM messages
         ORDER BY created_at DESC LIMIT $1`;
  const params = q ? ['%' + q + '%', limit] : [limit];
  const r = await ensureDb(res, () => query(sql, params), 'Could not load messages.');
  if (!r) return;
  res.json({ success: true, messages: r.rows });
});

router.get('/stats', async (req, res) => {
  const r = await ensureDb(res, () => query(`SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_read IS NOT TRUE)::int AS unread,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS today,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS "thisWeek"
      FROM messages`), 'Could not load stats.');
  if (!r) return;
  const s = r.rows[0] || {};
  res.json({
    success: true,
    stats: {
      total: s.total || 0,
      unread: s.unread || 0,
      today: s.today || 0,
      thisWeek: s.thisWeek || 0
    }
  });
});

router.patch('/messages/:id/read', async (req, res) => {
  const id = getId(req, res);
  if (id === null) return;
  const r = await ensureDb(res, () => query('UPDATE messages SET is_read = TRUE WHERE id = $1', [id]),
    'Could not update the message.');
  if (!r) return;
  res.json({ success: true });
});

router.delete('/messages/:id', async (req, res) => {
  const id = getId(req, res);
  if (id === null) return;
  const r = await ensureDb(res, () => query('DELETE FROM messages WHERE id = $1', [id]),
    'Could not delete the message.');
  if (!r) return;
  res.json({ success: true });
});

module.exports = router;
