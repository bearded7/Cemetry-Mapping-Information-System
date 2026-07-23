'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, query, param, validationResult } = require('express-validator');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiters');
const { upload } = require('../middleware/upload');
const { rejectFakeImages } = require('../utils/imageValidate');
const { logAction } = require('../utils/audit');

const router = express.Router();

const GENDERS = ['female', 'male', 'other', 'unspecified'];
const MEMORIAL_TYPES = ['grave', 'mausoleum', 'columbarium', 'cremation_niche', 'memorial_bench'];

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return true;
  }
  return false;
}

function photosForGrave(graveId) {
  return db
    .prepare('SELECT id, file_path, caption FROM grave_photos WHERE grave_id = ? ORDER BY id')
    .all(graveId)
    .map((p) => ({ id: p.id, url: `/uploads/graves/${path.basename(p.file_path)}`, caption: p.caption }));
}

function slugify(firstName, lastName, id) {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}-${id}`;
}

// ---------------------------------------------------------------------
// GET /api/graves
// Public map data feed. Supports an optional bounding box so the map
// only ever requests markers currently in view, instead of pulling
// every grave in the database on every pan/zoom.
// ---------------------------------------------------------------------
router.get(
  '/',
  [
    query('cemeteryId').optional().isInt().toInt(),
    query('minLat').optional().isFloat().toFloat(),
    query('maxLat').optional().isFloat().toFloat(),
    query('minLng').optional().isFloat().toFloat(),
    query('maxLng').optional().isFloat().toFloat(),
    query('limit').optional().isInt({ min: 1, max: 2000 }).toInt(),
  ],
  (req, res) => {
    if (handleValidation(req, res)) return;

    const { cemeteryId, minLat, maxLat, minLng, maxLng } = req.query;
    const limit = req.query.limit || 1000;

    const clauses = ["status = 'approved'", 'deleted_at IS NULL'];
    const params = [];

    if (cemeteryId) {
      clauses.push('cemetery_id = ?');
      params.push(cemeteryId);
    }
    if ([minLat, maxLat, minLng, maxLng].every((v) => v !== undefined)) {
      clauses.push('latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?');
      params.push(minLat, maxLat, minLng, maxLng);
    }

    const rows = db
      .prepare(
        `SELECT id, cemetery_id, first_name, last_name, date_of_birth, date_of_death,
                plot_reference, memorial_type, latitude, longitude
         FROM graves
         WHERE ${clauses.join(' AND ')}
         LIMIT ?`
      )
      .all(...params, limit);

    res.json({ graves: rows });
  }
);

// ---------------------------------------------------------------------
// GET /api/graves/search?q=...
// Full text search across approved graves, using the FTS5 index so it
// stays fast regardless of table size.
// ---------------------------------------------------------------------
router.get(
  '/search',
  [
    query('q').trim().isLength({ min: 1, max: 100 }).withMessage('Enter a name to search for.'),
    query('page').optional().isInt({ min: 1 }).toInt(),
  ],
  (req, res) => {
    if (handleValidation(req, res)) return;

    const page = req.query.page || 1;
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    // Sanitize the FTS query: strip characters with special meaning in
    // FTS5 query syntax and wrap each term as a prefix match.
    const terms = req.query.q
      .replace(/["*^]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => `"${t}"*`);

    if (terms.length === 0) return res.json({ graves: [], page, hasMore: false });

    const ftsQuery = terms.join(' AND ');

    let rows;
    try {
      rows = db
        .prepare(
          `SELECT g.id, g.cemetery_id, g.first_name, g.last_name, g.date_of_birth, g.date_of_death,
                  g.plot_reference, g.memorial_type, g.latitude, g.longitude
           FROM graves_fts f
           JOIN graves g ON g.id = f.rowid
           WHERE graves_fts MATCH ? AND g.status = 'approved' AND g.deleted_at IS NULL
           ORDER BY rank
           LIMIT ? OFFSET ?`
        )
        .all(ftsQuery, pageSize + 1, offset);
    } catch (err) {
      // Malformed FTS syntax somehow slipped through - fail safe with no results.
      return res.json({ graves: [], page, hasMore: false });
    }

    const hasMore = rows.length > pageSize;
    res.json({ graves: rows.slice(0, pageSize), page, hasMore });
  }
);

// ---------------------------------------------------------------------
// GET /api/graves/mine
// The current user's own submissions, whatever their status.
// ---------------------------------------------------------------------
router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, first_name, last_name, status, rejection_reason, created_at, cemetery_id
       FROM graves WHERE submitted_by = ? AND deleted_at IS NULL ORDER BY created_at DESC`
    )
    .all(req.user.id);
  res.json({ graves: rows });
});

