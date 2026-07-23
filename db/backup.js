'use strict';

// Simple, safe SQLite backup: checkpoints the WAL file so all committed
// data is in the main database file, then copies it out with a
// timestamped name. Run manually or from a daily cron job:
//
//   node db/backup.js
//   0 3 * * * cd /opt/cemetery-registry && node db/backup.js >> logs/backup.log 2>&1

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./database');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const KEEP_LAST_N = 14; // keep two weeks of daily backups by default

function backup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  db.exec('PRAGMA wal_checkpoint(FULL);');

  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cemetery.db');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destPath = path.join(BACKUP_DIR, `cemetery-${stamp}.db`);

  fs.copyFileSync(dbPath, destPath);
  console.log(`Backup written to ${destPath}`);

  // Prune old backups beyond the retention window.
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('cemetery-') && f.endsWith('.db'))
    .sort();
  while (files.length > KEEP_LAST_N) {
    const oldest = files.shift();
    fs.unlinkSync(path.join(BACKUP_DIR, oldest));
    console.log(`Pruned old backup ${oldest}`);
  }
}

backup();
