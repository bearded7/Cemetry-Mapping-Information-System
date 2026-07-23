'use strict';

const db = require('../db/database');

const insert = db.prepare(`
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
  VALUES (?, ?, ?, ?, ?)
`);

function logAction(userId, action, entityType, entityId, details) {
  try {
    insert.run(userId || null, action, entityType, entityId || null, details ? JSON.stringify(details) : null);
  } catch (err) {
    console.error('audit log write failed:', err.message);
  }
}

module.exports = { logAction };
