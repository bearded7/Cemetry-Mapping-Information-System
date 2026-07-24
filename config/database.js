const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection pool
let pool;

const getPool = () => {
  if (!pool) {
    const config = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    pool = new Pool(config);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }
  return pool;
};

const initDatabase = async () => {
  const client = await getPool().connect();
  try {
    // Create extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    
    // Create tables
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
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
        status VARCHAR(50) DEFAULT 'active',
        image_url TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_death_date CHECK (death_date <= CURRENT_DATE),
        CONSTRAINT valid_birth_date CHECK (birth_date < death_date)
      );

      -- Photos table
      CREATE TABLE IF NOT EXISTS grave_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grave_id UUID REFERENCES graves(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        caption TEXT,
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Visits table
      CREATE TABLE IF NOT EXISTS visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grave_id UUID REFERENCES graves(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        visit_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Sessions table for express-session
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP NOT NULL
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_graves_cemetery ON graves(cemetery_id);
      CREATE INDEX IF NOT EXISTS idx_graves_deceased_name ON graves(deceased_name);
      CREATE INDEX IF NOT EXISTS idx_graves_location ON graves USING GIST(location);
      CREATE INDEX IF NOT EXISTS idx_cemeteries_location ON cemeteries USING GIST(location);
      CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
    `);

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Migrations
const runMigrations = async () => {
  const client = await getPool().connect();
  try {
    const migrationsDir = path.join(__dirname, '../db/migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).sort();
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await client.query(sql);
          console.log(`✅ Applied migration: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getPool,
  initDatabase,
  runMigrations,
  pool: getPool()
};