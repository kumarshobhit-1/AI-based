/**
 * Seed script - Populates database with sample disaster alerts and sensor data
 * Run: node seed.js
 */
require('dotenv').config({ path: '../.env.example' });
const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const SensorData = require('./models/SensorData');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster-warning';

const sampleAlerts = [
  {
    title: 'Earthquake M6.2 - Nepal-India Border',
    type: 'earthquake',
    severity: 'high',
    status: 'active',
    description: 'A magnitude 6.2 earthquake detected at depth 15 km near the Nepal-India Border region. Aftershocks expected.',
    location: { name: 'Nepal-India Border', latitude: 27.7, longitude: 85.3, radius: 120 },
    data: { magnitude: 6.2, depth: 15 },
    source: 'usgs',
    recommendations: [
      'Drop, Cover, and Hold On',
      'Be prepared for aftershocks',
      'Evacuate damaged buildings immediately',
      'Check for gas leaks',
      'Have emergency kit ready',
    ],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    title: 'Severe Cyclone Warning - Bay of Bengal',
    type: 'cyclone',
    severity: 'critical',
    status: 'active',
    description: 'Severe cyclonic storm with sustained wind speeds of 140 km/h approaching the eastern coast of India. Expected landfall in 18 hours.',
    location: { name: 'Bay of Bengal', latitude: 15.5, longitude: 85.0, radius: 300 },
    data: { windSpeed: 140, pressure: 960, rainfall: 120 },
    source: 'openweather',
    affectedPopulation: 5000000,
    recommendations: [
      'Move to reinforced shelter immediately',
      'Stay away from coast and low-lying areas',
      'Follow evacuation orders',
      'Charge all communication devices',
      'Store water and non-perishable food',
    ],
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  },
  {
    title: 'Flood Warning - Ganges Basin',
    type: 'flood',
    severity: 'high',
    status: 'active',
    description: 'Water level at 8.5m (danger: 7m) with continuous heavy rainfall of 110mm. Rising water levels expected for next 24 hours.',
    location: { name: 'Ganges Basin, India', latitude: 25.3, longitude: 82.9, radius: 75 },
    data: { waterLevel: 8.5, rainfall: 110 },
    source: 'sensor',
    affectedPopulation: 2000000,
    recommendations: [
      'Move to higher ground immediately',
      'Avoid walking or driving through floodwater',
      'Disconnect electrical appliances',
      'Keep important documents in waterproof bags',
      'Boil drinking water',
    ],
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  },
  {
    title: 'Heatwave Alert - Delhi NCR',
    type: 'heatwave',
    severity: 'medium',
    status: 'active',
    description: 'Temperature of 43.5°C recorded with heat index of 48°C. Conditions expected to persist for 3-4 days.',
    location: { name: 'Delhi NCR, India', latitude: 28.6, longitude: 77.2, radius: 50 },
    data: { temperature: 43.5, humidity: 25 },
    source: 'openweather',
    recommendations: [
      'Stay indoors during peak hours (11 AM - 4 PM)',
      'Drink plenty of water and fluids',
      'Avoid strenuous outdoor activities',
      'Check on elderly and vulnerable people',
    ],
    expiresAt: new Date(Date.now() + 96 * 60 * 60 * 1000),
  },
  {
    title: 'Earthquake M4.8 - Pacific Ring of Fire',
    type: 'earthquake',
    severity: 'medium',
    status: 'monitoring',
    description: 'A magnitude 4.8 earthquake detected at depth 45 km in the Tokyo region. No tsunami warning issued.',
    location: { name: 'Near Tokyo, Japan', latitude: 35.9, longitude: 140.2, radius: 80 },
    data: { magnitude: 4.8, depth: 45 },
    source: 'usgs',
    recommendations: [
      'Drop, Cover, and Hold On if shaking occurs',
      'Move away from windows and heavy objects',
    ],
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  },
  {
    title: 'Storm Warning - Manila',
    type: 'storm',
    severity: 'medium',
    status: 'active',
    description: 'Strong tropical storm with wind speeds of 65 km/h and heavy rainfall of 55mm approaching Metro Manila.',
    location: { name: 'Manila, Philippines', latitude: 14.5, longitude: 120.9, radius: 100 },
    data: { windSpeed: 65, rainfall: 55, pressure: 1005 },
    source: 'openweather',
    recommendations: [
      'Secure loose outdoor objects',
      'Stay indoors until storm passes',
      'Keep emergency supplies ready',
    ],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    title: 'Flood Risk - Brahmaputra Valley',
    type: 'flood',
    severity: 'low',
    status: 'monitoring',
    description: 'Water level at 3.2m (warning: 5m). Upstream rainfall increasing. Monitoring situation closely.',
    location: { name: 'Brahmaputra Valley, India', latitude: 26.1, longitude: 91.7, radius: 60 },
    data: { waterLevel: 3.2, rainfall: 35 },
    source: 'sensor',
    recommendations: [
      'Monitor water levels regularly',
      'Prepare emergency evacuation plan',
    ],
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Alert.deleteMany({});
    await SensorData.deleteMany({});
    console.log('Cleared existing data');

    // Insert alerts
    const alerts = await Alert.insertMany(sampleAlerts);
    console.log(`Inserted ${alerts.length} sample alerts`);

    // Insert sample sensor data
    const sampleSensorData = [
      { source: 'openweather', type: 'weather', location: { name: 'Delhi', latitude: 28.6, longitude: 77.2 }, readings: { temperature: 43.5, humidity: 25, pressure: 1008, windSpeed: 15 }, quality: 'good' },
      { source: 'openweather', type: 'weather', location: { name: 'Mumbai', latitude: 19.0, longitude: 72.8 }, readings: { temperature: 32, humidity: 78, pressure: 1012, windSpeed: 22, rainfall: 15 }, quality: 'good' },
      { source: 'usgs', type: 'earthquake', location: { name: 'Nepal Border', latitude: 27.7, longitude: 85.3 }, readings: { magnitude: 6.2, depth: 15 }, quality: 'good' },
      { source: 'sensor', type: 'flood', location: { name: 'Ganges Basin', latitude: 25.3, longitude: 82.9 }, readings: { waterLevel: 8.5, rainfall: 110 }, quality: 'moderate' },
    ];

    const sensors = await SensorData.insertMany(sampleSensorData);
    console.log(`Inserted ${sensors.length} sensor data records`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    console.log('\n💡 Make sure MongoDB is running. The app works without a database using demo data.');
    process.exit(1);
  }
}

seed();
