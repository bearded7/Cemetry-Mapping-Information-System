/**
 * Cemetery Mapping Information System - Views Routes
 * Handles all page rendering and view logic
 */

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Home page
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries,
        (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves,
        (SELECT COUNT(*) FROM grave_photos) as total_photos,
        (SELECT COUNT(*) FROM grave_visits) as total_visits,
        (SELECT COUNT(*) FROM users WHERE is_approved = true) as total_users
    `);
    
    // Get recent graves for featured section
    const recentGraves = await pool.query(`
      SELECT g.*, c.name as cemetery_name,
             (SELECT photo_url FROM grave_photos WHERE grave_id = g.id AND is_primary = true LIMIT 1) as primary_photo
      FROM graves g
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id
      WHERE g.is_approved = true
      ORDER BY g.created_at DESC
      LIMIT 6
    `);
    
    res.render('index', {
      title: 'Cemetery Mapping Information System',
      description: 'Locate graves of loved ones easily within a cemetery',
      stats: stats.rows[0],
      recentGraves: recentGraves.rows,
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Home error:', error);
    res.render('index', {
      title: 'Cemetery Mapping Information System',
      description: 'Locate graves of loved ones easily within a cemetery',
      stats: { total_cemeteries: 0, total_graves: 0, total_photos: 0, total_visits: 0, total_users: 0 },
      recentGraves: [],
      user: null,
      isAuthenticated: false,
      currentPath: req.path
    });
  }
});

// Map page
router.get('/map', async (req, res) => {
  try {
    const pool = getPool();
    const cemeteriesResult = await pool.query(`
      SELECT id, name, description, latitude, longitude, image_url, address, city, state, country,
             total_graves, contact_phone, contact_email, opening_hours
      FROM cemeteries 
      WHERE is_approved = true AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY name
    `);
    
    const gravesResult = await pool.query(`
      SELECT g.*, c.name as cemetery_name,
             (SELECT photo_url FROM grave_photos WHERE grave_id = g.id AND is_primary = true LIMIT 1) as primary_photo,
             (SELECT COUNT(*) FROM grave_photos WHERE grave_id = g.id) as photo_count
      FROM graves g 
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id 
      WHERE g.is_approved = true AND g.latitude IS NOT NULL AND g.longitude IS NOT NULL
      ORDER BY g.deceased_name
    `);
    
    res.render('map', {
      title: 'Cemetery Map',
      cemeteries: cemeteriesResult.rows,
      graves: gravesResult.rows,
      mapboxToken: process.env.MAPBOX_TOKEN || '',
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Map error:', error);
    res.render('map', {
      title: 'Cemetery Map',
      cemeteries: [],
      graves: [],
      mapboxToken: '',
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  }
});

// Cemeteries list page
router.get('/cemeteries', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT c.*, u.full_name as created_by_name,
             (SELECT COUNT(*) FROM graves WHERE cemetery_id = c.id AND is_approved = true) as grave_count
      FROM cemeteries c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.is_approved = true
      ORDER BY c.name
    `);
    
    res.render('cemeteries/index', {
      title: 'Cemeteries',
      cemeteries: result.rows,
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Cemeteries error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load cemeteries',
      error: {},
      user: req.session.user || null,
      isAuthenticated: !!req.session.user
    });
  }
});

// Single cemetery view
router.get('/cemeteries/:id', async (req, res) => {
  try {
    const pool = getPool();
    const cemeteryResult = await pool.query(`
      SELECT c.*, u.full_name as created_by_name
      FROM cemeteries c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1 AND c.is_approved = true
    `, [req.params.id]);
    
    if (cemeteryResult.rows.length === 0) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Cemetery not found',
        error: {},
        user: req.session.user || null,
        isAuthenticated: !!req.session.user
      });
    }
    
    const cemetery = cemeteryResult.rows[0];
    
    // Get graves in this cemetery
    const gravesResult = await pool.query(`
      SELECT g.*, 
             (SELECT photo_url FROM grave_photos WHERE grave_id = g.id AND is_primary = true LIMIT 1) as primary_photo
      FROM graves g
      WHERE g.cemetery_id = $1 AND g.is_approved = true
      ORDER BY g.deceased_name
    `, [req.params.id]);
    
    res.render('cemeteries/view', {
      title: cemetery.name,
      cemetery: cemetery,
      graves: gravesResult.rows,
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Cemetery view error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load cemetery',
      error: {},
      user: req.session.user || null,
      isAuthenticated: !!req.session.user
    });
  }
});

// Add new cemetery form
router.get('/cemeteries/new', isAuthenticated, async (req, res) => {
  res.render('cemeteries/new', {
    title: 'Add New Cemetery',
    user: req.session.user,
    isAuthenticated: true,
    currentPath: req.path,
    error: null,
    formData: {}
  });
});

