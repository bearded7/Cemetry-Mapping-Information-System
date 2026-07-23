'use strict';

const express = require('express');
const path = require('path');
const { body, param, query, validationResult } = require('express-validator');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

const router = express.Router();
router.use(requireAdmin);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return true;
  }
  return false;
}

function photosForGrave(graveId) {
  return db
    .prepare('SELECT id, file_path, caption FROM grave_photos WHERE grave_id = ? ORDER BY id')
    .all(graveId)
    .map((p) => ({ id: p.id, url: `/uploads/graves/${path.basename(p.file_path)}`, caption: p.caption }));
}

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const counts = db
    .prepare(`SELECT status, COUNT(*) AS n FROM graves GROUP BY status`)
    .all()
    .reduce((acc, r) => ({ ...acc, [r.status]: r.n }), { pending: 0, approved: 0, rejected: 0 });
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const cemeteryCount = db.prepare('SELECT COUNT(*) AS n FROM cemeteries').get().n;
  res.json({ graves: counts, userCount, cemeteryCount });
});

// GET /api/admin/graves?status=pending
router.get(
  '/graves',
  [query('status').optional().isIn(['pending', 'approved', 'rejected'])],
  (req, res) => {
    if (handleValidation(req, res)) return;
    const status = req.query.status || 'pending';
    const rows = db
      .prepare(
        `SELECT g.*, u.full_name AS submitter_name, u.email AS submitter_email
         FROM graves g
         LEFT JOIN users u ON u.id = g.submitted_by
         WHERE g.status = ? AND g.deleted_at IS NULL
         ORDER BY g.created_at DESC`
      )
      .all(status);

    res.json({ graves: rows.map((g) => ({ ...g, photos: photosForGrave(g.id) })) });
  }
);

// POST /api/admin/graves/:id/approve
router.post('/graves/:id/approve', [param('id').isInt().toInt()], (req, res) => {
  if (handleValidation(req, res)) return;

  const grave = db.prepare('SELECT * FROM graves WHERE id = ?').get(req.params.id);
  if (!grave) return res.status(404).json({ error: 'Grave record not found.' });
  if (grave.status === 'approved') return res.status(400).json({ error: 'Already approved.' });

  db.prepare(
    `UPDATE graves SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), rejection_reason = NULL WHERE id = ?`
  ).run(req.user.id, grave.id);

  logAction(req.user.id, 'approve', 'grave', grave.id);
  res.json({ ok: true });
});

// POST /api/admin/graves/:id/reject
router.post(
  '/graves/:id/reject',
  [param('id').isInt().toInt(), body('reason').trim().isLength({ min: 3, max: 300 }).withMessage('Please give a short reason for the rejection.')],
  (req, res) => {
    if (handleValidation(req, res)) return;

    const grave = db.prepare('SELECT * FROM graves WHERE id = ?').get(req.params.id);
    if (!grave) return res.status(404).json({ error: 'Grave record not found.' });

    db.prepare(
      `UPDATE graves SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now'), rejection_reason = ? WHERE id = ?`
    ).run(req.user.id, req.body.reason, grave.id);

    logAction(req.user.id, 'reject', 'grave', grave.id, { reason: req.body.reason });
    res.json({ ok: true });
  }
);

