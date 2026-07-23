'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'messages');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Messages support images (shown inline) and a modest set of common
// document types (shown as a download link). Executables, scripts, and
// anything else are rejected outright.
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['application/pdf', '.pdf'],
  ['text/plain', '.txt'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per attachment
const MAX_FILES = 4;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = ALLOWED.get(file.mimetype) || '.bin';
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${randomName}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED.has(file.mimetype)) {
    return cb(new Error('That file type is not supported. Allowed: images, PDF, TXT, DOC/DOCX.'));
  }
  cb(null, true);
}

const uploadMessageFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
});

module.exports = { uploadMessageFiles, UPLOAD_DIR, ALLOWED };