// Create cemetery
router.post('/cemeteries/create', isAuthenticated, async (req, res) => {
  const {
    name, description, address, city, state, country,
    latitude, longitude, established_year,
    contact_phone, contact_email, website_url, opening_hours
  } = req.body;
  
  if (!name || !address) {
    return res.render('cemeteries/new', {
      title: 'Add New Cemetery',
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path,
      error: 'Name and address are required',
      formData: req.body
    });
  }
  
  try {
    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO cemeteries (
        name, description, address, city, state, country,
        latitude, longitude, established_year,
        contact_phone, contact_email, website_url, opening_hours,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `, [
      name, description, address, city, state, country,
      latitude || null, longitude || null, established_year || null,
      contact_phone || null, contact_email || null, website_url || null, opening_hours || null,
      req.session.user.id
    ]);
    
    // Notify admins
    const admins = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
    for (const admin of admins.rows) {
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES ($1, 'cemetery_pending', 'New Cemetery Pending Approval',
                'A new cemetery "${name}" needs your approval.', '/admin')
      `, [admin.id]);
    }
    
    res.redirect('/cemeteries');
  } catch (error) {
    console.error('Create cemetery error:', error);
    res.render('cemeteries/new', {
      title: 'Add New Cemetery',
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path,
      error: 'Failed to create cemetery. Please try again.',
      formData: req.body
    });
  }
});

// Graves list page
router.get('/graves', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT g.*, c.name as cemetery_name,
             (SELECT photo_url FROM grave_photos WHERE grave_id = g.id AND is_primary = true LIMIT 1) as primary_photo
      FROM graves g
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id
      WHERE g.is_approved = true
      ORDER BY g.deceased_name
    `);
    
    res.render('graves/index', {
      title: 'Graves',
      graves: result.rows,
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Graves error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load graves',
      error: {},
      user: req.session.user || null,
      isAuthenticated: !!req.session.user
    });
  }
});

// Single grave view
router.get('/graves/:id', async (req, res) => {
  try {
    const pool = getPool();
    const graveResult = await pool.query(`
      SELECT g.*, c.name as cemetery_name, c.id as cemetery_id,
             u.full_name as created_by_name
      FROM graves g
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = $1 AND g.is_approved = true
    `, [req.params.id]);
    
    if (graveResult.rows.length === 0) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Grave not found',
        error: {},
        user: req.session.user || null,
        isAuthenticated: !!req.session.user
      });
    }
    
    const grave = graveResult.rows[0];
    
    // Get photos
    const photos = await pool.query(`
      SELECT * FROM grave_photos
      WHERE grave_id = $1
      ORDER BY is_primary DESC, created_at
    `, [req.params.id]);
    
    // Get visits
    const visits = await pool.query(`
      SELECT * FROM grave_visits
      WHERE grave_id = $1
      ORDER BY visit_date DESC
      LIMIT 20
    `, [req.params.id]);
    
    res.render('graves/view', {
      title: grave.deceased_name,
      grave: grave,
      photos: photos.rows,
      visits: visits.rows,
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Grave view error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load grave details',
      error: {},
      user: req.session.user || null,
      isAuthenticated: !!req.session.user
    });
  }
});

// Add new grave form
router.get('/graves/new', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const cemeteries = await pool.query(`
      SELECT id, name FROM cemeteries
      WHERE is_approved = true
      ORDER BY name
    `);
    
    res.render('graves/new', {
      title: 'Add New Grave',
      cemeteries: cemeteries.rows,
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path,
      error: null,
      formData: {}
    });
  } catch (error) {
    console.error('New grave error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load cemetery list',
      error: {},
      user: req.session.user,
      isAuthenticated: true
    });
  }
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    
    // Get user's messages
    const messages = await pool.query(`
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = $1
      ORDER BY m.created_at DESC
      LIMIT 10
    `, [req.session.user.id]);
    
    // Get user's graves
    const userGraves = await pool.query(`
      SELECT g.*, c.name as cemetery_name,
             (SELECT photo_url FROM grave_photos WHERE grave_id = g.id AND is_primary = true LIMIT 1) as primary_photo
      FROM graves g
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id
      WHERE g.created_by = $1
      ORDER BY g.created_at DESC
    `, [req.session.user.id]);
    
    // Get stats
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM cemeteries WHERE is_approved = true) as total_cemeteries,
        (SELECT COUNT(*) FROM graves WHERE is_approved = true) as total_graves,
        (SELECT COUNT(*) FROM grave_photos WHERE grave_id IN (SELECT id FROM graves WHERE created_by = $1)) as my_photos,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false) as unread_messages,
        (SELECT COUNT(*) FROM graves WHERE created_by = $1 AND is_approved = false) as pending_graves
    `, [req.session.user.id]);
    
    // Get pending approvals if admin
    let pendingUsers = [];
    let pendingGraves = [];
    let pendingCemeteries = [];
    
    if (req.session.user.role === 'admin') {
      const usersResult = await pool.query(`
        SELECT * FROM users
        WHERE is_approved = false AND is_active = true
        ORDER BY created_at
      `);
      pendingUsers = usersResult.rows;
      
      const gravesResult = await pool.query(`
        SELECT g.*, u.full_name as created_by_name, c.name as cemetery_name
        FROM graves g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN cemeteries c ON g.cemetery_id = c.id
        WHERE g.is_approved = false
        ORDER BY g.created_at
      `);
      pendingGraves = gravesResult.rows;
      
      const cemeteriesResult = await pool.query(`
        SELECT c.*, u.full_name as created_by_name
        FROM cemeteries c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.is_approved = false
        ORDER BY c.created_at
      `);
      pendingCemeteries = cemeteriesResult.rows;
    }
    
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path,
      messages: messages.rows,
      userGraves: userGraves.rows,
      stats: stats.rows[0],
      pendingUsers: pendingUsers,
      pendingGraves: pendingGraves,
      pendingCemeteries: pendingCemeteries,
      isAdmin: req.session.user.role === 'admin'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path,
      messages: [],
      userGraves: [],
      stats: { total_cemeteries: 0, total_graves: 0, my_photos: 0, unread_messages: 0, pending_graves: 0 },
      pendingUsers: [],
      pendingGraves: [],
      pendingCemeteries: [],
      isAdmin: false
    });
  }
});

