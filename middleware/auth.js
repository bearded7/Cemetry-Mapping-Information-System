'use strict';

/** Attaches req.user from the session if logged in; otherwise req.user stays undefined. */
function loadUser(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}

/** Blocks the request unless the visitor is logged in. */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be signed in to do that.' });
  }
  next();
}

/** Blocks the request unless the visitor is a logged-in admin. */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be signed in to do that.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access is required for this action.' });
  }
  next();
}

module.exports = { loadUser, requireAuth, requireAdmin };
