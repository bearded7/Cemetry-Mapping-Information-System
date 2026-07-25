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
const fileUpload = require('express-fileupload');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
dbPool.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
});

// Create HTTP server
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.onrender.com'] 
      : ['http://localhost:3000'],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Socket.io handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('message_read', (messageId) => {
    socket.broadcast.emit('message_read', messageId);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org", "https://*.tile.openstreetmap.org"],
      fontSrc: ["'self'", "cdnjs.cloudflare.com", "data:"],
    },
  },
}));

// CORS
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  abortOnLimit: true,
  createParentPath: true,
}));

// Session configuration
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
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'lax',
  },
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make user and notifications available to all views
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.currentPath = req.path;
  res.locals.baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  
  // Get unread notification count
  if (req.session.user) {
    try {
      const result = await dbPool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [req.session.user.id]
      );
      res.locals.unreadCount = parseInt(result.rows[0].count);
    } catch (error) {
      res.locals.unreadCount = 0;
    }
  } else {
    res.locals.unreadCount = 0;
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const cemeteryRoutes = require('./routes/cemeteries');
const graveRoutes = require('./routes/graves');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/auth', authRoutes);
app.use('/cemeteries', cemeteryRoutes);
app.use('/graves', graveRoutes);
app.use('/messages', messageRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Home page
app.get('/', async (req, res) => {
  try {
    const stats = await dbPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries,
        (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves,
        (SELECT COUNT(*) FROM grave_photos) as total_photos,
        (SELECT COUNT(*) FROM grave_visits) as total_visits,
        (SELECT COUNT(*) FROM users WHERE is_approved = true) as total_users
    `);
    
    res.render('index', {
      title: 'Cemetery Mapping Information System',
      description: 'Locate graves of loved ones easily within a cemetery',
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Home error:', error);
    res.render('index', {
      title: 'Cemetery Mapping Information System',
      description: 'Locate graves of loved ones easily within a cemetery',
      stats: { total_cemeteries: 0, total_graves: 0, total_photos: 0, total_visits: 0, total_users: 0 }
    });
  }
});

// Map page
app.get('/map', async (req, res) => {
  try {
    const cemeteriesResult = await dbPool.query(
      'SELECT id, name, latitude, longitude, image_url FROM cemeteries WHERE is_approved = true AND latitude IS NOT NULL AND longitude IS NOT NULL'
    );
    const gravesResult = await dbPool.query(
      `SELECT g.*, c.name as cemetery_name, 
              (SELECT photo_url FROM grave_photos WHERE grave_id = g.id AND is_primary = true LIMIT 1) as primary_photo
       FROM graves g 
       LEFT JOIN cemeteries c ON g.cemetery_id = c.id 
       WHERE g.is_approved = true AND g.latitude IS NOT NULL AND g.longitude IS NOT NULL`
    );
    
    res.render('map', {
      title: 'Cemetery Map',
      cemeteries: cemeteriesResult.rows,
      graves: gravesResult.rows,
      mapboxToken: process.env.MAPBOX_TOKEN || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Map error:', error);
    res.render('map', {
      title: 'Cemetery Map',
      cemeteries: [],
      graves: [],
      mapboxToken: '',
      user: req.session.user
    });
  }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    // Get user's pending approvals
    let pendingGraves = [];
    let pendingCemeteries = [];
    let pendingUsers = [];
    
    if (req.session.user.role === 'admin') {
      const gravesResult = await dbPool.query(
        'SELECT g.*, u.full_name as created_by_name FROM graves g LEFT JOIN users u ON g.created_by = u.id WHERE g.is_approved = false'
      );
      pendingGraves = gravesResult.rows;
      
      const cemeteriesResult = await dbPool.query(
        'SELECT c.*, u.full_name as created_by_name FROM cemeteries c LEFT JOIN users u ON c.created_by = u.id WHERE c.is_approved = false'
      );
      pendingCemeteries = cemeteriesResult.rows;
      
      const usersResult = await dbPool.query(
        'SELECT * FROM users WHERE is_approved = false AND is_active = true'
      );
      pendingUsers = usersResult.rows;
    }
    
    const stats = await dbPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries,
        (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves,
        (SELECT COUNT(*) FROM grave_photos) as total_photos,
        (SELECT COUNT(*) FROM grave_visits) as total_visits,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false) as unread_messages,
        (SELECT COUNT(*) FROM users WHERE is_approved = false) as pending_users
    `, [req.session.user.id]);
    
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.session.user,
      stats: stats.rows[0],
      pendingGraves,
      pendingCemeteries,
      pendingUsers,
      isAdmin: req.session.user.role === 'admin'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.session.user,
      stats: { total_cemeteries: 0, total_graves: 0, total_photos: 0, total_visits: 0, unread_messages: 0, pending_users: 0 },
      pendingGraves: [],
      pendingCemeteries: [],
      pendingUsers: [],
      isAdmin: false
    });
  }
});

// Error handling
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

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: {}
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
});

module.exports = { app, server, dbPool, io };