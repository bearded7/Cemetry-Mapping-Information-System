-- Cemetery Mapping & Information System — database schema
-- Uses SQLite (node:sqlite). Foreign keys + indexes keep lookups fast
-- even as the number of graves and users grows.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Users: visitors who register, and admins who moderate submissions.
-- Passwords are always stored as bcrypt hashes, never plaintext.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active       INTEGER NOT NULL DEFAULT 1,
    failed_logins   INTEGER NOT NULL DEFAULT 0,
    locked_until    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------------------------------------------------------------------
-- Cemeteries: supports multiple cemetery grounds, each centred on a
-- real-world coordinate used to initialise the map.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cemeteries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    description     TEXT,
    address         TEXT,
    center_lat      REAL NOT NULL,
    center_lng      REAL NOT NULL,
    default_zoom    INTEGER NOT NULL DEFAULT 18,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- Graves: the core record. Every grave has a precise GPS coordinate so
-- it can be placed on the live map and routed to.
-- Only rows with status = 'approved' are ever shown to the public.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS graves (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    cemetery_id         INTEGER NOT NULL REFERENCES cemeteries(id) ON DELETE CASCADE,
    submitted_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,

    first_name          TEXT NOT NULL,
    last_name            TEXT NOT NULL,
    maiden_name          TEXT,
    date_of_birth        TEXT,          -- ISO date, nullable (unknown)
    date_of_death         TEXT,
    epitaph              TEXT,
    biography             TEXT,
    plot_reference        TEXT,          -- section/row/plot number, human readable

    latitude             REAL NOT NULL,
    longitude            REAL NOT NULL,
    gps_accuracy_m        REAL,          -- accuracy reported by the submitter's device

    status               TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason      TEXT,

    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at            TEXT
);

-- Search & map performance: these are the columns every public query
-- filters or sorts by.
CREATE INDEX IF NOT EXISTS idx_graves_status        ON graves(status);
CREATE INDEX IF NOT EXISTS idx_graves_cemetery       ON graves(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_graves_last_name      ON graves(last_name);
CREATE INDEX IF NOT EXISTS idx_graves_name           ON graves(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_graves_status_cemetery ON graves(status, cemetery_id);
CREATE INDEX IF NOT EXISTS idx_graves_submitted_by   ON graves(submitted_by);
CREATE INDEX IF NOT EXISTS idx_graves_dod            ON graves(date_of_death);

-- Full text search over name/epitaph/biography for fast fuzzy search.
CREATE VIRTUAL TABLE IF NOT EXISTS graves_fts USING fts5(
    first_name, last_name, maiden_name, epitaph, biography, plot_reference,
    content='graves', content_rowid='id'
);

-- Keep the FTS index in sync with the graves table automatically.
CREATE TRIGGER IF NOT EXISTS graves_ai AFTER INSERT ON graves BEGIN
    INSERT INTO graves_fts(rowid, first_name, last_name, maiden_name, epitaph, biography, plot_reference)
    VALUES (new.id, new.first_name, new.last_name, new.maiden_name, new.epitaph, new.biography, new.plot_reference);
END;
CREATE TRIGGER IF NOT EXISTS graves_ad AFTER DELETE ON graves BEGIN
    INSERT INTO graves_fts(graves_fts, rowid, first_name, last_name, maiden_name, epitaph, biography, plot_reference)
    VALUES ('delete', old.id, old.first_name, old.last_name, old.maiden_name, old.epitaph, old.biography, old.plot_reference);
END;
CREATE TRIGGER IF NOT EXISTS graves_au AFTER UPDATE ON graves BEGIN
    INSERT INTO graves_fts(graves_fts, rowid, first_name, last_name, maiden_name, epitaph, biography, plot_reference)
    VALUES ('delete', old.id, old.first_name, old.last_name, old.maiden_name, old.epitaph, old.biography, old.plot_reference);
    INSERT INTO graves_fts(rowid, first_name, last_name, maiden_name, epitaph, biography, plot_reference)
    VALUES (new.id, new.first_name, new.last_name, new.maiden_name, new.epitaph, new.biography, new.plot_reference);
END;

-- ---------------------------------------------------------------------
-- Photos: multiple photos per grave, always tied to the review status
-- of their parent grave record.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grave_photos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    grave_id        INTEGER NOT NULL REFERENCES graves(id) ON DELETE CASCADE,
    file_path       TEXT NOT NULL,       -- relative path under /uploads
    original_name   TEXT,
    caption         TEXT,
    uploaded_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_photos_grave ON grave_photos(grave_id);

-- ---------------------------------------------------------------------
-- Sessions: server-side session store (avoids in-memory sessions,
-- which leak memory and don't survive a restart).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    sid         TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ---------------------------------------------------------------------
-- Audit log: who approved/rejected/edited what, for accountability.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   INTEGER,
    details     TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