// Search page
router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  
  if (!query || query.length < 2) {
    return res.redirect('/');
  }
  
  try {
    const pool = getPool();
    const graves = await pool.query(`
      SELECT g.*, c.name as cemetery_name,
             (SELECT photo_url FROM grave_photos WHERE grave_id = g.id AND is_primary = true LIMIT 1) as primary_photo
      FROM graves g
      LEFT JOIN cemeteries c ON g.cemetery_id = c.id
      WHERE g.is_approved = true AND g.deceased_name ILIKE $1
      ORDER BY g.deceased_name
      LIMIT 50
    `, [`%${query}%`]);
    
    const cemeteries = await pool.query(`
      SELECT * FROM cemeteries
      WHERE is_approved = true AND (
        name ILIKE $1 OR 
        city ILIKE $1 OR 
        state ILIKE $1
      )
      ORDER BY name
      LIMIT 20
    `, [`%${query}%`]);
    
    res.render('search', {
      title: 'Search Results',
      query: query,
      graves: graves.rows,
      cemeteries: cemeteries.rows,
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Search error:', error);
    res.render('search', {
      title: 'Search Results',
      query: query,
      graves: [],
      cemeteries: [],
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  }
});

// About page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About',
    user: req.session.user || null,
    isAuthenticated: !!req.session.user,
    currentPath: req.path
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact',
    user: req.session.user || null,
    isAuthenticated: !!req.session.user,
    currentPath: req.path
  });
});

// Submit contact form
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.render('contact', {
      title: 'Contact',
      error: 'All fields are required',
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  }
  
  try {
    const pool = getPool();
    
    // Send message to all admins
    const admins = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
    for (const admin of admins.rows) {
      await pool.query(`
        INSERT INTO messages (sender_id, receiver_id, subject, message)
        VALUES (NULL, $1, $2, $3)
      `, [admin.id, `Contact Form: ${name}`, `From: ${name} (${email})\n\n${message}`]);
    }
    
    res.render('contact', {
      title: 'Contact',
      success: 'Your message has been sent. We\'ll get back to you soon!',
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.render('contact', {
      title: 'Contact',
      error: 'Failed to send message. Please try again.',
      user: req.session.user || null,
      isAuthenticated: !!req.session.user,
      currentPath: req.path
    });
  }
});

// Notifications
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    
    // Get all notifications
    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.session.user.id]);
    
    // Mark all as read
    await pool.query(`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `, [req.session.user.id]);
    
    res.render('notifications', {
      title: 'Notifications',
      notifications: result.rows,
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load notifications',
      error: {},
      user: req.session.user,
      isAuthenticated: true
    });
  }
});

// Profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.session.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.redirect('/dashboard');
    }
    
    res.render('profile', {
      title: 'My Profile',
      profile: result.rows[0],
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load profile',
      error: {},
      user: req.session.user,
      isAuthenticated: true
    });
  }
});

// Update profile
router.post('/profile/update', isAuthenticated, async (req, res) => {
  const { full_name, phone, address } = req.body;
  
  try {
    const pool = getPool();
    await pool.query(`
      UPDATE users
      SET full_name = $1, phone = $2, address = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [full_name, phone || null, address || null, req.session.user.id]);
    
    // Update session
    req.session.user.full_name = full_name;
    
    res.redirect('/profile?success=Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    res.redirect('/profile?error=Failed to update profile');
  }
});

// Error pages
router.get('/error', (req, res) => {
  res.render('error', {
    title: 'Error',
    message: req.query.message || 'An error occurred',
    error: {},
    user: req.session.user || null,
    isAuthenticated: !!req.session.user
  });
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