// GET /api/admin/users
router.get('/users', (req, res) => {
  const rows = db
    .prepare('SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json({ users: rows });
});

// POST /api/admin/cemeteries — add a new cemetery ground
router.post(
  '/cemeteries',
  [
    body('name').trim().isLength({ min: 2, max: 150 }),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
    body('address').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
    body('centerLat').isFloat({ min: -90, max: 90 }).toFloat(),
    body('centerLng').isFloat({ min: -180, max: 180 }).toFloat(),
    body('defaultZoom').optional().isInt({ min: 1, max: 22 }).toInt(),
  ],
  (req, res) => {
    if (handleValidation(req, res)) return;
    const { name, description, address, centerLat, centerLng } = req.body;
    const defaultZoom = req.body.defaultZoom || 18;

    const result = db
      .prepare(
        'INSERT INTO cemeteries (name, description, address, center_lat, center_lng, default_zoom) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(name, description || null, address || null, centerLat, centerLng, defaultZoom);

    logAction(req.user.id, 'create', 'cemetery', Number(result.lastInsertRowid));
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  }
);

// GET /api/admin/contact-messages?status=new
router.get(
  '/contact-messages',
  [query('status').optional().isIn(['new', 'read', 'resolved'])],
  (req, res) => {
    if (handleValidation(req, res)) return;
    const status = req.query.status;
    const rows = status
      ? db.prepare('SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC').all(status)
      : db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    res.json({ messages: rows });
  }
);

// POST /api/admin/contact-messages/:id/status
router.post(
  '/contact-messages/:id/status',
  [param('id').isInt().toInt(), body('status').isIn(['new', 'read', 'resolved'])],
  (req, res) => {
    if (handleValidation(req, res)) return;
    const result = db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json({ ok: true });
  }
);

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM system_settings').all();
  res.json({ settings: rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {}) });
});

// POST /api/admin/settings
router.post(
  '/settings',
  [body('key').trim().isLength({ min: 1, max: 100 }), body('value').isString().isLength({ max: 2000 })],
  (req, res) => {
    if (handleValidation(req, res)) return;
    db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(req.body.key, req.body.value);
    logAction(req.user.id, 'update', 'setting', null, { key: req.body.key });
    res.json({ ok: true });
  }
);

// GET /api/admin/plots?cemeteryId=1
router.get('/plots', [query('cemeteryId').optional().isInt().toInt()], (req, res) => {
  if (handleValidation(req, res)) return;
  const rows = req.query.cemeteryId
    ? db.prepare('SELECT * FROM plots WHERE cemetery_id = ? ORDER BY section, row_label, plot_number').all(req.query.cemeteryId)
    : db.prepare('SELECT * FROM plots ORDER BY cemetery_id, section, row_label, plot_number').all();
  res.json({ plots: rows });
});

