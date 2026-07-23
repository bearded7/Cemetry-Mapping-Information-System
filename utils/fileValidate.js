'use strict';

const fs = require('fs');

// Confirms uploaded attachments really are what their extension claims,
// by checking magic bytes rather than trusting the browser-supplied
// Content-Type header.
function readHead(filePath, len = 8) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, 0);
  fs.closeSync(fd);
  return buf;
}

function isGenuineFile(filePath, mimeType) {
  const buf = readHead(filePath, 8);

  switch (mimeType) {
    case 'image/jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return buf.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/gif':
      return buf.slice(0, 6).toString('ascii') === 'GIF87a' || buf.slice(0, 6).toString('ascii') === 'GIF89a';
    case 'image/webp': {
      const head12 = readHead(filePath, 12);
      return head12.slice(0, 4).toString('ascii') === 'RIFF' && head12.slice(8, 12).toString('ascii') === 'WEBP';
    }
    case 'application/pdf':
      return buf.slice(0, 4).toString('ascii') === '%PDF';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return buf[0] === 0x50 && buf[1] === 0x4b; // docx is a zip archive (PK..)
    case 'application/msword':
      return buf.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    case 'text/plain':
      return true; // no reliable signature; size + extension checks already applied upstream
    default:
      return false;
  }
}

function rejectInvalidFiles(files) {
  const rejected = [];
  for (const f of files) {
    if (!isGenuineFile(f.path, f.mimetype)) {
      try { fs.unlinkSync(f.path); } catch (_) { /* already gone */ }
      rejected.push(f);
    }
  }
  return rejected;
}

module.exports = { isGenuineFile, rejectInvalidFiles };
