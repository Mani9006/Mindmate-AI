/**
 * Example Server - MindMate AI Session Management
 * Complete working example of how to use the session management API
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import session management module
const { initialize } = require('../index');

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmate';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize session management
const initSessions = () => {
  const aiConfig = {
    provider: process.env.AI_PROVIDER || 'anthropic',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'claude-3-sonnet-20240229',
    maxRetries: 3,
    timeout: 30000
  };

  if (!aiConfig.apiKey) {
    console.warn('⚠️ AI_API_KEY not set. AI features will not work.');
  }

  const sessions = initialize({
    app,
    server,
    aiConfig,
    apiPrefix: process.env.API_PREFIX || '/api/v1'
  });

  console.log('✅ Session management initialized');
  console.log(`📡 WebSocket server active at /ws/sessions`);

  return sessions;
};

// WebSocket stats endpoint
app.get('/ws-stats', (req, res) => {
  const stats = sessions.websocket?.getStats();
  res.json({
    success: true,
    data: stats || { totalConnections: 0, activeSessions: 0, usersOnline: 0 }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Close WebSocket connections
    if (sessions.websocket) {
      await sessions.websocket.close();
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  
  global.sessions = initSessions();
  
  server.listen(PORT, () => {
    console.log(`\n🚀 MindMate AI Session API running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1/sessions`);
    console.log(`🔌 WebSocket Endpoint: ws://localhost:${PORT}/ws/sessions`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start().catch(console.error);
