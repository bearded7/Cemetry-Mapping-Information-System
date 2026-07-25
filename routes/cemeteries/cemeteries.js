'use strict';

const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const cemeteries = db
    .prepare(
      `SELECT c.id, c.name, c.description, c.address, c.center_lat, c.center_lng, c.default_zoom,
              (SELECT COUNT(*) FROM graves g WHERE g.cemetery_id = c.id AND g.status = 'approved') AS grave_count
       FROM cemeteries c
       ORDER BY c.name`
    )
    .all();
  res.json({ cemeteries });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid cemetery id.' });

  const cemetery = db.prepare('SELECT * FROM cemeteries WHERE id = ?').get(id);
  if (!cemetery) return res.status(404).json({ error: 'Cemetery not found.' });
  res.json({ cemetery });
});

module.exports = router;
