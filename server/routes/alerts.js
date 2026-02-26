const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// GET /api/alerts - Fetch all alerts with filtering
router.get('/', async (req, res) => {
  try {
    const {
      type, severity, status, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc',
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    else filter.status = { $in: ['active', 'monitoring'] };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(filter),
    ]);

    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/alerts/active - Get currently active alerts
router.get('/active', async (req, res) => {
  try {
    const alerts = await Alert.find({
      status: 'active',
      $or: [
        { expiresAt: { $gte: new Date() } },
        { expiresAt: null },
      ],
    }).sort({ severity: -1, createdAt: -1 }).limit(50);

    res.json({ alerts, count: alerts.length });
  } catch (error) {
    logger.error('Error fetching active alerts:', error);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// GET /api/alerts/recent - Get recent alerts (demo-friendly)
router.get('/recent', async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(20);

    // If no alerts in DB, return demo data
    if (alerts.length === 0) {
      return res.json({ alerts: getDemoAlerts(), isDemo: true });
    }

    res.json({ alerts, isDemo: false });
  } catch (error) {
    // Return demo data if DB is unavailable
    res.json({ alerts: getDemoAlerts(), isDemo: true });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      activeCount,
      todayCount,
      weekCount,
      byType,
      bySeverity,
    ] = await Promise.all([
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ createdAt: { $gte: dayAgo } }),
      Alert.countDocuments({ createdAt: { $gte: weekAgo } }),
      Alert.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      activeAlerts: activeCount,
      alertsToday: todayCount,
      alertsThisWeek: weekCount,
      byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      bySeverity: bySeverity.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    });
  } catch (error) {
    // Return demo stats
    res.json({
      activeAlerts: 7,
      alertsToday: 12,
      alertsThisWeek: 45,
      byType: { earthquake: 15, flood: 12, storm: 10, heatwave: 8 },
      bySeverity: { critical: 2, high: 3, medium: 5, low: 7 },
    });
  }
});

// GET /api/alerts/:id - Get single alert
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// POST /api/alerts - Create manual alert
router.post('/', async (req, res) => {
  try {
    const alert = new Alert({
      ...req.body,
      source: 'manual',
    });
    await alert.save();

    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('new-alert', alert);
    }

    res.status(201).json(alert);
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/alerts/:id - Update alert status
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['status', 'severity', 'description', 'recommendations'];
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (req.body.status === 'resolved') {
      updates.resolvedAt = new Date();
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Broadcast update
    const io = req.app.get('io');
    if (io) {
      io.emit('alert-updated', alert);
    }

    res.json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Demo alerts for when DB is not connected
 */
function getDemoAlerts() {
  const now = new Date();
  return [
    {
      _id: 'demo1',
      title: 'Earthquake M6.2 - Nepal-India Border',
      type: 'earthquake',
      severity: 'high',
      status: 'active',
      description: 'A magnitude 6.2 earthquake detected at depth 15 km near the Nepal-India Border region.',
      location: { name: 'Nepal-India Border', latitude: 27.7, longitude: 85.3, radius: 120 },
      data: { magnitude: 6.2, depth: 15 },
      source: 'usgs',
      recommendations: ['Drop, Cover, and Hold On', 'Be prepared for aftershocks', 'Evacuate damaged buildings'],
      createdAt: new Date(now - 30 * 60 * 1000),
    },
    {
      _id: 'demo2',
      title: 'Cyclone Warning - Bay of Bengal',
      type: 'cyclone',
      severity: 'critical',
      status: 'active',
      description: 'Severe cyclonic storm with wind speeds of 140 km/h approaching eastern coast of India.',
      location: { name: 'Bay of Bengal', latitude: 15.5, longitude: 85.0, radius: 300 },
      data: { windSpeed: 140, pressure: 960, rainfall: 120 },
      source: 'openweather',
      recommendations: ['Move to reinforced shelter immediately', 'Stay away from coast', 'Follow evacuation orders'],
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      _id: 'demo3',
      title: 'Flood Warning - Ganges Basin',
      type: 'flood',
      severity: 'high',
      status: 'active',
      description: 'Water level at 8.5m with heavy rainfall exceeding 100mm near the Ganges Basin region.',
      location: { name: 'Ganges Basin, India', latitude: 25.3, longitude: 82.9, radius: 75 },
      data: { waterLevel: 8.5, rainfall: 110 },
      source: 'sensor',
      recommendations: ['Move to higher ground', 'Avoid walking through floodwater', 'Evacuate if ordered'],
      createdAt: new Date(now - 4 * 60 * 60 * 1000),
    },
    {
      _id: 'demo4',
      title: 'Heatwave Alert - Delhi',
      type: 'heatwave',
      severity: 'medium',
      status: 'active',
      description: 'Temperature of 43.5°C recorded in Delhi. Stay hydrated and avoid prolonged sun exposure.',
      location: { name: 'Delhi, India', latitude: 28.6, longitude: 77.2, radius: 50 },
      data: { temperature: 43.5, humidity: 25 },
      source: 'openweather',
      recommendations: ['Stay indoors during peak hours', 'Drink plenty of water', 'Check on elderly people'],
      createdAt: new Date(now - 6 * 60 * 60 * 1000),
    },
    {
      _id: 'demo5',
      title: 'Earthquake M4.8 - Pacific Ring of Fire',
      type: 'earthquake',
      severity: 'medium',
      status: 'monitoring',
      description: 'A magnitude 4.8 earthquake detected at depth 45 km near Japan.',
      location: { name: 'Near Tokyo, Japan', latitude: 35.9, longitude: 140.2, radius: 80 },
      data: { magnitude: 4.8, depth: 45 },
      source: 'usgs',
      recommendations: ['Drop, Cover, and Hold On if shaking occurs', 'Move away from windows'],
      createdAt: new Date(now - 8 * 60 * 60 * 1000),
    },
    {
      _id: 'demo6',
      title: 'Storm Warning - Manila',
      type: 'storm',
      severity: 'medium',
      status: 'active',
      description: 'Strong winds of 65 km/h with heavy rainfall approaching Manila, Philippines.',
      location: { name: 'Manila, Philippines', latitude: 14.5, longitude: 120.9, radius: 100 },
      data: { windSpeed: 65, rainfall: 55, pressure: 1005 },
      source: 'openweather',
      recommendations: ['Secure loose outdoor objects', 'Stay indoors until storm passes'],
      createdAt: new Date(now - 10 * 60 * 60 * 1000),
    },
  ];
}

module.exports = router;