// ---------------------------------------------------------------------
// GET /api/graves/:id
// ---------------------------------------------------------------------
router.get('/:id', [param('id').isInt().toInt()], (req, res) => {
  if (handleValidation(req, res)) return;

  const grave = db.prepare('SELECT * FROM graves WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!grave) return res.status(404).json({ error: 'Grave record not found.' });

  const isOwner = req.user && grave.submitted_by === req.user.id;
  const isAdmin = req.user && req.user.role === 'admin';

  if (grave.status !== 'approved' && !isOwner && !isAdmin) {
    return res.status(404).json({ error: 'Grave record not found.' });
  }

  if (grave.status === 'approved') {
    db.prepare('UPDATE graves SET view_count = view_count + 1 WHERE id = ?').run(grave.id);
  }

  res.json({ grave: { ...grave, photos: photosForGrave(grave.id) } });
});

// ---------------------------------------------------------------------
// POST /api/graves
// Logged-in users submit a new grave marker. It is stored as "pending"
// and is invisible to the public map/search until an admin approves it.
// ---------------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  submissionLimiter,
  upload.array('photos', 5),
  [
    body('cemeteryId').isInt().withMessage('Choose a cemetery.').toInt(),
    body('firstName').trim().isLength({ min: 1, max: 80 }).withMessage('First name is required.'),
    body('lastName').trim().isLength({ min: 1, max: 80 }).withMessage('Last name is required.'),
    body('middleName').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body('maidenName').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body('gender').optional({ checkFalsy: true }).isIn(GENDERS).withMessage('Invalid gender value.'),
    body('memorialType').optional({ checkFalsy: true }).isIn(MEMORIAL_TYPES).withMessage('Invalid memorial type.'),
    body('dateOfBirth').optional({ checkFalsy: true }).isISO8601().withMessage('Birth date must be a valid date.'),
    body('dateOfDeath').optional({ checkFalsy: true }).isISO8601().withMessage('Death date must be a valid date.'),
    body('burialDate').optional({ checkFalsy: true }).isISO8601().withMessage('Burial date must be a valid date.'),
    body('epitaph').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
    body('biography').optional({ checkFalsy: true }).trim().isLength({ max: 4000 }),
    body('plotReference').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    body('plotSection').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body('plotRow').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body('plotNumber').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body('isVeteran').optional().isBoolean().toBoolean(),
    body('submitterNote').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('A valid GPS latitude is required.').toFloat(),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('A valid GPS longitude is required.').toFloat(),
    body('gpsAccuracy').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  ],
  (req, res) => {
    if (handleValidation(req, res)) {
      // Clean up any uploaded files if validation failed after upload.
      (req.files || []).forEach((f) => fs.unlink(f.path, () => {}));
      return;
    }

    // Verify every uploaded file is a genuine image, not just a
    // relabeled script or executable.
    const filePaths = (req.files || []).map((f) => f.path);
    const rejected = rejectFakeImages(filePaths);
    if (rejected.length > 0) {
      (req.files || [])
        .filter((f) => !rejected.includes(f.path))
        .forEach((f) => fs.unlink(f.path, () => {}));
      return res.status(400).json({ error: 'One or more uploaded files were not valid images.' });
    }

    const cemetery = db.prepare('SELECT id FROM cemeteries WHERE id = ?').get(req.body.cemeteryId);
    if (!cemetery) {
      (req.files || []).forEach((f) => fs.unlink(f.path, () => {}));
      return res.status(400).json({ error: 'Selected cemetery does not exist.' });
    }

    const {
      cemeteryId, firstName, lastName, middleName, maidenName, gender, memorialType,
      dateOfBirth, dateOfDeath, burialDate, epitaph, biography, plotReference,
      plotSection, plotRow, plotNumber, isVeteran, submitterNote,
      latitude, longitude, gpsAccuracy,
    } = req.body;

    const insertGrave = db.prepare(`
      INSERT INTO graves (
        cemetery_id, submitted_by, first_name, last_name, middle_name, maiden_name, gender,
        memorial_type, date_of_birth, date_of_death, burial_date, epitaph, biography,
        plot_reference, plot_section, plot_row, plot_number, is_veteran, submitter_note,
        latitude, longitude, gps_accuracy_m, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const insertPhoto = db.prepare(
      'INSERT INTO grave_photos (grave_id, file_path, original_name) VALUES (?, ?, ?)'
    );

    let graveId;
    db.exec('BEGIN');
    try {
      const result = insertGrave.run(
        cemeteryId, req.user.id, firstName, lastName, middleName || null, maidenName || null,
        gender || 'unspecified', memorialType || 'grave',
        dateOfBirth || null, dateOfDeath || null, burialDate || null, epitaph || null, biography || null,
        plotReference || null, plotSection || null, plotRow || null, plotNumber || null,
        isVeteran ? 1 : 0, submitterNote || null,
        latitude, longitude, gpsAccuracy || null
      );
      graveId = Number(result.lastInsertRowid);
      db.prepare('UPDATE graves SET slug = ? WHERE id = ?').run(slugify(firstName, lastName, graveId), graveId);

      for (const file of req.files || []) {
        insertPhoto.run(graveId, path.relative(path.join(__dirname, '..', 'uploads'), file.path), file.originalname.slice(0, 200));
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      (req.files || []).forEach((f) => fs.unlink(f.path, () => {}));
      console.error(err);
      return res.status(500).json({ error: 'Could not save the submission. Please try again.' });
    }

    logAction(req.user.id, 'submit', 'grave', graveId, { firstName, lastName });

    res.status(201).json({
      message: 'Thanks — your submission has been sent for admin review and will appear on the map once approved.',
      graveId,
    });
  }
);

// ---------------------------------------------------------------------
// DELETE /api/graves/:id
// A submitter may withdraw their own PENDING submission (hard delete —
// nothing was ever published). An admin removing an already-approved
// record gets a soft delete instead, so the record can be audited or
// restored later rather than disappearing without a trace.
// ---------------------------------------------------------------------
router.delete('/:id', requireAuth, [param('id').isInt().toInt()], (req, res) => {
  if (handleValidation(req, res)) return;

  const grave = db.prepare('SELECT * FROM graves WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!grave) return res.status(404).json({ error: 'Grave record not found.' });

  const isOwner = grave.submitted_by === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'You cannot delete this record.' });
  if (grave.status === 'approved' && !isAdmin) {
    return res.status(403).json({ error: 'Approved records can only be removed by an admin.' });
  }

  if (grave.status === 'pending' || grave.status === 'rejected') {
    const photos = photosForGrave(grave.id);
    db.prepare('DELETE FROM graves WHERE id = ?').run(grave.id);
    photos.forEach((p) => {
      const filePath = path.join(__dirname, '..', 'uploads', 'graves', path.basename(p.url));
      fs.unlink(filePath, () => {});
    });
  } else {
    db.prepare("UPDATE graves SET deleted_at = datetime('now') WHERE id = ?").run(grave.id);
  }

  logAction(req.user.id, 'delete', 'grave', grave.id);
  res.json({ ok: true });
});

module.exports = router;
