const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

router.get('/cemeteries', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM cemeteries WHERE is_approved = true ORDER BY name');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch cemeteries' });
  }
});

router.get('/graves', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.is_approved = true');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch graves' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries, (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves');
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = router;
