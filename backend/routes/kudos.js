const express = require('express');
const { getDb } = require('../middleware/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/kudos - list with pagination, search, filter
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { page = 1, limit = 20, search = '', from_date, to_date } = req.query;
  const offset = (page - 1) * limit;

  let where = 'k.is_visible = TRUE';
  const params = [];

  if (search) {
    where += ' AND (s.name LIKE ? OR r.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (from_date) { where += ' AND k.created_at >= ?'; params.push(from_date); }
  if (to_date) { where += ' AND k.created_at <= ?'; params.push(to_date + ' 23:59:59'); }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM kudos k
    JOIN users s ON k.sender_id = s.id
    JOIN users r ON k.recipient_id = r.id
    WHERE ${where}
  `).get(...params).count;

  const kudos = db.prepare(`
    SELECT k.id, k.message, k.created_at,
      s.id as sender_id, s.name as sender_name, s.department as sender_department,
      r.id as recipient_id, r.name as recipient_name, r.department as recipient_department
    FROM kudos k
    JOIN users s ON k.sender_id = s.id
    JOIN users r ON k.recipient_id = r.id
    WHERE ${where}
    ORDER BY k.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ kudos, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// POST /api/kudos - create
router.post('/', authenticate, (req, res) => {
  const { recipient_id, message } = req.body;
  if (!recipient_id || !message?.trim()) return res.status(400).json({ error: 'Recipient and message are required' });
  if (message.trim().length > 500) return res.status(400).json({ error: 'Message must be 500 characters or less' });
  if (parseInt(recipient_id) === req.user.id) return res.status(400).json({ error: 'Cannot send kudos to yourself' });

  const db = getDb();
  const recipient = db.prepare('SELECT id, name FROM users WHERE id = ? AND is_active = TRUE').get(recipient_id);
  if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

  const result = db.prepare('INSERT INTO kudos (sender_id, recipient_id, message) VALUES (?, ?, ?)').run(req.user.id, recipient_id, message.trim());
  db.prepare('INSERT INTO notifications (user_id, kudos_id, type) VALUES (?, ?, ?)').run(recipient_id, result.lastInsertRowid, 'kudos_received');

  const kudos = db.prepare(`
    SELECT k.id, k.message, k.created_at,
      s.id as sender_id, s.name as sender_name, s.department as sender_department,
      r.id as recipient_id, r.name as recipient_name, r.department as recipient_department
    FROM kudos k JOIN users s ON k.sender_id = s.id JOIN users r ON k.recipient_id = r.id
    WHERE k.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(kudos);
});

// GET /api/kudos/:id
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const kudos = db.prepare(`
    SELECT k.*, s.name as sender_name, s.department as sender_department,
      r.name as recipient_name, r.department as recipient_department
    FROM kudos k JOIN users s ON k.sender_id = s.id JOIN users r ON k.recipient_id = r.id
    WHERE k.id = ? AND (k.is_visible = TRUE OR ? = 'admin')
  `).get(req.params.id, req.user.role);
  if (!kudos) return res.status(404).json({ error: 'Kudos not found' });
  res.json(kudos);
});

module.exports = router;
