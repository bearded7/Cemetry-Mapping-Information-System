const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');
const { validateEmail, validatePassword } = require('../utils/helpers');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { 
    title: 'Login',
    error: null,
    email: ''
  });
});

// Login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Email and password are required',
      email
    });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password',
        email
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password',
        email
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login',
      error: 'An error occurred. Please try again.',
      email
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', { 
    title: 'Register',
    error: null,
    formData: {}
  });
});

// Register handler
router.post('/register', async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body;
  const formData = { full_name, email };

  // Validation
  if (!full_name || !email || !password) {
    return res.render('register', {
      title: 'Register',
      error: 'All fields are required',
      formData
    });
  }

  if (!validateEmail(email)) {
    return res.render('register', {
      title: 'Register',
      error: 'Invalid email address',
      formData
    });
  }

  if (password !== confirm_password) {
    return res.render('register', {
      title: 'Register',
      error: 'Passwords do not match',
      formData
    });
  }

  if (password.length < 8) {
    return res.render('register', {
      title: 'Register',
      error: 'Password must be at least 8 characters',
      formData
    });
  }

  try {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role`,
      [email.toLowerCase(), hashedPassword, full_name]
    );

    const user = result.rows[0];
    req.session.user = user;

    res.redirect('/dashboard');
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.render('register', {
        title: 'Register',
        error: 'Email already registered',
        formData
      });
    }

    console.error('Registration error:', error);
    res.render('register', {
      title: 'Register',
      error: 'An error occurred. Please try again.',
      formData
    });
  }
});

module.exports = router;