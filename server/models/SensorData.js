const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['usgs', 'openweather', 'noaa', 'sensor', 'satellite'],
    required: true,
  },
  type: {
    type: String,
    enum: ['earthquake', 'weather', 'flood', 'seismic', 'temperature', 'wind', 'precipitation'],
    required: true,
  },
  location: {
    name: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  readings: {
    magnitude: Number,
    depth: Number,
    temperature: Number,
    humidity: Number,
    pressure: Number,
    windSpeed: Number,
    windDirection: Number,
    rainfall: Number,
    waterLevel: Number,
    visibility: Number,
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
  },
  quality: {
    type: String,
    enum: ['good', 'moderate', 'poor', 'unknown'],
    default: 'unknown',
  },
  processedAt: Date,
}, {
  timestamps: true,
});

sensorDataSchema.index({ source: 1, type: 1 });
sensorDataSchema.index({ createdAt: -1 });
sensorDataSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
