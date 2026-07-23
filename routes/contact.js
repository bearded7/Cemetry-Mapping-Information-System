'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post(
  '/',
  authLimiter,
  [
    body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Please enter your name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
    body('message').trim().isLength({ min: 5, max: 3000 }).withMessage('Please enter a message.'),
    body('cemeteryId').optional({ checkFalsy: true }).isInt().toInt(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, email, subject, message, cemeteryId } = req.body;
    db.prepare(
      'INSERT INTO contact_messages (cemetery_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)'
    ).run(cemeteryId || null, name, email, subject || null, message);

    res.status(201).json({ message: "Thanks — we've received your message and will get back to you soon." });
  }
);

module.exports = router;
