/**
 * MindMate AI Notification Service - Redis Connection
 */

import Redis from 'ioredis';
import { config, getRedisUrl } from '../config';
import { logger } from './logger';

// ============================================
// Redis Client Instances
// ============================================

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

// ============================================
// Create Redis Client
// ============================================

export function createRedisClient(): Redis {
  const client = new Redis(getRedisUrl(), {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.debug('Redis client connecting...');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (error) => {
    logger.error('Redis client error', { error: error.message });
  });

  client.on('reconnecting', () => {
    logger.warn('Redis client reconnecting...');
  });

  client.on('end', () => {
    logger.warn('Redis client connection closed');
  });

  return client;
}

// ============================================
// Get Redis Client (Singleton)
// ============================================

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

// ============================================
// Get Redis Subscriber (Singleton)
// ============================================

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = createRedisClient();
  }
  return redisSubscriber;
}

// ============================================
// Connect Redis
// ============================================

export async function connectRedis(): Promise<Redis> {
  const client = getRedisClient();
  
  if (client.status === 'wait') {
    await client.connect();
    logger.info('Redis connected successfully');
  }
  
  return client;
}

// ============================================
// Disconnect Redis
// ============================================

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client disconnected');
  }
  
  if (redisSubscriber) {
    await redisSubscriber.quit();
    redisSubscriber = null;
    logger.info('Redis subscriber disconnected');
  }
}

// ============================================
// Health Check
// ============================================

export async function isRedisHealthy(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================
// Rate Limiting Helpers
// ============================================

export async function incrementCounter(
  key: string,
  windowSeconds: number
): Promise<number> {
  const client = getRedisClient();
  const multi = client.multi();
  
  multi.incr(key);
  multi.expire(key, windowSeconds);
  
  const results = await multi.exec();
  return (results?.[0]?.[1] as number) || 0;
}

export async function getCounter(key: string): Promise<number> {
  const client = getRedisClient();
  const value = await client.get(key);
  return parseInt(value || '0', 10);
}

export async function resetCounter(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

// ============================================
// Notification Tracking Helpers
// ============================================

export async function trackNotification(
  userId: string,
  channel: string,
  ttlSeconds: number = 86400
): Promise<void> {
  const client = getRedisClient();
  const key = `notifications:${userId}:${channel}:${new Date().toISOString().split('T')[0]}`;
  await client.incr(key);
  await client.expire(key, ttlSeconds);
}

export async function getNotificationCount(
  userId: string,
  channel: string,
  date: string
): Promise<number> {
  const client = getRedisClient();
  const key = `notifications:${userId}:${channel}:${date}`;
  const count = await client.get(key);
  return parseInt(count || '0', 10);
}

export async function resetDailyNotificationCounts(date: string): Promise<void> {
  const client = getRedisClient();
  const pattern = `notifications:*:${date}`;
  const keys = await client.keys(pattern);
  
  if (keys.length > 0) {
    await client.del(...keys);
    logger.info('Reset daily notification counts', { date, count: keys.length });
  }
}

// ============================================
// User Presence Helpers
// ============================================

export async function setUserOnline(
  userId: string,
  ttlSeconds: number = 300
): Promise<void> {
  const client = getRedisClient();
  await client.setex(`presence:${userId}`, ttlSeconds, 'online');
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const client = getRedisClient();
  const status = await client.get(`presence:${userId}`);
  return status === 'online';
}

// ============================================
// Scheduled Jobs Helpers
// ============================================

export async function scheduleJob(
  jobId: string,
  executeAt: Date,
  data: Record<string, any>
): Promise<void> {
  const client = getRedisClient();
  const timestamp = executeAt.getTime();
  await client.zadd('scheduled:jobs', timestamp, JSON.stringify({ jobId, data, executeAt }));
}

export async function getDueJobs(before: Date): Promise<Array<{ jobId: string; data: any }>> {
  const client = getRedisClient();
  const jobs = await client.zrangebyscore('scheduled:jobs', 0, before.getTime());
  return jobs.map(job => JSON.parse(job));
}

export async function removeScheduledJob(jobId: string): Promise<void> {
  const client = getRedisClient();
  const jobs = await client.zrange('scheduled:jobs', 0, -1);
  
  for (const job of jobs) {
    const parsed = JSON.parse(job);
    if (parsed.jobId === jobId) {
      await client.zrem('scheduled:jobs', job);
      break;
    }
  }
}
