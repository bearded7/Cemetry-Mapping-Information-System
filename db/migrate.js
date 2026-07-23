'use strict';

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      filename    TEXT NOT NULL UNIQUE,
      applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function runMigrations(db) {
  ensureMigrationsTable(db);

  const applied = new Set(
    db.prepare('SELECT filename FROM schema_migrations').all().map((r) => r.filename)
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // filenames are zero-padded numeric prefixes, so lexical sort == order

  const recordApplied = db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)');

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`[migrate] applying ${file}`);
    db.exec('BEGIN');
    try {
      db.exec(sql);
      recordApplied.run(file);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error(`[migrate] FAILED on ${file}:`, err.message);
      throw err;
    }
  }
}

module.exports = { runMigrations, MIGRATIONS_DIR };
