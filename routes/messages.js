'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { uploadMessageFiles } = require('../middleware/messageUpload');
const { rejectInvalidFiles } = require('../utils/fileValidate');
const { apiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return true;
  }
  return false;
}

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

function getOrCreateConversation(userId) {
  let conv = db.prepare("SELECT * FROM conversations WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(userId);
  if (!conv) {
    const result = db.prepare('INSERT INTO conversations (user_id) VALUES (?)').run(userId);
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(Number(result.lastInsertRowid));
  }
  return conv;
}

function cleanupFiles(files) {
  (files || []).forEach((f) => fs.unlink(f.path, () => {}));
}

// ---------------------------------------------------------------------
// GET /api/messages/conversation
// Fetches (or lazily creates) the current user's support conversation,
// and marks any admin replies as read.
// ---------------------------------------------------------------------
router.get('/conversation', requireAuth, (req, res) => {
  const conv = getOrCreateConversation(req.user.id);
  db.prepare('UPDATE conversations SET user_unread_count = 0 WHERE id = ?').run(conv.id);
  res.json({ conversation: conv, messages: serializeMessages(conv.id) });
});

// ---------------------------------------------------------------------
// POST /api/messages/conversation/send
// Body: message text (may include plain-text links, rendered safely as
// clickable links client-side) plus up to 4 attachments (images/files).
// ---------------------------------------------------------------------
router.post(
  '/conversation/send',
  requireAuth,
  apiLimiter,
  uploadMessageFiles.array('attachments', 4),
  [body('body').trim().isLength({ min: 1, max: 4000 }).withMessage('Message cannot be empty.')],
  (req, res) => {
    if (handleValidation(req, res)) { cleanupFiles(req.files); return; }

    const rejected = rejectInvalidFiles(req.files || []);
    if (rejected.length > 0) {
      cleanupFiles((req.files || []).filter((f) => !rejected.includes(f)));
      return res.status(400).json({ error: 'One or more attachments failed validation and were rejected.' });
    }

    const conv = getOrCreateConversation(req.user.id);
    if (conv.status === 'closed') {
      db.prepare("UPDATE conversations SET status = 'open' WHERE id = ?").run(conv.id);
    }

    db.exec('BEGIN');
    try {
      const result = db.prepare(
        `INSERT INTO messages (conversation_id, sender_id, sender_role, body) VALUES (?, ?, 'user', ?)`
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
        `UPDATE conversations SET admin_unread_count = admin_unread_count + 1, last_message_at = datetime('now') WHERE id = ?`
      ).run(conv.id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      cleanupFiles(req.files);
      console.error(err);
      return res.status(500).json({ error: 'Could not send your message. Please try again.' });
    }

    res.status(201).json({ messages: serializeMessages(conv.id) });
  }
);

// ---------------------------------------------------------------------
// GET /api/messages/unread-count
// Lightweight poll target for a nav badge.
// ---------------------------------------------------------------------
router.get('/unread-count', requireAuth, (req, res) => {
  const conv = db.prepare('SELECT user_unread_count FROM conversations WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
  res.json({ unread: conv ? conv.user_unread_count : 0 });
});

module.exports = router;
