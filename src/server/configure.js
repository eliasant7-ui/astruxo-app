import 'dotenv/config';
import express from "express";
import { closeConnection, testConnection } from "./db/client.ts";
import path from "node:path";
import { initializeFirebase } from "./services/firebase.ts";
import { initializeSocketIO } from "./services/socket.ts";
import { optionalAuthMiddleware } from "./middleware/auth.ts";
import { bootstrapService } from "./services/bootstrap-service.ts";

/**
 * Keepalive: pinga la DB cada 4 minutos para evitar ER_CLIENT_INTERACTION_TIMEOUT.
 * MySQL cierra conexiones inactivas según wait_timeout (por defecto 8 min).
 */
function startDbKeepalive() {
  const INTERVAL_MS = 4 * 60 * 1000; // 4 minutos
  setInterval(async () => {
    try {
      await testConnection();
      console.log('💓 DB keepalive OK');
    } catch (err) {
      console.warn('⚠️ DB keepalive failed:', err.message);
    }
  }, INTERVAL_MS);
  console.log('💓 DB keepalive iniciado (cada 4 min)');
}

export const viteServerBefore = (server, viteServer) => {
  console.log("VITEJS SERVER");
  
  // Special handling for Stripe webhook - needs raw body for signature verification
  server.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  
  // Regular JSON parsing for all other routes
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  
  // Initialize Firebase Admin
  initializeFirebase();

  // Keepalive para evitar ER_CLIENT_INTERACTION_TIMEOUT
  startDbKeepalive();
  
  // Start Bootstrap Service (automated content generation)
  bootstrapService.start().catch(err => {
    console.error('❌ Failed to start bootstrap service:', err);
  });
  
  // API prefix rewriter - MUST be before auth middleware
  // Rewrites /api/* to /* so vite-plugin-api-routes can handle them
  server.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`🔄 Rewriting ${req.path} to ${req.path.substring(4)}`);
      req.url = req.url.substring(4); // Remove /api from URL
      req.path = req.path.substring(4); // Remove /api from path
    }
    next();
  });
  
  // Add optional authentication middleware (populates req.user if token is present)
  server.use(optionalAuthMiddleware);
  
  // Global request logger
  server.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url} (path: ${req.path})`);
    if (req.path.startsWith('/streams') || req.path.startsWith('/auth') || req.path.startsWith('/analytics')) {
      console.log('🔍 Headers:', {
        authorization: req.headers.authorization ? 'Bearer ' + req.headers.authorization.substring(7, 27) + '...' : 'NONE',
        contentType: req.headers['content-type'],
      });
      console.log('🔍 User:', req.user ? { id: req.user.id, role: req.user.role } : 'NONE');
    }
    next();
  });
};

export const viteServerAfter = (server, viteServer) => {
  const errorHandler = (err, req, res, next) => {
    if (err instanceof Error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    } else {
      next(err);
    }
  };
  server.use(errorHandler);
  
  // Initialize Socket.IO with the HTTP server
  if (viteServer?.httpServer) {
    initializeSocketIO(viteServer.httpServer);
  }

  // Social media bot detection for stream pages (dev mode)
  server.use((req, res, next) => {
    if (req.method !== 'GET') return next();

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isSocialBot =
      userAgent.includes('whatsapp') ||
      userAgent.includes('facebookexternalhit') ||
      userAgent.includes('twitterbot') ||
      userAgent.includes('telegrambot') ||
      userAgent.includes('linkedinbot') ||
      userAgent.includes('slackbot') ||
      userAgent.includes('discordbot') ||
      userAgent.includes('applebot') ||
      userAgent.includes('googlebot') ||
      userAgent.includes('bingbot');

    if (isSocialBot) {
      const streamMatch = req.path.match(/^\/stream\/([^/]+)$/);
      if (streamMatch) {
        const slug = streamMatch[1];
        console.log(`🤖 Social bot detected, redirecting /stream/${slug} to preview endpoint`);
        return res.redirect(302, `/api/stream-preview/${slug}`);
      }
    }

    next();
  });
};

// ServerHook
export const serverBefore = (server, httpServer) => {
  console.log('🚀 serverBefore hook called');
  
  const shutdown = async (signal) => {
    console.log(`Got ${signal}, shutting down gracefully...`);

    try {
      // Close database connection pool before exiting
      await closeConnection();
      console.log("Database connections closed");
    } catch (error) {
      console.error("Error closing database connections:", error);
    }

    process.exit(0);
  };

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.on(signal, shutdown);
  });

  // Special handling for Stripe webhook - needs raw body for signature verification
  server.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  
  // Regular JSON parsing for all other routes
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  server.use(express.static("client"));
  
  // Initialize Firebase Admin
  initializeFirebase();

  // Keepalive para evitar ER_CLIENT_INTERACTION_TIMEOUT
  startDbKeepalive();
  
  // Initialize Socket.IO with the HTTP server
  console.log('🔌 Attempting to initialize Socket.IO...');
  console.log('📊 httpServer exists:', !!httpServer);
  if (httpServer) {
    initializeSocketIO(httpServer);
  } else {
    // In production, vite-plugin-api-routes doesn't pass httpServer
    // We'll initialize Socket.IO using a workaround
    console.warn('⚠️ httpServer not provided, will initialize Socket.IO via middleware');
    
    // Add middleware to capture the HTTP server from the request
    server.use((req, res, next) => {
      if (!global.__socketIOInitialized && req.socket && req.socket.server) {
        console.log('🔌 Initializing Socket.IO from request middleware...');
        initializeSocketIO(req.socket.server);
        global.__socketIOInitialized = true;
      }
      next();
    });
  }
};

// Manual initialization function for production
export function initializeServer(server, httpServer) {
  console.log('🚀 Manual server initialization called');
  serverBefore(server, httpServer);
}

export const serverAfter = (server, httpServer) => {
  console.log('🚀 serverAfter hook called');
  console.log('📊 httpServer exists in serverAfter:', !!httpServer);
  
  // Try to initialize Socket.IO here if httpServer is available
  if (httpServer) {
    console.log('🔌 Initializing Socket.IO from serverAfter...');
    initializeSocketIO(httpServer);
  } else {
    console.warn('⚠️ httpServer not available in serverAfter either');
  }
  
  // Social media bot detection for stream pages
  // When WhatsApp/Facebook/Twitter crawls a /stream/:slug URL,
  // redirect to the preview endpoint that serves proper OG meta tags
  server.use((req, res, next) => {
    if (req.method !== 'GET') return next();

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isSocialBot =
      userAgent.includes('whatsapp') ||
      userAgent.includes('facebookexternalhit') ||
      userAgent.includes('twitterbot') ||
      userAgent.includes('telegrambot') ||
      userAgent.includes('linkedinbot') ||
      userAgent.includes('slackbot') ||
      userAgent.includes('discordbot') ||
      userAgent.includes('applebot') ||
      userAgent.includes('googlebot') ||
      userAgent.includes('bingbot');

    if (isSocialBot) {
      // Match /stream/:slug routes
      const streamMatch = req.path.match(/^\/stream\/([^/]+)$/);
      if (streamMatch) {
        const slug = streamMatch[1];
        console.log(`🤖 Social bot detected (${userAgent.split('/')[0]}), redirecting /stream/${slug} to preview endpoint`);
        return res.redirect(302, `/api/stream-preview/${slug}`);
      }
    }

    next();
  });

  // Add SPA fallback for client-side routing
  // This middleware serves index.html for any GET request that doesn't match
  // an API endpoint or static file, enabling React Router to handle the route
  server.use((req, res, next) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if this is an API request
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip if this is a static asset request (has file extension)
    if (path.extname(req.path)) {
      return next();
    }

    // For all other GET requests, serve index.html to support client-side routing
    res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
  });

  const errorHandler = (err, req, res, next) => {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      next(err);
    }
  };
  server.use(errorHandler);
};

