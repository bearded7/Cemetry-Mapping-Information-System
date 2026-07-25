const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries,
        (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves,
        (SELECT COUNT(*) FROM grave_photos) as total_photos,
        (SELECT COUNT(*) FROM grave_visits) as total_visits
    `);
    res.render('index', { title: 'Cemetery Mapping System', stats: stats.rows[0] });
  } catch {
    res.render('index', { title: 'Cemetery Mapping System', stats: { total_cemeteries: 0, total_graves: 0, total_photos: 0, total_visits: 0 } });
  }
});

router.get('/map', async (req, res) => {
  try {
    const pool = getPool();
    const cemeteries = await pool.query('SELECT id, name, latitude, longitude FROM cemeteries WHERE is_approved = true');
    const graves = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.is_approved = true');
    res.render('map', { title: 'Cemetery Map', cemeteries: cemeteries.rows, graves: graves.rows });
  } catch {
    res.render('map', { title: 'Cemetery Map', cemeteries: [], graves: [] });
  }
});

router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('dashboard', { title: 'Dashboard', user: req.session.user });
});

router.get('/cemeteries', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM cemeteries WHERE is_approved = true ORDER BY name');
    res.render('cemeteries/index', { title: 'Cemeteries', cemeteries: result.rows });
  } catch {
    res.render('cemeteries/index', { title: 'Cemeteries', cemeteries: [] });
  }
});

router.get('/cemeteries/:id', async (req, res) => {
  try {
    const pool = getPool();
    const cemetery = await pool.query('SELECT * FROM cemeteries WHERE id = $1 AND is_approved = true', [req.params.id]);
    if (cemetery.rows.length === 0) throw new Error('Not found');
    const graves = await pool.query('SELECT * FROM graves WHERE cemetery_id = $1 AND is_approved = true', [req.params.id]);
    res.render('cemeteries/view', { title: cemetery.rows[0].name, cemetery: cemetery.rows[0], graves: graves.rows });
  } catch {
    res.status(404).render('error', { title: 'Not Found', message: 'Cemetery not found', error: {} });
  }
});

router.get('/graves', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.is_approved = true ORDER BY g.deceased_name');
    res.render('graves/index', { title: 'Graves', graves: result.rows });
  } catch {
    res.render('graves/index', { title: 'Graves', graves: [] });
  }
});

router.get('/graves/:id', async (req, res) => {
  try {
    const pool = getPool();
    const grave = await pool.query('SELECT g.*, c.name as cemetery_name FROM graves g LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.id = $1 AND g.is_approved = true', [req.params.id]);
    if (grave.rows.length === 0) throw new Error('Not found');
    const photos = await pool.query('SELECT * FROM grave_photos WHERE grave_id = $1', [req.params.id]);
    res.render('graves/view', { title: grave.rows[0].deceased_name, grave: grave.rows[0], photos: photos.rows });
  } catch {
    res.status(404).render('error', { title: 'Not Found', message: 'Grave not found', error: {} });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

module.exports = router;
