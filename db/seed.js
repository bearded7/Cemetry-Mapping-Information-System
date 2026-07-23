'use strict';

// One-time / idempotent seed script.
// Usage: node db/seed.js
// Reads ADMIN_EMAIL / ADMIN_PASSWORD from .env so no credentials are hard-coded.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

function seed() {
  const cemeteryCount = db.prepare('SELECT COUNT(*) AS c FROM cemeteries').get().c;
  if (cemeteryCount === 0) {
    db.prepare(`
      INSERT INTO cemeteries (name, description, address, center_lat, center_lng, default_zoom)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Greenwood Memorial Cemetery',
      "Community cemetery grounds tracked by this system. Coordinates are illustrative - replace with your cemetery's real GPS centre point.",
      '1 Memorial Lane',
      4.8594,
      31.5713,
      18
    );
    console.log('Seeded default cemetery record.');
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping admin creation.');
    console.log('Set them and re-run `node db/seed.js` to create the first admin account.');
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail.toLowerCase());
  if (existing) {
    console.log(`Admin account for ${adminEmail} already exists.`);
    return;
  }

  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, is_active)
    VALUES (?, ?, ?, 'admin', 1)
  `).run('System Administrator', adminEmail.toLowerCase(), hash);

  console.log(`Admin account created for ${adminEmail}.`);
}

seed();
