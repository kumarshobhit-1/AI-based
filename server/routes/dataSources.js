const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const DataCollectorService = require('../services/dataCollector');
const logger = require('../utils/logger');

const dataCollector = new DataCollectorService();

// GET /api/data-sources - Get all available data sources
router.get('/', (req, res) => {
  res.json({
    sources: [
      {
        id: 'usgs',
        name: 'USGS Earthquake Hazards',
        type: 'earthquake',
        url: 'https://earthquake.usgs.gov',
        status: 'active',
        updateFrequency: '5 minutes',
        description: 'Real-time earthquake data from the US Geological Survey',
      },
      {
        id: 'openweather',
        name: 'OpenWeatherMap',
        type: 'weather',
        url: 'https://openweathermap.org',
        status: process.env.OPENWEATHER_API_KEY ? 'active' : 'demo',
        updateFrequency: '15 minutes',
        description: 'Global weather data including temperature, wind, and precipitation',
      },
      {
        id: 'noaa',
        name: 'NOAA Weather Service',
        type: 'weather',
        url: 'https://www.weather.gov',
        status: 'active',
        updateFrequency: '30 minutes',
        description: 'National Oceanic and Atmospheric Administration weather alerts',
      },
      {
        id: 'flood_sensors',
        name: 'Flood Monitoring Network',
        type: 'flood',
        url: '#',
        status: 'active',
        updateFrequency: '30 minutes',
        description: 'River and water level monitoring sensors across flood-prone regions',
      },
      {
        id: 'ml_prediction',
        name: 'AI Prediction Engine',
        type: 'prediction',
        url: `http://localhost:${process.env.ML_PORT || 8000}`,
        status: 'active',
        updateFrequency: '1 hour',
        description: 'Machine learning models for disaster prediction and risk assessment',
      },
    ],
  });
});

// GET /api/data-sources/latest - Get latest data from all sources
router.get('/latest', async (req, res) => {
  try {
    const { type, source, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (source) filter.source = source;

    const data = await SensorData.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    if (data.length === 0) {
      return res.json({ data: getSimulatedLatestData(), isDemo: true });
    }

    res.json({ data, isDemo: false });
  } catch (error) {
    res.json({ data: getSimulatedLatestData(), isDemo: true });
  }
});

// POST /api/data-sources/collect - Trigger manual data collection
router.post('/collect', async (req, res) => {
  try {
    const { source } = req.body;
    let results;

    switch (source) {
      case 'weather':
        results = await dataCollector.collectWeatherData();
        break;
      case 'earthquake':
        results = await dataCollector.collectEarthquakeData();
        break;
      case 'flood':
        results = await dataCollector.collectFloodData();
        break;
      default:
        // Collect all
        const [weather, earthquake, flood] = await Promise.all([
          dataCollector.collectWeatherData(),
          dataCollector.collectEarthquakeData(),
          dataCollector.collectFloodData(),
        ]);
        results = { weather, earthquake, flood };
    }

    res.json({ message: 'Data collection triggered', results });
  } catch (error) {
    logger.error('Manual data collection failed:', error);
    res.status(500).json({ error: 'Data collection failed' });
  }
});

// GET /api/data-sources/monitored-locations
router.get('/monitored-locations', (req, res) => {
  res.json({
    locations: dataCollector.monitoredLocations,
  });
});

function getSimulatedLatestData() {
  const locations = [
    { name: 'Mumbai, India', lat: 19.076, lon: 72.877 },
    { name: 'Delhi, India', lat: 28.613, lon: 77.209 },
    { name: 'Tokyo, Japan', lat: 35.676, lon: 139.650 },
    { name: 'San Francisco, USA', lat: 37.774, lon: -122.419 },
  ];

  return locations.map(loc => ({
    source: 'openweather',
    type: 'weather',
    location: { name: loc.name, latitude: loc.lat, longitude: loc.lon },
    readings: {
      temperature: 20 + Math.random() * 20,
      humidity: 40 + Math.random() * 40,
      pressure: 1000 + Math.random() * 25,
      windSpeed: 5 + Math.random() * 30,
      rainfall: Math.random() * 20,
    },
    quality: 'moderate',
    createdAt: new Date(),
  }));
}

module.exports = router;
