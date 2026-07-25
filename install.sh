#!/bin/bash
# ============================================================
# Cemetery Mapping Information System - Complete Install Script
# Version: 3.0.0
# Description: Full installation and setup for production deployment
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Cemetery Mapping Information System - Installation Script${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# ============================================================
# 1. CHECK SYSTEM REQUIREMENTS
# ============================================================
echo -e "${YELLOW}[1/8] Checking system requirements...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL found: $(psql --version)${NC}"
fi

# ============================================================
# 2. CREATE DIRECTORY STRUCTURE
# ============================================================
echo -e "${YELLOW}[2/8] Creating directory structure...${NC}"

# Create main directories
mkdir -p config
mkdir -p routes
mkdir -p views/{cemeteries,graves,messages,partials}
mkdir -p public/{css,js,images}
mkdir -p uploads/{profiles,graves,cemeteries,messages,thumbnails}
mkdir -p logs
mkdir -p db/migrations
mkdir -p data/samples
mkdir -p scripts
mkdir -p middleware
mkdir -p utils

echo -e "${GREEN}✅ Directory structure created${NC}"

# ============================================================
# 3. CREATE PACKAGE.JSON
# ============================================================
echo -e "${YELLOW}[3/8] Creating package.json...${NC}"

cat > package.json << 'EOF'
{
  "name": "cemetery-mapping-information-system",
  "version": "3.0.0",
  "description": "Cemetery Mapping and Information System - Locate graves easily",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node db/seed.js",
    "migrate": "node db/migrate.js",
    "setup": "bash scripts/install.sh",
    "docker-build": "docker-compose build",
    "docker-up": "docker-compose up -d"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.0",
    "pg": "^8.11.3",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "leaflet": "^1.9.4",
    "axios": "^1.5.0",
    "validator": "^13.11.0",
    "uuid": "^9.0.0",
    "bcrypt": "^5.1.1",
    "sharp": "^0.32.5",
    "socket.io": "^4.7.2",
    "nodemailer": "^6.9.5",
    "express-fileupload": "^1.4.0",
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "keywords": [
    "cemetery",
    "mapping",
    "grave-locator",
    "gis",
    "memorial"
  ],
  "author": "Bearded7",
  "license": "MIT"
}
EOF

echo -e "${GREEN}✅ package.json created${NC}"

# ============================================================
# 4. CREATE CONFIG FILES
# ============================================================
echo -e "${YELLOW}[4/8] Creating configuration files...${NC}"

# Create database config
cat > config/database.js << 'EOF'
/**
 * Database Configuration - PostgreSQL Only
 */

const { Pool } = require('pg');

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

module.exports = {
  getPool: () => pool,
  pool: pool,
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect()
};
EOF

# Create .env.example
cat > .env.example << 'EOF'
# Application Settings
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Database - PostgreSQL only
DATABASE_URL=postgresql://postgres:password@localhost:5432/cemetery_db

# Session
SESSION_SECRET=your-super-secret-session-key-change-this

# Admin User
ADMIN_EMAIL=admin@cemetery.com
ADMIN_PASSWORD=admin123

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Mapbox (optional)
MAPBOX_TOKEN=your-mapbox-token-here
EOF

# Create .node-version
echo "18.0.0" > .node-version

# Create .python-version (for Render)
echo "3.11.0" > .python-version

echo -e "${GREEN}✅ Configuration files created${NC}"

# ============================================================
# 5. CREATE DATABASE FILES
# ============================================================
echo -e "${YELLOW}[5/8] Creating database files...${NC}"

# Create migration file
cat > db/migrations/001_initial_schema.sql << 'EOF'
-- Cemetery Mapping Information System - Initial Schema
-- PostgreSQL with PostGIS

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  profile_photo TEXT,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Cemeteries table
CREATE TABLE IF NOT EXISTS cemeteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location GEOMETRY(Point, 4326),
  total_graves INTEGER DEFAULT 0,
  established_year INTEGER,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  website_url VARCHAR(255),
  opening_hours VARCHAR(255),
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Graves table
CREATE TABLE IF NOT EXISTS graves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cemetery_id UUID REFERENCES cemeteries(id) ON DELETE CASCADE,
  section VARCHAR(100),
  block VARCHAR(100),
  plot_number VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location GEOMETRY(Point, 4326),
  deceased_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  death_date DATE,
  age_at_death INTEGER,
  gender VARCHAR(50),
  nationality VARCHAR(100),
  occupation VARCHAR(255),
  epitaph TEXT,
  grave_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grave photos
CREATE TABLE IF NOT EXISTS grave_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grave_id UUID REFERENCES graves(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  parent_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message attachments
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grave visits
CREATE TABLE IF NOT EXISTS grave_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grave_id UUID REFERENCES graves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_name VARCHAR(255),
  visit_date DATE DEFAULT CURRENT_DATE,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Directions requests
CREATE TABLE IF NOT EXISTS directions_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grave_id UUID REFERENCES graves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_graves_cemetery ON graves(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_graves_deceased_name ON graves(deceased_name);
CREATE INDEX IF NOT EXISTS idx_graves_location ON graves USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_cemeteries_location ON cemeteries USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cemeteries_updated_at 
  BEFORE UPDATE ON cemeteries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graves_updated_at 
  BEFORE UPDATE ON graves 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

# Create migrate.js
cat > db/migrate.js << 'EOF'
const { getPool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(sql);
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
EOF

# Create seed.js
cat > db/seed.js << 'EOF'
const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cemetery.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_approved)
       VALUES ($1, $2, $3, 'admin', true)
       ON CONFLICT (email) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name`,
      [adminEmail, hashedPassword, 'System Administrator']
    );
    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
EOF

echo -e "${GREEN}✅ Database files created${NC}"

# ============================================================
# 6. INSTALL DEPENDENCIES
# ============================================================
echo -e "${YELLOW}[6/8] Installing dependencies...${NC}"

# Remove old node_modules and lock file
rm -rf node_modules package-lock.json

# Install dependencies
npm install --production=false

echo -e "${GREEN}✅ Dependencies installed${NC}"

# ============================================================
# 7. CREATE SERVER FILES
# ============================================================
echo -e "${YELLOW}[7/8] Creating server files...${NC}"

# Create server.js
cat > server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { getPool } = require('./config/database');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const { createServer } = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPool = getPool();

dbPool.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org"],
      fontSrc: ["'self'", "cdnjs.cloudflare.com", "data:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.onrender.com'] 
    : ['http://localhost:3000'],
  credentials: true,
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  abortOnLimit: true,
  createParentPath: true,
}));

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
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.currentPath = req.path;
  res.locals.baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  if (req.session.user) {
    try {
      const result = await dbPool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [req.session.user.id]
      );
      res.locals.unreadCount = parseInt(result.rows[0].count);
    } catch {
      res.locals.unreadCount = 0;
    }
  } else {
    res.locals.unreadCount = 0;
  }
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewsRoutes = require('./routes/views');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const cemeteryRoutes = require('./routes/cemeteries');
const graveRoutes = require('./routes/graves');
const messageRoutes = require('./routes/messages');

app.use('/', viewsRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/cemeteries', cemeteryRoutes);
app.use('/graves', graveRoutes);
app.use('/messages', messageRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

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

app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: {}
  });
});

const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    dbPool.end(() => process.exit(0));
  });
});

module.exports = { app, server, dbPool };
EOF

# Create middleware/auth.js
mkdir -p middleware
cat > middleware/auth.js << 'EOF'
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    title: 'Access Denied',
    message: 'You do not have permission to access this page.',
    error: {}
  });
};

module.exports = { isAuthenticated, isAdmin };
EOF

# Create utils/helpers.js
mkdir -p utils
cat > utils/helpers.js << 'EOF'
const validator = require('validator');

const validateEmail = (email) => validator.isEmail(email);
const validatePassword = (password) => password && password.length >= 8;
const sanitizeInput = (input) => validator.escape(input || '');

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateAge = (birthDate, deathDate) => {
  if (!birthDate || !deathDate) return null;
  const birth = new Date(birthDate);
  const death = new Date(deathDate);
  let age = death.getFullYear() - birth.getFullYear();
  const monthDiff = death.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) age--;
  return age;
};

module.exports = { validateEmail, validatePassword, sanitizeInput, formatDate, calculateAge };
EOF

# Create routes/index.js
cat > routes/index.js << 'EOF'
const authRoutes = require('./auth');
const apiRoutes = require('./api');
const viewsRoutes = require('./views');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');
const cemeteryRoutes = require('./cemeteries');
const graveRoutes = require('./graves');
const messageRoutes = require('./messages');

module.exports = {
  authRoutes,
  apiRoutes,
  viewsRoutes,
  profileRoutes,
  adminRoutes,
  cemeteryRoutes,
  graveRoutes,
  messageRoutes,
  registerRoutes: (app) => {
    app.use('/', viewsRoutes);
    app.use('/auth', authRoutes);
    app.use('/api', apiRoutes);
    app.use('/profile', profileRoutes);
    app.use('/admin', adminRoutes);
    app.use('/cemeteries', cemeteryRoutes);
    app.use('/graves', graveRoutes);
    app.use('/messages', messageRoutes);
  }
};
EOF

echo -e "${GREEN}✅ Server files created${NC}"

# ============================================================
# 8. CREATE BASIC ROUTE STUBS
# ============================================================
echo -e "${YELLOW}[8/8] Creating route stubs...${NC}"

# Create auth routes stub
cat > routes/auth.js << 'EOF'
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');
const { validateEmail } = require('../utils/helpers');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Login', error: null, email: '' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('login', { title: 'Login', error: 'Email and password required', email });
  }
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.render('login', { title: 'Login', error: 'Invalid credentials', email });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.render('login', { title: 'Login', error: 'Invalid credentials', email });
    }
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    req.session.user = { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { title: 'Login', error: 'An error occurred', email });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Register', error: null, formData: {} });
});

router.post('/register', async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body;
  const formData = { full_name, email };
  if (!full_name || !email || !password) {
    return res.render('register', { title: 'Register', error: 'All fields required', formData });
  }
  if (!validateEmail(email)) {
    return res.render('register', { title: 'Register', error: 'Invalid email', formData });
  }
  if (password !== confirm_password) {
    return res.render('register', { title: 'Register', error: 'Passwords do not match', formData });
  }
  if (password.length < 8) {
    return res.render('register', { title: 'Register', error: 'Password must be at least 8 characters', formData });
  }
  try {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role`,
      [email.toLowerCase(), hashedPassword, full_name]
    );
    req.session.user = result.rows[0];
    res.redirect('/dashboard');
  } catch (error) {
    if (error.code === '23505') {
      return res.render('register', { title: 'Register', error: 'Email already registered', formData });
    }
    console.error('Registration error:', error);
    res.render('register', { title: 'Register', error: 'An error occurred', formData });
  }
});

