const express = require('express');
const { getDb } = require('../middleware/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/moderation/queue - all kudos for admin
router.get('/queue', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const { page = 1, limit = 20, status = 'all' } = req.query;
  const offset = (page - 1) * limit;
  let where = '1=1';
  if (status === 'hidden') where = 'k.is_visible = FALSE';
  if (status === 'visible') where = 'k.is_visible = TRUE';

  const total = db.prepare(`SELECT COUNT(*) as count FROM kudos k WHERE ${where}`).get().count;
  const kudos = db.prepare(`
    SELECT k.id, k.message, k.created_at, k.is_visible, k.moderation_reason, k.moderated_at,
      s.name as sender_name, r.name as recipient_name,
      m.name as moderated_by_name
    FROM kudos k
    JOIN users s ON k.sender_id = s.id
    JOIN users r ON k.recipient_id = r.id
    LEFT JOIN users m ON k.moderated_by = m.id
    WHERE ${where}
    ORDER BY k.created_at DESC LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset);

  res.json({ kudos, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// POST /api/moderation/:id/hide - hide a kudos
router.post('/:id/hide', authenticate, requireAdmin, (req, res) => {
  const { reason } = req.body;
  const db = getDb();
  const kudos = db.prepare('SELECT id FROM kudos WHERE id = ?').get(req.params.id);
  if (!kudos) return res.status(404).json({ error: 'Kudos not found' });

  db.prepare(`
    UPDATE kudos SET is_visible = FALSE, moderated_by = ?, moderated_at = CURRENT_TIMESTAMP, moderation_reason = ?
    WHERE id = ?
  `).run(req.user.id, reason || 'Inappropriate content', req.params.id);

  res.json({ message: 'Kudos hidden successfully' });
});

// POST /api/moderation/:id/restore - restore a kudos
router.post('/:id/restore', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const kudos = db.prepare('SELECT id FROM kudos WHERE id = ?').get(req.params.id);
  if (!kudos) return res.status(404).json({ error: 'Kudos not found' });

  db.prepare(`
    UPDATE kudos SET is_visible = TRUE, moderated_by = ?, moderated_at = CURRENT_TIMESTAMP, moderation_reason = NULL
    WHERE id = ?
  `).run(req.user.id, req.params.id);

  res.json({ message: 'Kudos restored successfully' });
});

// DELETE /api/moderation/:id - permanently delete
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM notifications WHERE kudos_id = ?').run(req.params.id);
  db.prepare('DELETE FROM reports WHERE kudos_id = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM kudos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Kudos not found' });
  res.json({ message: 'Kudos deleted permanently' });
});

module.exports = router;
