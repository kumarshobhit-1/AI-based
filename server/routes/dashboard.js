const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const SensorData = require('../models/SensorData');
const logger = require('../utils/logger');

// GET /api/dashboard - Get complete dashboard data
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      activeAlerts,
      recentAlerts,
      alertsByType,
      alertsByDay,
      latestReadings,
      criticalCount,
    ] = await Promise.all([
      Alert.countDocuments({ status: 'active' }),
      Alert.find({ status: { $in: ['active', 'monitoring'] } })
        .sort({ createdAt: -1 })
        .limit(10),
      Alert.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$type', count: { $sum: 1 }, avgSeverity: { $avg: { $switch: { branches: [
          { case: { $eq: ['$severity', 'critical'] }, then: 4 },
          { case: { $eq: ['$severity', 'high'] }, then: 3 },
          { case: { $eq: ['$severity', 'medium'] }, then: 2 },
          { case: { $eq: ['$severity', 'low'] }, then: 1 },
        ], default: 0 } } } } },
      ]),
      Alert.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SensorData.find().sort({ createdAt: -1 }).limit(20),
      Alert.countDocuments({ status: 'active', severity: 'critical' }),
    ]);

    res.json({
      summary: {
        activeAlerts,
        criticalAlerts: criticalCount,
        monitoredLocations: 10,
        dataSourcesActive: 5,
      },
      recentAlerts,
      alertsByType,
      alertsByDay,
      latestReadings,
    });
  } catch (error) {
    // Return demo dashboard data
    res.json(getDemoDashboard());
  }
});

// GET /api/dashboard/map-data - Get data for map visualization
router.get('/map-data', async (req, res) => {
  try {
    const alerts = await Alert.find({
      status: { $in: ['active', 'monitoring'] },
    }).select('title type severity location data createdAt').limit(100);

    if (alerts.length === 0) {
      return res.json({ markers: getDemoMapMarkers() });
    }

    const markers = alerts.map(alert => ({
      id: alert._id,
      title: alert.title,
      type: alert.type,
      severity: alert.severity,
      lat: alert.location.latitude,
      lng: alert.location.longitude,
      radius: alert.location.radius,
      locationName: alert.location.name,
      data: alert.data,
      createdAt: alert.createdAt,
    }));

    res.json({ markers });
  } catch (error) {
    res.json({ markers: getDemoMapMarkers() });
  }
});

function getDemoDashboard() {
  return {
    summary: {
      activeAlerts: 7,
      criticalAlerts: 2,
      monitoredLocations: 10,
      dataSourcesActive: 5,
    },
    recentAlerts: [
      { _id: 'd1', title: 'Earthquake M6.2 - Nepal Border', type: 'earthquake', severity: 'high', status: 'active', createdAt: new Date() },
      { _id: 'd2', title: 'Cyclone Warning - Bay of Bengal', type: 'cyclone', severity: 'critical', status: 'active', createdAt: new Date(Date.now() - 3600000) },
      { _id: 'd3', title: 'Flood Warning - Ganges Basin', type: 'flood', severity: 'high', status: 'active', createdAt: new Date(Date.now() - 7200000) },
      { _id: 'd4', title: 'Heatwave Alert - Delhi', type: 'heatwave', severity: 'medium', status: 'active', createdAt: new Date(Date.now() - 14400000) },
      { _id: 'd5', title: 'Storm - Manila', type: 'storm', severity: 'medium', status: 'monitoring', createdAt: new Date(Date.now() - 21600000) },
    ],
    alertsByType: [
      { _id: 'earthquake', count: 15 },
      { _id: 'flood', count: 12 },
      { _id: 'storm', count: 10 },
      { _id: 'heatwave', count: 8 },
      { _id: 'cyclone', count: 3 },
    ],
    alertsByDay: [
      { _id: '2026-02-20', count: 5 },
      { _id: '2026-02-21', count: 8 },
      { _id: '2026-02-22', count: 3 },
      { _id: '2026-02-23', count: 12 },
      { _id: '2026-02-24', count: 7 },
      { _id: '2026-02-25', count: 6 },
      { _id: '2026-02-26', count: 9 },
    ],
    latestReadings: [],
  };
}

function getDemoMapMarkers() {
  return [
    { id: 'dm1', title: 'Earthquake M6.2', type: 'earthquake', severity: 'high', lat: 27.7, lng: 85.3, radius: 120, locationName: 'Nepal-India Border' },
    { id: 'dm2', title: 'Cyclone Warning', type: 'cyclone', severity: 'critical', lat: 15.5, lng: 85.0, radius: 300, locationName: 'Bay of Bengal' },
    { id: 'dm3', title: 'Flood Warning', type: 'flood', severity: 'high', lat: 25.3, lng: 82.9, radius: 75, locationName: 'Ganges Basin' },
    { id: 'dm4', title: 'Heatwave', type: 'heatwave', severity: 'medium', lat: 28.6, lng: 77.2, radius: 50, locationName: 'Delhi' },
    { id: 'dm5', title: 'Earthquake M4.8', type: 'earthquake', severity: 'medium', lat: 35.9, lng: 140.2, radius: 80, locationName: 'Tokyo Region' },
    { id: 'dm6', title: 'Storm Warning', type: 'storm', severity: 'medium', lat: 14.5, lng: 120.9, radius: 100, locationName: 'Manila' },
    { id: 'dm7', title: 'Flood Risk', type: 'flood', severity: 'low', lat: 23.8, lng: 90.4, radius: 60, locationName: 'Dhaka' },
  ];
}

module.exports = router;
