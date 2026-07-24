/**
 * Cemetery Mapping Information System - Main Server
 * Debugged and optimized for production
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { initDatabase, pool } = require('./config/database');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create database pool
const dbPool = new Pool(dbConfig);

// Test database connection
dbPool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
  release();
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org"],
    },
  },
}));

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.onrender.com'] 
    : ['http://localhost:3000'],
  credentials: true,
}));

// Compression
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
const sessionConfig = {
  store: new pgSession({
    pool: dbPool,
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'default-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  },
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.currentPath = req.path;
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const cemeteryRoutes = require('./routes/cemeteries');
const graveRoutes = require('./routes/graves');
const apiRoutes = require('./routes/api');

// Routes
app.use('/auth', authRoutes);
app.use('/cemeteries', cemeteryRoutes);
app.use('/graves', graveRoutes);
app.use('/api', apiRoutes);

// Home Page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Cemetery Mapping Information System',
    description: 'Locate graves of loved ones easily within a cemetery'
  });
});

// Map Page
app.get('/map', (req, res) => {
  res.render('map', {
    title: 'Cemetery Map',
    cemeteries: [],
    graves: []
  });
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('dashboard', {
    title: 'Dashboard',
    user: req.session.user
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Something went wrong!';
  
  if (req.xhr || req.path.startsWith('/api')) {
    return res.status(status).json({ error: message });
  }
  
  res.status(status).render('error', {
    title: 'Error',
    message: message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: {}
  });
});

// Start Server
const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    dbPool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, dbPool };