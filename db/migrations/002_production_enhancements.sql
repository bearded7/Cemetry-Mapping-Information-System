-- 002_production_enhancements.sql
-- Adds fields needed for real-world deployment: account security (email
-- verification, password reset, login auditing), richer grave records,
-- a proper plot inventory system separate from burial records, a public
-- contact form, and site-wide configurable settings.

-- ---------------------------------------------------------------------
-- Users: account lifecycle & security fields
-- ---------------------------------------------------------------------
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verify_token TEXT;
ALTER TABLE users ADD COLUMN email_verify_expires TEXT;
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN last_login_ip TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_verify_token ON users(email_verify_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- ---------------------------------------------------------------------
-- Cemeteries: operational detail
-- ---------------------------------------------------------------------
ALTER TABLE cemeteries ADD COLUMN contact_email TEXT;
ALTER TABLE cemeteries ADD COLUMN contact_phone TEXT;
ALTER TABLE cemeteries ADD COLUMN website TEXT;
ALTER TABLE cemeteries ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE cemeteries ADD COLUMN established_year INTEGER;
ALTER TABLE cemeteries ADD COLUMN boundary_geojson TEXT;   -- optional ground outline polygon for the map
ALTER TABLE cemeteries ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

-- ---------------------------------------------------------------------
-- Graves: richer record detail, soft delete, discoverability
-- ---------------------------------------------------------------------
ALTER TABLE graves ADD COLUMN middle_name TEXT;
ALTER TABLE graves ADD COLUMN gender TEXT NOT NULL DEFAULT 'unspecified';
ALTER TABLE graves ADD COLUMN memorial_type TEXT NOT NULL DEFAULT 'grave';
ALTER TABLE graves ADD COLUMN burial_date TEXT;
ALTER TABLE graves ADD COLUMN plot_section TEXT;
ALTER TABLE graves ADD COLUMN plot_row TEXT;
ALTER TABLE graves ADD COLUMN plot_number TEXT;
ALTER TABLE graves ADD COLUMN slug TEXT;
ALTER TABLE graves ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE graves ADD COLUMN is_veteran INTEGER NOT NULL DEFAULT 0;
ALTER TABLE graves ADD COLUMN deleted_at TEXT;             -- soft delete: keeps a record trail instead of hard-erasing history
ALTER TABLE graves ADD COLUMN submitter_note TEXT;         -- private note to reviewers, never shown publicly

CREATE INDEX IF NOT EXISTS idx_graves_slug ON graves(slug);
CREATE INDEX IF NOT EXISTS idx_graves_deleted ON graves(deleted_at);
CREATE INDEX IF NOT EXISTS idx_graves_burial_date ON graves(burial_date);

-- ---------------------------------------------------------------------
-- Plots: the cemetery's own inventory of ground, independent of whether
-- a burial (grave record) has happened yet. Lets staff mark ground as
-- reserved/occupied ahead of time and reconcile it against public
-- submissions.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cemetery_id     INTEGER NOT NULL REFERENCES cemeteries(id) ON DELETE CASCADE,
    section         TEXT,
    row_label       TEXT,
    plot_number     TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'available'
                        CHECK (status IN ('available', 'reserved', 'occupied')),
    latitude        REAL,
    longitude       REAL,
    grave_id        INTEGER REFERENCES graves(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (cemetery_id, section, row_label, plot_number)
);
CREATE INDEX IF NOT EXISTS idx_plots_cemetery ON plots(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_plots_status ON plots(status);
CREATE INDEX IF NOT EXISTS idx_plots_grave ON plots(grave_id);

-- ---------------------------------------------------------------------
-- Contact messages: a simple public "contact the cemetery office" form.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cemetery_id     INTEGER REFERENCES cemeteries(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    subject         TEXT,
    message         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);

-- ---------------------------------------------------------------------
-- System settings: small key/value store for site-wide configuration
-- editable by an admin without a redeploy.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO system_settings (key, value) VALUES
    ('site_name', 'Greenwood Registry'),
    ('allow_public_registration', '1'),
    ('max_photos_per_grave', '5');
