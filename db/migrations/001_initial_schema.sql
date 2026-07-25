-- Complete schema for Cemetery Mapping Information System

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table with approval system
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Messages table with attachments
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

-- Cemeteries table with geospatial support
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

-- Graves/Burial records with GPS and approval
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_death_date CHECK (death_date <= CURRENT_DATE),
  CONSTRAINT valid_birth_date CHECK (birth_date < death_date)
);

-- Grave photos (multiple photos per grave)
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

-- Grave visits/guestbook
CREATE TABLE IF NOT EXISTS grave_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grave_id UUID REFERENCES graves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_name VARCHAR(255),
  visit_date DATE DEFAULT CURRENT_DATE,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Directions requests (for analytics)
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

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_graves_cemetery ON graves(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_graves_deceased_name ON graves(deceased_name);
CREATE INDEX IF NOT EXISTS idx_graves_location ON graves USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_graves_status ON graves(status);
CREATE INDEX IF NOT EXISTS idx_cemeteries_location ON cemeteries USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cemeteries_updated_at 
  BEFORE UPDATE ON cemeteries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graves_updated_at 
  BEFORE UPDATE ON graves 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();