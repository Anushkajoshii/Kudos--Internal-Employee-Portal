const express = require('express');
const { getDb } = require('../middleware/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/:kudosId/report', authenticate, (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: 'Reason is required' });
  const db = getDb();
  const kudos = db.prepare('SELECT id FROM kudos WHERE id = ? AND is_visible = TRUE').get(req.params.kudosId);
  if (!kudos) return res.status(404).json({ error: 'Kudos not found' });
  const existing = db.prepare('SELECT id FROM reports WHERE kudos_id = ? AND reporter_id = ? AND status = ?').get(req.params.kudosId, req.user.id, 'pending');
  if (existing) return res.status(409).json({ error: 'You already reported this kudos' });
  db.prepare('INSERT INTO reports (kudos_id, reporter_id, reason) VALUES (?, ?, ?)').run(req.params.kudosId, req.user.id, reason.trim());
  res.status(201).json({ message: 'Report submitted for review' });
});

router.get('/', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const reports = db.prepare(`
    SELECT r.id, r.reason, r.status, r.created_at,
      rep.name as reporter_name, u.name as reviewed_by_name,
      k.message as kudos_message, k.id as kudos_id
    FROM reports r
    JOIN users rep ON r.reporter_id = rep.id
    JOIN kudos k ON r.kudos_id = k.id
    LEFT JOIN users u ON r.reviewed_by = u.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(reports);
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['resolved', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const db = getDb();
  db.prepare('UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.user.id, req.params.id);
  res.json({ message: 'Report updated' });
});

module.exports = router;
