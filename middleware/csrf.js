'use strict';

const crypto = require('crypto');

/**
 * Lightweight CSRF protection that doesn't depend on the unmaintained
 * `csurf` package.
 *
 * - A random token is generated per session and handed to the client via
 *   GET /api/csrf-token.
 * - The client must echo that token back in the `X-CSRF-Token` header on
 *   every state-changing request (POST/PUT/PATCH/DELETE).
 * - Because the token lives in the server-side session (not a readable
 *   cookie), a cross-site page cannot obtain it to forge a request, even
 *   though the session cookie itself is sent automatically by the browser.
 * - Combined with SameSite=Lax/Strict session cookies as defense in depth.
 */

function ensureToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function issueToken(req, res) {
  const token = ensureToken(req);
  res.json({ csrfToken: token });
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function verifyToken(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const headerToken = req.get('X-CSRF-Token');
  const sessionToken = req.session && req.session.csrfToken;

  if (
    !sessionToken ||
    !headerToken ||
    headerToken.length !== sessionToken.length ||
    !crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(sessionToken))
  ) {
    return res.status(403).json({ error: 'Your session expired or the request could not be verified. Please refresh and try again.' });
  }
  next();
}

module.exports = { issueToken, verifyToken, ensureToken };
