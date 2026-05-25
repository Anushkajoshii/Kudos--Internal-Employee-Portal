const express = require('express');
const { getDb } = require('../middleware/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT n.id, n.type, n.is_read, n.created_at,
      k.message as kudos_message, s.name as sender_name
    FROM notifications n
    JOIN kudos k ON n.kudos_id = k.id
    JOIN users s ON k.sender_id = s.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC LIMIT 50
  `).all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE').get(req.user.id).count;
  res.json({ notifications, unread });
});

router.put('/:id/read', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = TRUE WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All marked as read' });
});

module.exports = router;
