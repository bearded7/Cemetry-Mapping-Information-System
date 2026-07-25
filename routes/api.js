const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// Get all cemeteries
router.get('/cemeteries', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM cemeteries ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch cemeteries' });
  }
});

// Get cemetery by ID
router.get('/cemeteries/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM cemeteries WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cemetery not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch cemetery' });
  }
});

// Get graves for cemetery
router.get('/cemeteries/:id/graves', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM graves WHERE cemetery_id = $1 ORDER BY deceased_name',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch graves' });
  }
});

// Get all graves
router.get('/graves', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT g.*, c.name as cemetery_name 
       FROM graves g 
       LEFT JOIN cemeteries c ON g.cemetery_id = c.id 
       ORDER BY g.deceased_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch graves' });
  }
});

// Get grave by ID
router.get('/graves/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT g.*, c.name as cemetery_name 
       FROM graves g 
       LEFT JOIN cemeteries c ON g.cemetery_id = c.id 
       WHERE g.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grave not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch grave' });
  }
});

// Search graves
router.get('/graves/search', async (req, res) => {
  try {
    const { name, cemeteryId } = req.query;
    const pool = getPool();
    let query = `
      SELECT g.*, c.name as cemetery_name 
      FROM graves g 
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (name) {
      query += ` AND g.deceased_name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }

    if (cemeteryId) {
      query += ` AND g.cemetery_id = $${paramIndex}`;
      params.push(cemeteryId);
      paramIndex++;
    }

    query += ' ORDER BY g.deceased_name LIMIT 100';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to search graves' });
  }
});

// Get stats
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cemeteries) as total_cemeteries,
        (SELECT COUNT(*) FROM graves) as total_graves,
        (SELECT COUNT(*) FROM grave_photos) as total_photos,
        (SELECT COUNT(*) FROM visits) as total_visits,
        (SELECT COUNT(*) FROM users) as total_users
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;