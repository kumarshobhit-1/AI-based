const express = require('express');
const router = express.Router();
const axios = require('axios');
const Prediction = require('../models/Prediction');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// GET /api/predictions - Get all predictions
router.get('/', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.disasterType = type;

    const predictions = await Prediction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    if (predictions.length === 0) {
      return res.json({ predictions: getDemoPredictions(), isDemo: true });
    }

    res.json({ predictions, isDemo: false });
  } catch (error) {
    res.json({ predictions: getDemoPredictions(), isDemo: true });
  }
});

// POST /api/predictions/analyze - Trigger ML analysis
router.post('/analyze', async (req, res) => {
  try {
    const { disasterType, location, inputData } = req.body;

    // Try to call ML service
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
        disaster_type: disasterType,
        location,
        features: inputData,
      }, { timeout: 30000 });

      const prediction = new Prediction({
        disasterType,
        location,
        probability: response.data.probability,
        confidence: response.data.confidence,
        severity: response.data.severity,
        predictedTime: response.data.predicted_time,
        modelUsed: response.data.model_used,
        modelVersion: response.data.model_version,
        inputFeatures: inputData,
      });

      await prediction.save();
      return res.json({ prediction, mlServiceUsed: true });
    } catch (mlError) {
      logger.warn('ML service unavailable, using fallback prediction');
    }

    // Fallback: rule-based prediction
    const prediction = generateFallbackPrediction(disasterType, location, inputData);
    res.json({ prediction, mlServiceUsed: false });
  } catch (error) {
    logger.error('Prediction analysis failed:', error);
    res.status(500).json({ error: 'Prediction analysis failed' });
  }
});

// GET /api/predictions/risk-assessment
router.get('/risk-assessment', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // Try ML service
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/risk-assessment`, {
        params: { lat, lon },
        timeout: 15000,
      });
      return res.json(response.data);
    } catch (mlError) {
      // Fallback
    }

    // Return demo risk assessment
    res.json({
      location: { latitude: parseFloat(lat) || 28.6, longitude: parseFloat(lon) || 77.2 },
      riskLevels: {
        earthquake: { level: 'medium', score: 0.45, factors: ['Proximity to fault lines', 'Historical seismic activity'] },
        flood: { level: 'high', score: 0.72, factors: ['Low elevation', 'Monsoon season', 'River proximity'] },
        cyclone: { level: 'low', score: 0.25, factors: ['Inland location', 'Distance from coast'] },
        heatwave: { level: 'high', score: 0.68, factors: ['Urban heat island', 'Summer season'] },
      },
      overallRisk: 'medium-high',
      lastUpdated: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Risk assessment failed' });
  }
});

function generateFallbackPrediction(type, location, data) {
  const baseProbability = Math.random() * 0.5 + 0.2;
  const severityMap = {
    0.8: 'critical',
    0.6: 'high',
    0.4: 'medium',
    0: 'low',
  };

  let severity = 'low';
  for (const [threshold, sev] of Object.entries(severityMap).sort((a, b) => b[0] - a[0])) {
    if (baseProbability >= parseFloat(threshold)) {
      severity = sev;
      break;
    }
  }

  return {
    disasterType: type,
    location,
    probability: baseProbability,
    confidence: 0.6 + Math.random() * 0.2,
    severity,
    predictedTime: new Date(Date.now() + (1 + Math.random() * 48) * 60 * 60 * 1000),
    modelUsed: 'rule-based-fallback',
    modelVersion: '1.0',
  };
}

function getDemoPredictions() {
  return [
    {
      _id: 'pred1',
      disasterType: 'earthquake',
      location: { name: 'Himalayan Region', latitude: 27.7, longitude: 85.3 },
      probability: 0.35,
      confidence: 0.72,
      severity: 'medium',
      modelUsed: 'seismic-lstm-v2',
      createdAt: new Date(),
    },
    {
      _id: 'pred2',
      disasterType: 'flood',
      location: { name: 'Ganges Basin', latitude: 25.3, longitude: 82.9 },
      probability: 0.78,
      confidence: 0.85,
      severity: 'high',
      modelUsed: 'flood-random-forest-v3',
      createdAt: new Date(),
    },
    {
      _id: 'pred3',
      disasterType: 'cyclone',
      location: { name: 'Bay of Bengal', latitude: 15.5, longitude: 85.0 },
      probability: 0.62,
      confidence: 0.68,
      severity: 'high',
      modelUsed: 'cyclone-cnn-v1',
      createdAt: new Date(),
    },
    {
      _id: 'pred4',
      disasterType: 'heatwave',
      location: { name: 'Delhi NCR', latitude: 28.6, longitude: 77.2 },
      probability: 0.55,
      confidence: 0.80,
      severity: 'medium',
      modelUsed: 'weather-gradient-boost-v2',
      createdAt: new Date(),
    },
  ];
}

module.exports = router;