module.exports = router;
EOF

# Create basic views stub
cat > routes/views.js << 'EOF'
const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries,
        (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves,
        (SELECT COUNT(*) FROM grave_photos) as total_photos,
        (SELECT COUNT(*) FROM grave_visits) as total_visits
    `);
    res.render('index', { title: 'Cemetery Mapping System', stats: stats.rows[0] });
  } catch {
    res.render('index', { title: 'Cemetery Mapping System', stats: { total_cemeteries: 0, total_graves: 0, total_photos: 0, total_visits: 0 } });
  }
});

router.get('/map', async (req, res) => {
  try {
    const pool = getPool();
    const cemeteries = await pool.query('SELECT id, name, latitude, longitude FROM cemeteries WHERE is_approved = true');
    const graves = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.is_approved = true');
    res.render('map', { title: 'Cemetery Map', cemeteries: cemeteries.rows, graves: graves.rows });
  } catch {
    res.render('map', { title: 'Cemetery Map', cemeteries: [], graves: [] });
  }
});

router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('dashboard', { title: 'Dashboard', user: req.session.user });
});

router.get('/cemeteries', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM cemeteries WHERE is_approved = true ORDER BY name');
    res.render('cemeteries/index', { title: 'Cemeteries', cemeteries: result.rows });
  } catch {
    res.render('cemeteries/index', { title: 'Cemeteries', cemeteries: [] });
  }
});

router.get('/cemeteries/:id', async (req, res) => {
  try {
    const pool = getPool();
    const cemetery = await pool.query('SELECT * FROM cemeteries WHERE id = $1 AND is_approved = true', [req.params.id]);
    if (cemetery.rows.length === 0) throw new Error('Not found');
    const graves = await pool.query('SELECT * FROM graves WHERE cemetery_id = $1 AND is_approved = true', [req.params.id]);
    res.render('cemeteries/view', { title: cemetery.rows[0].name, cemetery: cemetery.rows[0], graves: graves.rows });
  } catch {
    res.status(404).render('error', { title: 'Not Found', message: 'Cemetery not found', error: {} });
  }
});

router.get('/graves', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.is_approved = true ORDER BY g.deceased_name');
    res.render('graves/index', { title: 'Graves', graves: result.rows });
  } catch {
    res.render('graves/index', { title: 'Graves', graves: [] });
  }
});

router.get('/graves/:id', async (req, res) => {
  try {
    const pool = getPool();
    const grave = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.id = $1 AND g.is_approved = true', [req.params.id]);
    if (grave.rows.length === 0) throw new Error('Not found');
    const photos = await pool.query('SELECT * FROM grave_photos WHERE grave_id = $1', [req.params.id]);
    res.render('graves/view', { title: grave.rows[0].deceased_name, grave: grave.rows[0], photos: photos.rows });
  } catch {
    res.status(404).render('error', { title: 'Not Found', message: 'Grave not found', error: {} });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

module.exports = router;
EOF

# Create basic API stub
cat > routes/api.js << 'EOF'
const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

router.get('/cemeteries', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM cemeteries WHERE is_approved = true ORDER BY name');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch cemeteries' });
  }
});

router.get('/graves', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.is_approved = true');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch graves' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries, (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves');
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = router;
EOF

# Create stub routes for other modules
echo "module.exports = require('express').Router();" > routes/profile.js
echo "module.exports = require('express').Router();" > routes/admin.js
echo "module.exports = require('express').Router();" > routes/cemeteries.js
echo "module.exports = require('express').Router();" > routes/graves.js
echo "module.exports = require('express').Router();" > routes/messages.js

echo -e "${GREEN}✅ Route stubs created${NC}"

# ============================================================
# 9. CREATE BASIC VIEWS
# ============================================================
echo -e "${YELLOW}[9/9] Creating basic views...${NC}"

# Create index view
cat > views/index.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/public/css/style.css">
</head>
<body>
  <%- include('partials/header') %>
  <div class="container py-5">
    <div class="row">
      <div class="col-md-8 mx-auto text-center">
        <h1 class="display-4"><i class="fas fa-church text-primary"></i> Cemetery Mapping System</h1>
        <p class="lead">Locate graves of loved ones easily within a cemetery</p>
        <hr>
        <div class="row mt-4">
          <div class="col-md-4">
            <h3><%= stats.total_cemeteries || 0 %></h3>
            <p class="text-muted">Cemeteries</p>
          </div>
          <div class="col-md-4">
            <h3><%= stats.total_graves || 0 %></h3>
            <p class="text-muted">Graves</p>
          </div>
          <div class="col-md-4">
            <h3><%= stats.total_photos || 0 %></h3>
            <p class="text-muted">Photos</p>
          </div>
        </div>
        <div class="mt-4">
          <a href="/map" class="btn btn-primary btn-lg">Explore Map</a>
          <a href="/cemeteries" class="btn btn-outline-secondary btn-lg">Browse Cemeteries</a>
        </div>
      </div>
    </div>
  </div>
  <%- include('partials/footer') %>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
EOF

# Create header partial
cat > views/partials/header.ejs << 'EOF'
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand" href="/"><i class="fas fa-church me-2"></i>Cemetery System</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="/map">Map</a></li>
        <li class="nav-item"><a class="nav-link" href="/cemeteries">Cemeteries</a></li>
        <li class="nav-item"><a class="nav-link" href="/graves">Graves</a></li>
        <% if (isAuthenticated) { %>
          <li class="nav-item"><a class="nav-link" href="/dashboard">Dashboard</a></li>
          <li class="nav-item"><a class="nav-link" href="/auth/logout">Logout</a></li>
        <% } else { %>
          <li class="nav-item"><a class="nav-link" href="/auth/login">Login</a></li>
          <li class="nav-item"><a class="nav-link" href="/auth/register">Register</a></li>
        <% } %>
      </ul>
    </div>
  </div>
</nav>
EOF

# Create footer partial
cat > views/partials/footer.ejs << 'EOF'
<footer class="footer bg-dark text-white py-3 mt-5">
  <div class="container text-center">
    <p class="mb-0">&copy; 2026 Cemetery Mapping Information System</p>
  </div>
</footer>
EOF

# Create other view stubs
cat > views/login.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Login</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <div class="container py-5"><div class="row justify-content-center"><div class="col-md-4">
    <h3>Login</h3>
    <% if (error) { %><div class="alert alert-danger"><%= error %></div><% } %>
    <form action="/auth/login" method="POST">
      <div class="mb-3"><input type="email" name="email" class="form-control" placeholder="Email" value="<%= email %>" required></div>
      <div class="mb-3"><input type="password" name="password" class="form-control" placeholder="Password" required></div>
      <button type="submit" class="btn btn-primary w-100">Login</button>
    </form>
    <p class="mt-3"><a href="/auth/register">Register</a></p>
  </div></div></div>
</body>
</html>
EOF

cat > views/register.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Register</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <div class="container py-5"><div class="row justify-content-center"><div class="col-md-4">
    <h3>Register</h3>
    <% if (error) { %><div class="alert alert-danger"><%= error %></div><% } %>
    <form action="/auth/register" method="POST">
      <div class="mb-3"><input type="text" name="full_name" class="form-control" placeholder="Full Name" value="<%= formData.full_name || '' %>" required></div>
      <div class="mb-3"><input type="email" name="email" class="form-control" placeholder="Email" value="<%= formData.email || '' %>" required></div>
      <div class="mb-3"><input type="password" name="password" class="form-control" placeholder="Password (min 8 chars)" required></div>
      <div class="mb-3"><input type="password" name="confirm_password" class="form-control" placeholder="Confirm Password" required></div>
      <button type="submit" class="btn btn-primary w-100">Register</button>
    </form>
    <p class="mt-3"><a href="/auth/login">Login</a></p>
  </div></div></div>
</body>
</html>
EOF

cat > views/dashboard.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Dashboard</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <%- include('partials/header') %>
  <div class="container py-5">
    <h2>Dashboard</h2>
    <p>Welcome, <%= user.full_name %>!</p>
    <a href="/graves/new" class="btn btn-primary">Add Grave</a>
    <a href="/cemeteries/new" class="btn btn-success">Add Cemetery</a>
  </div>
  <%- include('partials/footer') %>
</body>
</html>
EOF

cat > views/map.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Map</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>#map { height: 600px; }</style>
</head>
<body>
  <%- include('partials/header') %>
  <div class="container-fluid p-0">
    <div id="map"></div>
  </div>
  <%- include('partials/footer') %>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([20.0, 0.0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const cemeteries = <%- JSON.stringify(cemeteries || []) %>;
    const graves = <%- JSON.stringify(graves || []) %>;
    cemeteries.forEach(c => {
      if (c.latitude && c.longitude) {
        L.marker([c.latitude, c.longitude]).bindPopup(`<b>${c.name}</b>`).addTo(map);
      }
    });
    graves.forEach(g => {
      if (g.latitude && g.longitude) {
        L.marker([g.latitude, g.longitude]).bindPopup(`<b>${g.deceased_name}</b>`).addTo(map);
      }
    });
  </script>
</body>
</html>
EOF

cat > views/error.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title><%= title %></title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <%- include('partials/header') %>
  <div class="container py-5 text-center">
    <h1><%= title %></h1>
    <p><%= message %></p>
    <a href="/" class="btn btn-primary">Go Home</a>
  </div>
  <%- include('partials/footer') %>
</body>
</html>
EOF

# Create cemetery view stubs
cat > views/cemeteries/index.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Cemeteries</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <%- include('../partials/header') %>
  <div class="container py-5">
    <h2>Cemeteries</h2>
    <div class="row">
      <% if (cemeteries && cemeteries.length > 0) { %>
        <% cemeteries.forEach(c => { %>
          <div class="col-md-4"><div class="card mb-3"><div class="card-body"><h5><%= c.name %></h5><p><%= c.address %></p><a href="/cemeteries/<%= c.id %>" class="btn btn-sm btn-primary">View</a></div></div></div>
        <% }) %>
      <% } else { %><p>No cemeteries found.</p><% } %>
    </div>
  </div>
  <%- include('../partials/footer') %>
</body>
</html>
EOF

cat > views/cemeteries/view.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title><%= cemetery.name %></title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <%- include('../partials/header') %>
  <div class="container py-5">
    <h2><%= cemetery.name %></h2>
    <p><%= cemetery.address %></p>
    <h4>Graves</h4>
    <div class="row">
      <% if (graves && graves.length > 0) { %>
        <% graves.forEach(g => { %><div class="col-md-4"><div class="card mb-3"><div class="card-body"><h5><%= g.deceased_name %></h5><a href="/graves/<%= g.id %>" class="btn btn-sm btn-primary">View</a></div></div></div><% }) %>
      <% } else { %><p>No graves in this cemetery.</p><% } %>
    </div>
    <a href="/cemeteries" class="btn btn-secondary">Back</a>
  </div>
  <%- include('../partials/footer') %>
</body>
</html>
EOF

# Create grave view stubs
cat > views/graves/index.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Graves</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <%- include('../partials/header') %>
  <div class="container py-5">
    <h2>Graves</h2>
    <div class="row">
      <% if (graves && graves.length > 0) { %>
        <% graves.forEach(g => { %>
          <div class="col-md-4"><div class="card mb-3"><div class="card-body"><h5><%= g.deceased_name %></h5><p><%= g.cemetery_name || 'Unknown' %></p><a href="/graves/<%= g.id %>" class="btn btn-sm btn-primary">View</a></div></div></div>
        <% }) %>
      <% } else { %><p>No graves found.</p><% } %>
    </div>
  </div>
  <%- include('../partials/footer') %>
</body>
</html>
EOF

cat > views/graves/view.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title><%= grave.deceased_name %></title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body>
  <%- include('../partials/header') %>
  <div class="container py-5">
    <h2><%= grave.deceased_name %></h2>
    <p><strong>Cemetery:</strong> <%= grave.cemetery_name || 'Unknown' %></p>
    <p><strong>Born:</strong> <%= grave.birth_date || 'Unknown' %></p>
    <p><strong>Died:</strong> <%= grave.death_date || 'Unknown' %></p>
    <% if (grave.epitaph) { %><p><strong>Epitaph:</strong> "<%= grave.epitaph %>"</p><% } %>
    <div class="mt-3">
      <% if (photos && photos.length > 0) { %>
        <h4>Photos</h4>
        <div class="row">
          <% photos.forEach(p => { %><div class="col-md-3"><img src="<%= p.photo_url %>" class="img-fluid rounded mb-2"></div><% }) %>
        </div>
      <% } %>
    </div>
    <a href="/graves" class="btn btn-secondary mt-3">Back</a>
  </div>
  <%- include('../partials/footer') %>
</body>
</html>
EOF

# Create new.ejs stubs
cat > views/cemeteries/new.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Add Cemetery</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body><%- include('../partials/header') %><div class="container py-5"><h2>Add Cemetery</h2><form action="/cemeteries/create" method="POST"><div class="mb-3"><input type="text" name="name" class="form-control" placeholder="Name" required></div><div class="mb-3"><input type="text" name="address" class="form-control" placeholder="Address" required></div><button type="submit" class="btn btn-primary">Save</button></form></div><%- include('../partials/footer') %></body>
</html>
EOF

cat > views/graves/new.ejs << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Add Grave</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body><%- include('../partials/header') %><div class="container py-5"><h2>Add Grave</h2><form action="/graves/create" method="POST"><div class="mb-3"><input type="text" name="deceased_name" class="form-control" placeholder="Deceased Name" required></div><div class="mb-3"><input type="number" step="any" name="latitude" class="form-control" placeholder="Latitude" required></div><div class="mb-3"><input type="number" step="any" name="longitude" class="form-control" placeholder="Longitude" required></div><button type="submit" class="btn btn-primary">Save</button></form></div><%- include('../partials/footer') %></body>
</html>
EOF

echo -e "${GREEN}✅ Views created${NC}"

# ============================================================
# 10. CREATE CSS FILE
# ============================================================
cat > public/css/style.css << 'EOF'
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
.card { transition: transform 0.2s; }
.card:hover { transform: translateY(-5px); }
footer { margin-top: auto; }
.grave-card { border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.hero-section { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 80px 0; }
.marker-pin { display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white; }
.cemetery-pin { background: #2c3e7a; width: 36px; height: 36px; }
.grave-pin { background: #3498db; width: 30px; height: 30px; }
EOF

# ============================================================
# 11. CREATE RENDER.YAML
# ============================================================
cat > render.yaml << 'EOF'
services:
  - type: web
    name: cemetery-mapping-system
    env: node
    plan: free
    buildCommand: |
      npm install --production=false
      npm run migrate || true
      npm run seed || true
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 18.0.0
      - key: NODE_ENV
        value: production
      - key: SESSION_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: cemetery-db
          property: connectionString
    healthCheckPath: /
    autoDeploy: true

  - type: postgresql
    name: cemetery-db
    plan: free
    ipAllowList: []
    postgresMajorVersion: 15
    databaseName: cemetery_db
    user: postgres
EOF

# ============================================================
# 12. CREATE .GITIGNORE
# ============================================================
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
uploads/
*.sqlite
*.sqlite3
.DS_Store
.vscode/
.idea/
*.swp
*.swo
coverage/
tmp/
*.pid
EOF

# ============================================================
# 13. CREATE README
# ============================================================
cat > README.md << 'EOF'
# Cemetery Mapping Information System

A comprehensive web application for cemetery mapping and grave location management.

## Features

- 🗺️ Interactive Map with GPS and directions
- 🔍 Smart Search for graves and cemeteries
- 📸 Photo upload and management
- 👤 User registration with admin approval
- 💬 Messaging system with attachments
- 📊 Dashboard with statistics

## Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd Cemetry-Mapping-Information-System
bash scripts/install.sh

# Run
npm start