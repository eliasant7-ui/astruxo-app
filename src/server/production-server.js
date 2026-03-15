/**
 * Production Server Entry Point
 * Creates HTTP server with Socket.IO support
 */
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeFirebase } from './services/firebase.ts';
import { initializeSocketIO } from './services/socket.ts';
import { closeConnection } from './db/client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
const clientPath = path.join(__dirname, '../../client');
console.log('📁 Serving static files from:', clientPath);
app.use(express.static(clientPath));

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
initializeFirebase();

// Initialize Socket.IO
console.log('🔌 Initializing Socket.IO...');
initializeSocketIO(httpServer);

// Import and mount API routes
console.log('📡 Loading API routes...');
// API routes will be loaded by vite-plugin-api-routes

// SPA fallback
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  if (req.path.startsWith('/api')) {
    return next();
  }

  if (path.extname(req.path)) {
    return next();
  }

  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
  } else {
    next(err);
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`Got ${signal}, shutting down gracefully...`);

  try {
    await closeConnection();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }

  process.exit(0);
};

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, shutdown);
});

// Start server
const PORT = process.env.PORT || 20011;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`✅ Server ready at http://${HOST}:${PORT}/`);
});

export { app, httpServer };
