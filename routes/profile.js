/**
 * Cemetery Mapping Information System - Profile Routes
 * Handles user profile management, updates, and account settings
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const { validateEmail, validatePassword } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// View profile
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, full_name, phone, address, role, is_approved, created_at, last_login FROM users WHERE id = $1',
      [req.session.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.redirect('/dashboard');
    }
    
    const user = result.rows[0];
    
    // Get user statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM graves WHERE created_by = $1) as total_graves,
        (SELECT COUNT(*) FROM grave_photos WHERE uploaded_by = $1) as total_photos,
        (SELECT COUNT(*) FROM messages WHERE sender_id = $1 OR receiver_id = $1) as total_messages,
        (SELECT COUNT(*) FROM cemeteries WHERE created_by = $1) as total_cemeteries
    `, [req.session.user.id]);
    
    res.render('profile', {
      title: 'My Profile',
      profile: user,
      stats: stats.rows[0],
      user: req.session.user,
      isAuthenticated: true,
      currentPath: req.path,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Profile view error:', error);
    res.redirect('/dashboard?error=Failed to load profile');
  }
});

// Update profile
router.post('/update', isAuthenticated, async (req, res) => {
  const { full_name, phone, address } = req.body;
  
  if (!full_name) {
    return res.redirect('/profile?error=Full name is required');
  }
  
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, address = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [full_name, phone || null, address || null, req.session.user.id]
    );
    
    // Update session
    req.session.user.full_name = full_name;
    
    res.redirect('/profile?success=Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    res.redirect('/profile?error=Failed to update profile');
  }
});

// Change password
router.post('/password', isAuthenticated, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  
  // Validation
  if (!current_password || !new_password || !confirm_password) {
    return res.redirect('/profile?error=All password fields are required');
  }
  
  if (new_password !== confirm_password) {
    return res.redirect('/profile?error=New passwords do not match');
  }
  
  if (!validatePassword(new_password)) {
    return res.redirect('/profile?error=Password must be at least 8 characters');
  }
  
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.session.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.redirect('/profile?error=User not found');
    }
    
    const validPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);
    
    if (!validPassword) {
      return res.redirect('/profile?error=Current password is incorrect');
    }
    
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.session.user.id]
    );
    
    res.redirect('/profile?success=Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    res.redirect('/profile?error=Failed to change password');
  }
});

// Upload profile photo
router.post('/photo', isAuthenticated, async (req, res) => {
  if (!req.files || !req.files.photo) {
    return res.redirect('/profile?error=No photo selected');
  }
  
  const photo = req.files.photo;
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(photo.mimetype)) {
    return res.redirect('/profile?error=Invalid file type. Please upload JPEG, PNG, GIF, or WEBP');
  }
  
  // Validate file size (max 5MB)
  if (photo.size > 5 * 1024 * 1024) {
    return res.redirect('/profile?error=File too large. Maximum size is 5MB');
  }
  
  try {
    const fileName = `profile_${uuidv4()}_${Date.now()}.jpg`;
    const uploadPath = path.join(__dirname, '../uploads/profiles', fileName);
    const thumbnailPath = path.join(__dirname, '../uploads/profiles/thumbnails', fileName);
    
    // Ensure directories exist
    const dirs = [path.dirname(uploadPath), path.dirname(thumbnailPath)];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Process and save image
    await sharp(photo.data)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(uploadPath);
    
    // Create thumbnail
    await sharp(photo.data)
      .resize(100, 100, { fit: 'cover' })
      .jpeg({ quality: 60 })
      .toFile(thumbnailPath);
    
    // Update database
    const pool = getPool();
    await pool.query(
      'UPDATE users SET profile_photo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [`/uploads/profiles/${fileName}`, req.session.user.id]
    );
    
    res.redirect('/profile?success=Profile photo updated successfully');
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.redirect('/profile?error=Failed to upload photo');
  }
});

// Delete profile photo
router.post('/photo/delete', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT profile_photo FROM users WHERE id = $1',
      [req.session.user.id]
    );
    
    if (result.rows.length > 0 && result.rows[0].profile_photo) {
      const photoPath = path.join(__dirname, '..', result.rows[0].profile_photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
      
      // Also delete thumbnail
      const thumbPath = photoPath.replace('/uploads/profiles/', '/uploads/profiles/thumbnails/');
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }
    
    await pool.query(
      'UPDATE users SET profile_photo = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.session.user.id]
    );
    
    res.redirect('/profile?success=Profile photo removed');
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.redirect('/profile?error=Failed to delete photo');
  }
});

// Delete account
router.post('/delete', isAuthenticated, async (req, res) => {
  const { confirm } = req.body;
  
  if (confirm !== 'DELETE') {
    return res.redirect('/profile?error=Please type DELETE to confirm account deletion');
  }
  
  try {
    const pool = getPool();
    
    // Delete user's uploaded files
    const photos = await pool.query(
      'SELECT photo_url FROM grave_photos WHERE uploaded_by = $1',
      [req.session.user.id]
    );
    
    for (const photo of photos.rows) {
      const photoPath = path.join(__dirname, '..', photo.photo_url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    // Soft delete user (set inactive instead of hard delete to preserve references)
    await pool.query(
      'UPDATE users SET is_active = false, email = CONCAT(email, \'_deleted_\', NOW()) WHERE id = $1',
      [req.session.user.id]
    );
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.redirect('/?message=Account deleted successfully');
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.redirect('/profile?error=Failed to delete account');
  }
});

// Get user activity log
router.get('/activity', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    
    const activities = await pool.query(`
      (SELECT 
        'grave_created' as type,
        created_at as timestamp,
        deceased_name as description
       FROM graves 
       WHERE created_by = $1)
      UNION ALL
      (SELECT 
        'photo_uploaded' as type,
        created_at as timestamp,
        'Uploaded photo' as description
       FROM grave_photos 
       WHERE uploaded_by = $1)
      UNION ALL
      (SELECT 
        'message_sent' as type,
        created_at as timestamp,
        subject as description
       FROM messages 
       WHERE sender_id = $1)
      UNION ALL
      (SELECT 
        'cemetery_created' as type,
        created_at as timestamp,
        name as description
       FROM cemeteries 
       WHERE created_by = $1)
      ORDER BY timestamp DESC
      LIMIT 50
    `, [req.session.user.id]);
    
    res.json({
      success: true,
      activities: activities.rows
    });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load activity log'
    });
  }
});

// Get user notifications (AJAX)
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.session.user.id]
    );
    
    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load notifications'
    });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.session.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.post('/notifications/read-all', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.session.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

module.exports = router;