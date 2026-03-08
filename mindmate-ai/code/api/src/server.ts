/**
 * MindMate AI API Server
 * Production-ready Express server with comprehensive middleware setup
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import configurations
import { config } from './config';
import { logger, stream } from './utils/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestValidator } from './middleware/requestValidator';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Import routes
import { registerRoutes } from './routes';

// Create Express application
const app: Application = express();

/**
 * Security Middleware
 */
// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Compression
app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));

/**
 * Logging Middleware
 */
// Morgan for HTTP request logging
app.use(morgan(config.log.format, { stream }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

/**
 * Body Parsing Middleware
 */
app.use(express.json({ 
  limit: '10mb',
  strict: true,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Rate Limiting Middleware
 */
// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authenticated,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests, please try again later',
    code: 429,
    retry_after: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests, please try again later',
      code: 429,
      retry_after: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});

app.use(globalLimiter);

/**
 * Health Check Endpoint (No auth required)
 */
app.get('/health', async (req: Request, res: Response) => {
  const healthcheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.app.version,
    environment: config.app.env,
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    healthcheck.services.database = 'healthy';
  } catch (error) {
    healthcheck.services.database = 'unhealthy';
    healthcheck.status = 'degraded';
    logger.error('Database health check failed:', error);
  }

  try {
    // Check Redis connection
    await redis.ping();
    healthcheck.services.redis = 'healthy';
  } catch (error) {
    healthcheck.services.redis = 'unhealthy';
    healthcheck.status = 'degraded';
    logger.error('Redis health check failed:', error);
  }

  const statusCode = healthcheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

/**
 * Version Endpoint
 */
app.get('/version', (req: Request, res: Response) => {
  res.json({
    version: config.app.version,
    build: config.app.build || 'development',
    environment: config.app.env,
    api_prefix: config.app.apiPrefix,
  });
});

/**
 * API Routes Registration
 */
registerRoutes(app);

/**
 * 404 Handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'not_found',
    message: `Cannot ${req.method} ${req.path}`,
    code: 404,
    request_id: req.id,
  });
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Server Startup
 */
const PORT = config.app.port;

const server = app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🧠 MindMate AI API Server                                  ║
║                                                              ║
║   Environment: ${config.app.env.padEnd(45)}║
║   Port: ${PORT.toString().padEnd(52)}║
║   API Prefix: ${config.app.apiPrefix.padEnd(47)}║
║   Version: ${config.app.version.padEnd(50)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

/**
 * Graceful Shutdown
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close HTTP server
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Disconnect from database
      await prisma.$disconnect();
      logger.info('Database connection closed');

      // Disconnect from Redis
      await redis.quit();
      logger.info('Redis connection closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app, server };
