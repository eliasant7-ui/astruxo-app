/**
 * Railway Production Server
 * Express + Socket.IO + MySQL
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { initializeFirebase } from './src/server/services/firebase.ts';
import { initializeSocketIO } from './src/server/services/socket.ts';
import { closeConnection } from './src/server/db/client.ts';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5173;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
initializeFirebase();

// Initialize Socket.IO
console.log('🔌 Initializing Socket.IO...');
initializeSocketIO(httpServer);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Got ${signal}, shutting down...`);
  try {
    await closeConnection();
    httpServer.close(() => process.exit(0));
  } catch (error) {
    console.error('Shutdown error:', error);
    process.exit(1);
  }
};

['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => shutdown(signal));
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready`);
});

export { app, httpServer };
