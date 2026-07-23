'use strict';

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const SqliteSessionStore = require('./db/sqliteSessionStore');
const db = require('./db/database');
const { loadUser } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiters');
const csrf = require('./middleware/csrf');

const authRoutes = require('./routes/auth');
const graveRoutes = require('./routes/graves');
const cemeteryRoutes = require('./routes/cemeteries');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
  if (IS_PROD) {
    console.error('FATAL: SESSION_SECRET must be set in production. See .env.example.');
    process.exit(1);
  }
  console.warn('WARNING: SESSION_SECRET not set - using an insecure development default. Set it in .env before deploying.');
}

app.set('trust proxy', 1); // needed for secure cookies behind a reverse proxy / load balancer

// ---------------------------------------------------------------------
// Security headers. We relax connect-src/img-src just enough to allow
// OpenStreetMap tiles and the OSRM public routing API used by the map.
// ---------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
        connectSrc: ["'self'", 'https://router.project-osrm.org', 'https://nominatim.openstreetmap.org'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: IS_PROD ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(compression());
app.use(morgan(IS_PROD ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  session({
    store: new SqliteSessionStore(),
    name: 'cmis.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(loadUser);

// Basic Origin check as defense-in-depth against CSRF on state-changing
// requests, in addition to the token check applied per-route below.
app.use((req, res, next) => {
  const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (stateChanging && req.path.startsWith('/api/')) {
    const origin = req.get('Origin');
    if (origin) {
      const allowedOrigin = `${req.protocol}://${req.get('Host')}`;
      if (origin !== allowedOrigin) {
        return res.status(403).json({ error: 'Request origin could not be verified.' });
      }
    }
  }
  next();
});

// Health check for load balancers / uptime monitors - deliberately
// outside the rate limiter and CSRF check.
app.get('/healthz', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: 'error' });
  }
});

app.use('/api', apiLimiter);
app.get('/api/csrf-token', csrf.issueToken);
app.use('/api', csrf.verifyToken);

app.use('/api/auth', authRoutes);
app.use('/api/graves', graveRoutes);
app.use('/api/cemeteries', cemeteryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact', contactRoutes);

// Uploaded photos - served as static files, never executed.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    index: false,
    setHeaders(res) {
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// Front-end static assets.
app.use(express.static(path.join(__dirname, 'public'), {
  index: 'index.html',
  maxAge: IS_PROD ? '1d' : 0,
  etag: true,
}));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Central error handler - never leak stack traces to the client.
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
});

const server = app.listen(PORT, () => {
  console.log(`Cemetery Mapping & Information System running on http://localhost:${PORT}`);
});

// Graceful shutdown: stop accepting new connections, let in-flight
// requests finish, then close the database cleanly. Matters for zero-
// downtime deploys behind a process manager or container orchestrator.
function shutdown(signal) {
  console.log(`${signal} received: shutting down gracefully…`);
  server.close(() => {
    try { db.close(); } catch (_) { /* already closed */ }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
