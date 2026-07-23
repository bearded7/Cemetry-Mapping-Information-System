'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'graves');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Only allow real image types. We check both the extension the browser
// sent AND the MIME type, and we ignore the client-supplied filename
// entirely when writing to disk (prevents path traversal / overwrite
// attacks like "../../server.js" or null-byte tricks).
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB per photo
const MAX_FILES = 5;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext) ? ext : '.jpg';
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${randomName}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    return cb(new Error('Only JPEG, PNG, or WEBP photos are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: MAX_FILES,
  },
});

module.exports = { upload, UPLOAD_DIR };
