const logger = require('../utils/logger');

class WebSocketService {
  constructor(io) {
    this.io = io;
    this.connectedClients = new Map();

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, {
        connectedAt: new Date(),
        subscriptions: [],
      });

      // Subscribe to specific disaster types
      socket.on('subscribe', (types) => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.subscriptions = types;
          socket.join(types); // Join rooms for each type
        }
        logger.info(`Client ${socket.id} subscribed to: ${types.join(', ')}`);
      });

      // Subscribe to location-based alerts
      socket.on('subscribe-location', (location) => {
        const roomName = `loc_${location.lat.toFixed(2)}_${location.lon.toFixed(2)}`;
        socket.join(roomName);
        logger.info(`Client ${socket.id} subscribed to location: ${roomName}`);
      });

      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Broadcast alert to all connected clients
   */
  broadcastAlert(alert) {
    this.io.emit('new-alert', alert);
  }

  /**
   * Send alert to clients subscribed to specific disaster type
   */
  sendTypeAlert(type, alert) {
    this.io.to(type).emit('new-alert', alert);
  }

  /**
   * Send data update for dashboard
   */
  sendDataUpdate(data) {
    this.io.emit('data-update', data);
  }

  /**
   * Get count of connected clients
   */
  getClientCount() {
    return this.connectedClients.size;
  }
}

module.exports = WebSocketService;
