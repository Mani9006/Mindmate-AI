/**
 * Prisma Database Client Configuration
 * Singleton pattern for database connection management
 */

import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from '../utils/logger';

// Prisma client with logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.app.isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ]
      : [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
    datasources: {
      db: {
        url: config.database.url,
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Global declaration for hot reloading in development
declare global {
  var prisma: PrismaClientSingleton | undefined;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Log queries in development
if (config.app.isDevelopment) {
  prisma.$on('query', (e: any) => {
    logger.debug('Prisma Query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Prisma Error:', e.message);
});

// Store in global for hot reloading
if (config.app.isDevelopment) {
  globalThis.prisma = prisma;
}

/**
 * Database connection health check
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

/**
 * Graceful database disconnect
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

/**
 * Execute transaction with retry logic
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation errors
      if (error instanceof Error && error.name === 'PrismaClientValidationError') {
        throw error;
      }

      if (attempt < maxRetries) {
        logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, {
          error: lastError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
};

/**
 * Database metrics
 */
export const getDatabaseMetrics = async () => {
  try {
    // Get connection pool info
    const poolInfo = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    return {
      status: 'healthy',
      pool: poolInfo[0] || { total_connections: 0, active_connections: 0, idle_connections: 0 },
    };
  } catch (error) {
    logger.error('Failed to get database metrics:', error);
    return {
      status: 'unhealthy',
      error: (error as Error).message,
    };
  }
};

export { prisma };
