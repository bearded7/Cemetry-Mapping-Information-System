const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pool = getPool();
    
    // Get pending approvals
    const pendingUsers = await pool.query(
      'SELECT * FROM users WHERE is_approved = false AND is_active = true ORDER BY created_at'
    );
    
    const pendingCemeteries = await pool.query(
      'SELECT c.*, u.full_name as created_by_name FROM cemeteries c LEFT JOIN users u ON c.created_by = u.id WHERE c.is_approved = false ORDER BY c.created_at'
    );
    
    const pendingGraves = await pool.query(
      'SELECT g.*, u.full_name as created_by_name, c.name as cemetery_name FROM graves g LEFT JOIN users u ON g.created_by = u.id LEFT JOIN cemeteries c ON g.cemetery_id = c.id WHERE g.is_approved = false ORDER BY g.created_at'
    );

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      pendingUsers: pendingUsers.rows,
      pendingCemeteries: pendingCemeteries.rows,
      pendingGraves: pendingGraves.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load admin dashboard',
      error: {}
    });
  }
});

// Approve user
router.post('/users/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      'UPDATE users SET is_approved = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
      [req.session.user.id, req.params.id]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'account_approved', 'Account Approved', 'Your account has been approved. You can now access all features.', '/dashboard')`,
      [req.params.id]
    );

    res.redirect('/admin');
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user
router.post('/users/:id/reject', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      'DELETE FROM users WHERE id = $1',
      [req.params.id]
    );
    res.redirect('/admin');
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Approve cemetery
router.post('/cemeteries/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      'UPDATE cemeteries SET is_approved = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
      [req.session.user.id, req.params.id]
    );
    res.redirect('/admin');
  } catch (error) {
    console.error('Approve cemetery error:', error);
    res.status(500).json({ error: 'Failed to approve cemetery' });
  }
});

// Reject cemetery
router.post('/cemeteries/:id/reject', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM cemeteries WHERE id = $1', [req.params.id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Reject cemetery error:', error);
    res.status(500).json({ error: 'Failed to reject cemetery' });
  }
});

// Approve grave
router.post('/graves/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      'UPDATE graves SET is_approved = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
      [req.session.user.id, req.params.id]
    );

    // Get cemetery to update count
    const grave = await pool.query(
      'SELECT cemetery_id FROM graves WHERE id = $1',
      [req.params.id]
    );
    
    if (grave.rows.length > 0 && grave.rows[0].cemetery_id) {
      await pool.query(
        'UPDATE cemeteries SET total_graves = total_graves + 1 WHERE id = $1',
        [grave.rows[0].cemetery_id]
      );
    }

    res.redirect('/admin');
  } catch (error) {
    console.error('Approve grave error:', error);
    res.status(500).json({ error: 'Failed to approve grave' });
  }
});

// Reject grave
router.post('/graves/:id/reject', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM graves WHERE id = $1', [req.params.id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Reject grave error:', error);
    res.status(500).json({ error: 'Failed to reject grave' });
  }
});

module.exports = router;