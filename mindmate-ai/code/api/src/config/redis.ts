/**
 * Redis Client Configuration
 * Singleton pattern for Redis connection management
 */

import Redis, { RedisOptions } from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

// Parse Redis URL
const parseRedisUrl = (url: string): RedisOptions => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || config.redis.password || undefined,
      db: parseInt(parsed.pathname.slice(1), 10) || config.redis.db,
      keyPrefix: config.redis.keyPrefix,
    };
  } catch {
    // If URL parsing fails, use default options
    return {
      host: 'localhost',
      port: 6379,
      password: config.redis.password || undefined,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
    };
  }
};

// Redis client options
const redisOptions: RedisOptions = {
  ...parseRedisUrl(config.redis.url),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry attempt ${times}, delaying ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // TLS options for production
  ...(config.app.isProduction && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
};

// Create Redis client
const redisClient = new Redis(redisOptions);

// Event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (error: Error) => {
  logger.error('Redis client error:', error.message);
});

redisClient.on('close', () => {
  logger.warn('Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

redisClient.on('end', () => {
  logger.info('Redis client connection ended');
});

/**
 * Connect to Redis
 */
export const connectRedis = async (): Promise<void> => {
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
    throw error;
  }
};

/**
 * Redis health check
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

/**
 * Redis cache helpers
 */
export const redisCache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache
   */
  async set(
    key: string,
    value: unknown,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error('Redis delPattern error:', error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      logger.error('Redis increment error:', error);
      return 0;
    }
  },

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
    }
  },

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error);
      return -1;
    }
  },

  /**
   * Add to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    try {
      await redisClient.zadd(key, score, member);
    } catch (error) {
      logger.error('Redis zadd error:', error);
    }
  },

  /**
   * Get range from sorted set
   */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await redisClient.zrange(key, start, stop);
    } catch (error) {
      logger.error('Redis zrange error:', error);
      return [];
    }
  },

  /**
   * Get sorted set cardinality
   */
  async zcard(key: string): Promise<number> {
    try {
      return await redisClient.zcard(key);
    } catch (error) {
      logger.error('Redis zcard error:', error);
      return 0;
    }
  },

  /**
   * Add to list
   */
  async lpush(key: string, ...values: string[]): Promise<void> {
    try {
      await redisClient.lpush(key, ...values);
    } catch (error) {
      logger.error('Redis lpush error:', error);
    }
  },

  /**
   * Get list range
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await redisClient.lrange(key, start, stop);
    } catch (error) {
      logger.error('Redis lrange error:', error);
      return [];
    }
  },

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await redisClient.hset(key, field, value);
    } catch (error) {
      logger.error('Redis hset error:', error);
    }
  },

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await redisClient.hget(key, field);
    } catch (error) {
      logger.error('Redis hget error:', error);
      return null;
    }
  },

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await redisClient.hgetall(key);
    } catch (error) {
      logger.error('Redis hgetall error:', error);
      return {};
    }
  },

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await redisClient.publish(channel, message);
    } catch (error) {
      logger.error('Redis publish error:', error);
    }
  },

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<void> {
    try {
      await redisClient.flushall();
    } catch (error) {
      logger.error('Redis flushAll error:', error);
    }
  },
};

// Export the Redis client
export { redisClient as redis };
