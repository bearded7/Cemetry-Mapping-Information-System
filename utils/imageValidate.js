'use strict';

const fs = require('fs');

// Multer's fileFilter only trusts the Content-Type header and filename
// extension, both of which an attacker fully controls. Before we ever
// treat an uploaded file as "safe", we sniff the first bytes on disk
// and confirm they match a real JPEG/PNG/WEBP signature.
function isGenuineImage(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  // WEBP: "RIFF" .... "WEBP"
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return true;

  return false;
}

function rejectFakeImages(filePaths) {
  const rejected = [];
  for (const p of filePaths) {
    if (!isGenuineImage(p)) {
      try { fs.unlinkSync(p); } catch (_) { /* already gone */ }
      rejected.push(p);
    }
  }
  return rejected;
}

module.exports = { isGenuineImage, rejectFakeImages };
