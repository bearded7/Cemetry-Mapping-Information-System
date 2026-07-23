'use strict';

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'cemetery.db');

const db = new DatabaseSync(DB_PATH);

// WAL mode gives much better read/write concurrency than the default
// rollback journal, which matters once the map and admin panel are
// hitting the database at the same time.
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

function initSchema() {
  const { runMigrations } = require('./migrate');
  runMigrations(db);
}

initSchema();

module.exports = db;
