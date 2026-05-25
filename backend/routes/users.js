const express = require('express');
const { getDb } = require('../middleware/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/users - list active users (for dropdown, exclude self)
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id, name, department, employee_id FROM users WHERE is_active = TRUE AND id != ? ORDER BY name ASC'
  ).all(req.user.id);
  res.json(users);
});

// GET /api/users/:id - profile
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, employee_id, name, email, department, join_date, created_at FROM users WHERE id = ? AND is_active = TRUE'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET /api/users/:id/kudos - user kudos history
router.get('/:id/kudos', authenticate, (req, res) => {
  const db = getDb();
  const { type = 'received', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const col = type === 'sent' ? 'sender_id' : 'recipient_id';
  const other = type === 'sent' ? 'recipient_id' : 'sender_id';
  const otherAlias = type === 'sent' ? 'recipient' : 'sender';

  const kudos = db.prepare(`
    SELECT k.id, k.message, k.created_at,
      u.name as ${otherAlias}_name, u.department as ${otherAlias}_department
    FROM kudos k JOIN users u ON k.${other} = u.id
    WHERE k.${col} = ? AND k.is_visible = TRUE
    ORDER BY k.created_at DESC LIMIT ? OFFSET ?
  `).all(req.params.id, parseInt(limit), offset);

  res.json(kudos);
});

// GET /api/users/:id/statistics
router.get('/:id/statistics', authenticate, (req, res) => {
  const db = getDb();
  const id = req.params.id;
  const received = db.prepare('SELECT COUNT(*) as count FROM kudos WHERE recipient_id = ? AND is_visible = TRUE').get(id).count;
  const sent = db.prepare('SELECT COUNT(*) as count FROM kudos WHERE sender_id = ? AND is_visible = TRUE').get(id).count;
  const thisMonth = db.prepare(
    "SELECT COUNT(*) as count FROM kudos WHERE recipient_id = ? AND is_visible = TRUE AND created_at >= date('now','start of month')"
  ).get(id).count;
  res.json({ received, sent, thisMonth });
});

module.exports = router;
