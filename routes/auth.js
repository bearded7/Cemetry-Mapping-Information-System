'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { authLimiter } = require('../middleware/rateLimiters');
const { logAction } = require('../utils/audit');

const router = express.Router();

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

function publicUser(row) {
  return { id: row.id, fullName: row.full_name, email: row.email, role: row.role };
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------
router.post(
  '/register',
  authLimiter,
  [
    body('fullName').trim().isLength({ min: 2, max: 120 }).withMessage('Please enter your full name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('password')
      .isLength({ min: 10 })
      .withMessage('Password must be at least 10 characters long.')
      .matches(/[A-Z]/).withMessage('Password must include an uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must include a lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must include a number.'),
  ],
  (req, res) => {
    if (handleValidation(req, res)) return;

    const { fullName, email, password } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      // Same generic message whether or not the account exists, so we
      // don't leak which emails are registered.
      return res.status(400).json({ error: 'Could not create account with those details.' });
    }

    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const result = db
      .prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(fullName, email, hash, 'user');

    const user = { id: Number(result.lastInsertRowid), full_name: fullName, email, role: 'user' };
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Registration succeeded but sign-in failed. Please log in.' });
      req.session.user = publicUser(user);
      logAction(user.id, 'register', 'user', user.id);
      res.status(201).json({ user: publicUser(user) });
    });
  }
);

// ---------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Please enter your password.'),
  ],
  (req, res) => {
    if (handleValidation(req, res)) return;

    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    const genericError = { error: 'Incorrect email or password.' };

    if (!user || !user.is_active) {
      return res.status(401).json(genericError);
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return res.status(423).json({ error: `Account temporarily locked due to failed attempts. Try again after ${LOCK_MINUTES} minutes.` });
    }

    const passwordOk = bcrypt.compareSync(password, user.password_hash);

    if (!passwordOk) {
      const failedLogins = user.failed_logins + 1;
      let lockedUntil = null;
      if (failedLogins >= MAX_FAILED_LOGINS) {
        lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
      }
      db.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').run(failedLogins, lockedUntil, user.id);
      return res.status(401).json(genericError);
    }

    db.prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?').run(user.id);

    // Regenerate the session on privilege change to prevent session fixation.
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Something went wrong signing you in. Please try again.' });
      req.session.user = publicUser(user);
      logAction(user.id, 'login', 'user', user.id);
      res.json({ user: publicUser(user) });
    });
  }
);

// ---------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------
router.post('/logout', (req, res) => {
  const userId = req.session.user ? req.session.user.id : null;
  req.session.destroy(() => {
    res.clearCookie('cmis.sid');
    logAction(userId, 'logout', 'user', userId);
    res.json({ ok: true });
  });
});

// ---------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------
router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
