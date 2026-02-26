const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  disasterType: {
    type: String,
    enum: ['earthquake', 'flood', 'cyclone', 'tsunami', 'wildfire', 'extreme_weather', 'heatwave', 'storm'],
    required: true,
  },
  location: {
    name: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  probability: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
  },
  predictedTime: {
    type: Date,
  },
  timeWindow: {
    start: Date,
    end: Date,
  },
  modelUsed: {
    type: String,
    required: true,
  },
  modelVersion: String,
  inputFeatures: {
    type: mongoose.Schema.Types.Mixed,
  },
  alertGenerated: {
    type: Boolean,
    default: false,
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
  },
  accuracy: Number,
}, {
  timestamps: true,
});

predictionSchema.index({ disasterType: 1, probability: -1 });
predictionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
