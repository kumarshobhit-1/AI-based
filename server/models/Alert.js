const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['earthquake', 'flood', 'cyclone', 'tsunami', 'wildfire', 'extreme_weather', 'heatwave', 'storm'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'monitoring', 'resolved', 'expired'],
    default: 'active',
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, default: 50 }, // Affected radius in km
  },
  data: {
    magnitude: Number,         // For earthquakes
    depth: Number,             // For earthquakes (km)
    waterLevel: Number,        // For floods (meters)
    windSpeed: Number,         // For storms/cyclones (km/h)
    temperature: Number,       // For heatwaves (°C)
    rainfall: Number,          // For floods (mm)
    pressure: Number,          // Atmospheric pressure (hPa)
    humidity: Number,          // Percentage
  },
  source: {
    type: String,
    enum: ['usgs', 'openweather', 'ml_prediction', 'manual', 'noaa', 'sensor'],
    required: true,
  },
  sourceEventId: {
    type: String,
    sparse: true,
  },
  predictions: {
    probability: Number,       // 0-1
    estimatedImpact: String,
    estimatedArrival: Date,
    modelVersion: String,
  },
  affectedPopulation: {
    type: Number,
    default: 0,
  },
  recommendations: [{
    type: String,
  }],
  notificationsSent: {
    type: Boolean,
    default: false,
  },
  resolvedAt: Date,
  expiresAt: Date,
}, {
  timestamps: true,
});

alertSchema.index({ type: 1, severity: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ sourceEventId: 1 }, { sparse: true });

module.exports = mongoose.model('Alert', alertSchema);
