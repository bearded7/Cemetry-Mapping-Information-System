'use strict';

const rateLimit = require('express-rate-limit');

// Generic API limiter - generous, just stops runaway scripts.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

// Auth endpoints are the highest-value target for brute forcing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});

// Grave submissions involve file uploads and DB writes - keep it sane.
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions this hour. Please try again later.' },
});

module.exports = { apiLimiter, authLimiter, submissionLimiter };
