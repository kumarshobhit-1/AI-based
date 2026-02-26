const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, JWT_SECRET } = require('../middleware/auth');
const logger = require('../utils/logger');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Demo login
    if (email === 'demo@disaster-warning.com' && password === 'demo123') {
      return res.json({
        user: {
          _id: 'demo-user',
          name: 'Demo User',
          email: 'demo@disaster-warning.com',
          role: 'admin',
        },
        token: jwt.sign({ userId: 'demo-user' }, JWT_SECRET, { expiresIn: '7d' }),
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: user.toJSON(), token });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { notificationPreferences, monitoredLocations } = req.body;
    
    if (notificationPreferences) {
      req.user.notificationPreferences = notificationPreferences;
    }
    if (monitoredLocations) {
      req.user.monitoredLocations = monitoredLocations;
    }

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
