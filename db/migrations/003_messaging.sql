-- 003_messaging.sql
-- Two-way messaging between a registered user and cemetery admins.
-- Modeled as a "support conversation" per user: a user has (at most)
-- one open conversation thread; any admin can reply into it. Messages
-- can carry links (plain text, rendered safely on the client), photos,
-- and general file attachments.

CREATE TABLE IF NOT EXISTS conversations (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject             TEXT NOT NULL DEFAULT 'General inquiry',
    status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    user_unread_count   INTEGER NOT NULL DEFAULT 0,
    admin_unread_count  INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);

CREATE TABLE IF NOT EXISTS messages (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id     INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sender_role         TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
    body                TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE TABLE IF NOT EXISTS message_attachments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id      INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_path       TEXT NOT NULL,
    original_name   TEXT,
    mime_type       TEXT,
    file_size       INTEGER,
    kind            TEXT NOT NULL DEFAULT 'file' CHECK (kind IN ('image', 'file')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON message_attachments(message_id);
