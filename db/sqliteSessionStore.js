'use strict';

const session = require('express-session');
const db = require('./database');

const DAY_MS = 24 * 60 * 60 * 1000;

class SqliteSessionStore extends session.Store {
  constructor(options = {}) {
    super(options);
    this.ttl = options.ttl || DAY_MS;

    this._get = db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?');
    this._upsert = db.prepare(`
      INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
      ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at
    `);
    this._del = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this._clearExpired = db.prepare('DELETE FROM sessions WHERE expires_at < ?');

    // Periodically sweep expired sessions so the table doesn't grow forever.
    this._sweeper = setInterval(() => {
      try { this._clearExpired.run(Date.now()); } catch (_) { /* noop */ }
    }, 60 * 60 * 1000);
    this._sweeper.unref();
  }

  get(sid, cb) {
    try {
      const row = this._get.get(sid);
      if (!row || row.expires_at < Date.now()) return cb(null, null);
      cb(null, JSON.parse(row.data));
    } catch (err) {
      cb(err);
    }
  }

  set(sid, sessionData, cb) {
    try {
      const maxAge = sessionData.cookie && sessionData.cookie.maxAge ? sessionData.cookie.maxAge : this.ttl;
      const expiresAt = Date.now() + maxAge;
      this._upsert.run(sid, JSON.stringify(sessionData), expiresAt);
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  destroy(sid, cb) {
    try {
      this._del.run(sid);
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  touch(sid, sessionData, cb) {
    this.set(sid, sessionData, cb || (() => {}));
  }
}

module.exports = SqliteSessionStore;
