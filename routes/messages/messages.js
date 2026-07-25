const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Message inbox
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT m.*, 
             u_sender.full_name as sender_name,
             u_receiver.full_name as receiver_name,
             (SELECT COUNT(*) FROM message_attachments WHERE message_id = m.id) as attachment_count
      FROM messages m
      LEFT JOIN users u_sender ON m.sender_id = u_sender.id
      LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
      WHERE m.receiver_id = $1 OR m.sender_id = $1
      ORDER BY m.created_at DESC
    `, [req.session.user.id]);

    // Mark messages as read
    await pool.query(
      'UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE receiver_id = $1 AND is_read = false',
      [req.session.user.id]
    );

    res.render('messages/inbox', {
      title: 'Messages',
      messages: result.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error('Messages error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load messages',
      error: {}
    });
  }
});

// New message form
router.get('/new', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const users = await pool.query(
      'SELECT id, full_name, email FROM users WHERE id != $1 AND is_approved = true ORDER BY full_name',
      [req.session.user.id]
    );

    res.render('messages/new', {
      title: 'New Message',
      users: users.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error('New message error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load users',
      error: {}
    });
  }
});

// Send message
router.post('/send', isAuthenticated, async (req, res) => {
  const { receiver_id, subject, message } = req.body;
  
  if (!receiver_id || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');

    // Insert message
    const result = await client.query(
      `INSERT INTO messages (sender_id, receiver_id, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.session.user.id, receiver_id, subject, message]
    );

    const messageId = result.rows[0].id;

    // Handle attachments
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      
      for (const file of files) {
        const fileName = `${uuidv4()}_${file.name}`;
        const uploadPath = path.join(__dirname, '../uploads/messages', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        await file.mv(uploadPath);

        await client.query(
          `INSERT INTO message_attachments (message_id, file_name, file_path, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [messageId, file.name, `/uploads/messages/${fileName}`, file.size, file.mimetype]
        );
      }
    }

    // Create notification
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'message', $2, $3, '/messages')`,
      [receiver_id, 'New Message', `You have a new message from ${req.session.user.full_name}`]
    );

    await client.query('COMMIT');

    // Emit socket event
    const io = req.app.get('io');
    io.to(`user_${receiver_id}`).emit('new_message', {
      id: messageId,
      sender_name: req.session.user.full_name,
      subject: subject,
      created_at: new Date().toISOString()
    });

    res.redirect('/messages');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    client.release();
  }
});

// View message
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT m.*, 
             u_sender.full_name as sender_name,
             u_sender.email as sender_email,
             u_receiver.full_name as receiver_name,
             u_receiver.email as receiver_email
      FROM messages m
      LEFT JOIN users u_sender ON m.sender_id = u_sender.id
      LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
      WHERE m.id = $1 AND (m.sender_id = $2 OR m.receiver_id = $2)
    `, [req.params.id, req.session.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Message not found',
        error: {}
      });
    }

    const message = result.rows[0];

    // Get attachments
    const attachments = await pool.query(
      'SELECT * FROM message_attachments WHERE message_id = $1',
      [req.params.id]
    );

    // Mark as read if receiver
    if (message.receiver_id === req.session.user.id && !message.is_read) {
      await pool.query(
        'UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1',
        [req.params.id]
      );
    }

    res.render('messages/view', {
      title: 'View Message',
      message: message,
      attachments: attachments.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error('View message error:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load message',
      error: {}
    });
  }
});

// Reply to message
router.post('/:id/reply', isAuthenticated, async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const pool = getPool();
    
    // Get original message
    const original = await pool.query(
      'SELECT sender_id, receiver_id, subject FROM messages WHERE id = $1',
      [req.params.id]
    );

    if (original.rows.length === 0) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const orig = original.rows[0];
    const receiverId = orig.sender_id === req.session.user.id ? orig.receiver_id : orig.sender_id;

    // Insert reply
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, subject, message, parent_message_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.user.id, receiverId, `Re: ${orig.subject}`, message, req.params.id]
    );

    res.redirect('/messages');
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

module.exports = router;