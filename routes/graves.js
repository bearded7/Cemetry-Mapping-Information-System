const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// View all graves
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT g.*, c.name as cemetery_name 
      FROM graves g 
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id 
      WHERE g.is_approved = true
      ORDER BY g.deceased_name
    `);
    
    res.render('graves/index', {
      title: 'Graves',
      graves: result.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error('Graves error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load graves',
      error: {}
    });
  }
});

// Add new grave form with GPS
router.get('/new', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const cemeteries = await pool.query(
      'SELECT id, name FROM cemeteries WHERE is_approved = true ORDER BY name'
    );
    
    res.render('graves/new', {
      title: 'Add New Grave',
      cemeteries: cemeteries.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error('New grave error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load cemetery list',
      error: {}
    });
  }
});

// Create grave with GPS and photos
router.post('/create', isAuthenticated, async (req, res) => {
  const {
    cemetery_id, section, block, plot_number,
    latitude, longitude,
    deceased_name, birth_date, death_date,
    gender, nationality, occupation, epitaph, grave_type
  } = req.body;

  if (!cemetery_id || !deceased_name || !latitude || !longitude) {
    return res.status(400).json({ error: 'Cemetery, deceased name, and GPS coordinates are required' });
  }

  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');

    // Calculate age
    let age_at_death = null;
    if (birth_date && death_date) {
      const birth = new Date(birth_date);
      const death = new Date(death_date);
      age_at_death = death.getFullYear() - birth.getFullYear();
      const monthDiff = death.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
        age_at_death--;
      }
    }

    // Insert grave with GPS
    const result = await client.query(
      `INSERT INTO graves (
        cemetery_id, section, block, plot_number,
        latitude, longitude, location,
        deceased_name, birth_date, death_date, age_at_death,
        gender, nationality, occupation, epitaph, grave_type,
        created_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326),
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16
      ) RETURNING id`,
      [
        cemetery_id, section, block, plot_number,
        parseFloat(latitude), parseFloat(longitude),
        deceased_name, birth_date || null, death_date || null, age_at_death,
        gender || null, nationality || null, occupation || null, epitaph || null, grave_type || null,
        req.session.user.id
      ]
    );

    const graveId = result.rows[0].id;

    // Handle photo uploads
    if (req.files && req.files.photos) {
      const photos = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];
      
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const fileName = `${uuidv4()}_${file.name}`;
        const uploadPath = path.join(__dirname, '../uploads/graves', fileName);
        const thumbnailPath = path.join(__dirname, '../uploads/graves/thumbnails', fileName);
        
        // Ensure directories exist
        const dirs = [path.dirname(uploadPath), path.dirname(thumbnailPath)];
        for (const dir of dirs) {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        }

        // Save original
        await file.mv(uploadPath);
        
        // Create thumbnail
        await sharp(uploadPath)
          .resize(200, 200, { fit: 'cover' })
          .toFile(thumbnailPath);

        // Save to database
        await client.query(
          `INSERT INTO grave_photos (grave_id, photo_url, thumbnail_url, caption, is_primary, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            graveId,
            `/uploads/graves/${fileName}`,
            `/uploads/graves/thumbnails/${fileName}`,
            `Photo ${i + 1}`,
            i === 0, // First photo is primary
            req.session.user.id
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Create notification for admin
    const adminResult = await client.query(
      'SELECT id FROM users WHERE role = $1',
      ['admin']
    );
    
    for (const admin of adminResult.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'grave_pending', 'New Grave Pending Approval', 
                 'A new grave record for ${deceased_name} needs your approval.', '/admin')`,
        [admin.id]
      );
    }

    res.redirect('/dashboard');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create grave error:', error);
    res.status(500).json({ error: 'Failed to create grave record' });
  } finally {
    client.release();
  }
});

// Get grave by ID (API)
router.get('/api/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT g.*, c.name as cemetery_name 
      FROM graves g 
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id 
      WHERE g.id = $1 AND g.is_approved = true
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grave not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch grave' });
  }
});

// Get grave photos
router.get('/:id/photos', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM grave_photos WHERE grave_id = $1 ORDER BY is_primary DESC, created_at',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Photos error:', error);
    res.status(500).json({ error: 'Failed to load photos' });
  }
});

module.exports = router;