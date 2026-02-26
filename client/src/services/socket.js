import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (socket) return;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
  });

  socket.on('connect', () => {
    console.log('🔌 WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.log('WebSocket connection error (server may be offline)');
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToAlerts = (callback) => {
  if (!socket) return;
  socket.on('new-alert', callback);
};

export const subscribeToUpdates = (callback) => {
  if (!socket) return;
  socket.on('data-update', callback);
};

export const subscribeToTypes = (types) => {
  if (!socket) return;
  socket.emit('subscribe', types);
};
