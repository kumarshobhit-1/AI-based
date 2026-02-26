require('dotenv').config({ path: '../.env.example' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cron = require('node-cron');
const logger = require('./utils/logger');

// Import routes
const alertRoutes = require('./routes/alerts');
const dataSourceRoutes = require('./routes/dataSources');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const predictionRoutes = require('./routes/predictions');

// Import services
const DataCollectorService = require('./services/dataCollector');
const AlertService = require('./services/alertService');
const WebSocketService = require('./services/websocketService');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/alerts', alertRoutes);
app.use('/api/data-sources', dataSourceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/predictions', predictionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      websocket: 'active',
    },
  });
});

// Initialize WebSocket service
const wsService = new WebSocketService(io);
app.set('wsService', wsService);
app.set('io', io);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster-warning';
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.warn('MongoDB connection failed, running in demo mode:', err.message);
  });

// Data collection cron jobs
const dataCollector = new DataCollectorService();
const alertService = new AlertService(io);

// Fetch weather data every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  logger.info('Running scheduled weather data collection...');
  try {
    await dataCollector.collectWeatherData();
    await alertService.evaluateAlerts();
  } catch (error) {
    logger.error('Weather data collection failed:', error.message);
  }
});

// Fetch earthquake data every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Running scheduled earthquake data collection...');
  try {
    await dataCollector.collectEarthquakeData();
    await alertService.evaluateAlerts();
  } catch (error) {
    logger.error('Earthquake data collection failed:', error.message);
  }
});

// Fetch flood data every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  logger.info('Running scheduled flood data collection...');
  try {
    await dataCollector.collectFloodData();
    await alertService.evaluateAlerts();
  } catch (error) {
    logger.error('Flood data collection failed:', error.message);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚨 Disaster Early Warning Server running on port ${PORT}`);
  logger.info(`📡 WebSocket server active`);
  logger.info(`🔗 API: http://localhost:${PORT}/api`);
});

module.exports = { app, server, io };