// POST /api/admin/plots
router.post(
  '/plots',
  [
    body('cemeteryId').isInt().toInt(),
    body('section').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body('rowLabel').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body('plotNumber').trim().isLength({ min: 1, max: 40 }),
    body('status').optional().isIn(['available', 'reserved', 'occupied']),
    body('latitude').optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }).toFloat(),
    body('longitude').optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 }).toFloat(),
    body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  ],
  (req, res) => {
    if (handleValidation(req, res)) return;
    const { cemeteryId, section, rowLabel, plotNumber, latitude, longitude, notes } = req.body;
    const status = req.body.status || 'available';
    try {
      const result = db.prepare(`
        INSERT INTO plots (cemetery_id, section, row_label, plot_number, status, latitude, longitude, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(cemeteryId, section || null, rowLabel || null, plotNumber, status, latitude || null, longitude || null, notes || null);
      res.status(201).json({ id: Number(result.lastInsertRowid) });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(400).json({ error: 'A plot with that section/row/number already exists for this cemetery.' });
      }
      console.error(err);
      res.status(500).json({ error: 'Could not create the plot.' });
    }
  }
);

// POST /api/admin/plots/:id/status
router.post(
  '/plots/:id/status',
  [param('id').isInt().toInt(), body('status').isIn(['available', 'reserved', 'occupied'])],
  (req, res) => {
    if (handleValidation(req, res)) return;
    const result = db.prepare(`UPDATE plots SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(req.body.status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Plot not found.' });
    res.json({ ok: true });
  }
);

// -----------------------------------------------------------------------
// Messaging: admins share one inbox of per-user support conversations.
// -----------------------------------------------------------------------
const fs = require('fs');
const { uploadMessageFiles } = require('../middleware/messageUpload');
const { rejectInvalidFiles } = require('../utils/fileValidate');

function attachmentsFor(messageId) {
  return db
    .prepare('SELECT id, file_path, original_name, mime_type, file_size, kind FROM message_attachments WHERE message_id = ? ORDER BY id')
    .all(messageId)
    .map((a) => ({
      id: a.id,
      url: `/uploads/messages/${path.basename(a.file_path)}`,
      name: a.original_name,
      mimeType: a.mime_type,
      size: a.file_size,
      kind: a.kind,
    }));
}

function serializeMessages(conversationId) {
  const rows = db
    .prepare(
      `SELECT m.id, m.sender_role, m.body, m.created_at, u.full_name AS sender_name
       FROM messages m LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ? ORDER BY m.created_at ASC`
    )
    .all(conversationId);
  return rows.map((m) => ({ ...m, attachments: attachmentsFor(m.id) }));
}

// GET /api/admin/conversations
router.get('/conversations', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, u.full_name AS user_name, u.email AS user_email,
      (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_body
    FROM conversations c
    JOIN users u ON u.id = c.user_id
    ORDER BY c.last_message_at DESC
  `).all();
  res.json({ conversations: rows });
});

// GET /api/admin/conversations/:id
router.get('/conversations/:id', [param('id').isInt().toInt()], (req, res) => {
  if (handleValidation(req, res)) return;
  const conv = db.prepare(`
    SELECT c.*, u.full_name AS user_name, u.email AS user_email
    FROM conversations c JOIN users u ON u.id = c.user_id WHERE c.id = ?
  `).get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  db.prepare('UPDATE conversations SET admin_unread_count = 0 WHERE id = ?').run(conv.id);
  res.json({ conversation: conv, messages: serializeMessages(conv.id) });
});

// POST /api/admin/conversations/:id/send
router.post(
  '/conversations/:id/send',
  uploadMessageFiles.array('attachments', 4),
  [param('id').isInt().toInt(), body('body').trim().isLength({ min: 1, max: 4000 }).withMessage('Message cannot be empty.')],
  (req, res) => {
    if (handleValidation(req, res)) { (req.files || []).forEach((f) => fs.unlink(f.path, () => {})); return; }

    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    if (!conv) { (req.files || []).forEach((f) => fs.unlink(f.path, () => {})); return res.status(404).json({ error: 'Conversation not found.' }); }

    const rejected = rejectInvalidFiles(req.files || []);
    if (rejected.length > 0) {
      (req.files || []).filter((f) => !rejected.includes(f)).forEach((f) => fs.unlink(f.path, () => {}));
      return res.status(400).json({ error: 'One or more attachments failed validation and were rejected.' });
    }

    db.exec('BEGIN');
    try {
      const result = db.prepare(
        `INSERT INTO messages (conversation_id, sender_id, sender_role, body) VALUES (?, ?, 'admin', ?)`
      ).run(conv.id, req.user.id, req.body.body);
      const messageId = Number(result.lastInsertRowid);

      const insertAttachment = db.prepare(
        'INSERT INTO message_attachments (message_id, file_path, original_name, mime_type, file_size, kind) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const file of req.files || []) {
        const relPath = path.relative(path.join(__dirname, '..', 'uploads'), file.path);
        const kind = file.mimetype.startsWith('image/') ? 'image' : 'file';
        insertAttachment.run(messageId, relPath, file.originalname.slice(0, 200), file.mimetype, file.size, kind);
      }

      db.prepare(
        `UPDATE conversations SET user_unread_count = user_unread_count + 1, last_message_at = datetime('now') WHERE id = ?`
      ).run(conv.id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      (req.files || []).forEach((f) => fs.unlink(f.path, () => {}));
      console.error(err);
      return res.status(500).json({ error: 'Could not send the reply. Please try again.' });
    }

    logAction(req.user.id, 'reply', 'conversation', conv.id);
    res.status(201).json({ messages: serializeMessages(conv.id) });
  }
);

// POST /api/admin/conversations/:id/status
router.post(
  '/conversations/:id/status',
  [param('id').isInt().toInt(), body('status').isIn(['open', 'closed'])],
  (req, res) => {
    if (handleValidation(req, res)) return;
    const result = db.prepare('UPDATE conversations SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ ok: true });
  }
);

module.exports = router;
