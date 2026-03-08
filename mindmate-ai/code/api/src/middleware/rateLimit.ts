/**
 * Rate Limiting Middleware
 * Tiered rate limiting based on user authentication and subscription level
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { RateLimitError } from './errorHandler';

// Rate limit key generator
const keyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP
  const identifier = (req as any).user?.id || req.ip || 'unknown';
  return `ratelimit:${identifier}`;
};

// Custom rate limiter using Redis
class RedisRateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async isAllowed(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const redisKey = `ratelimit:${key}`;

    try {
      // Use Redis sorted set for sliding window
      // Remove old entries
      await redis.zremrangebyscore(redisKey, 0, windowStart);

      // Count current requests
      const currentCount = await redis.zcard(redisKey);

      if (currentCount >= this.maxRequests) {
        // Get the oldest entry to calculate reset time
        const oldestEntries = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
        const oldestTimestamp = parseInt(oldestEntries[1] || '0', 10);
        const resetTime = oldestTimestamp + this.windowMs;

        return {
          allowed: false,
          remaining: 0,
          resetTime,
        };
      }

      // Add current request
      await redis.zadd(redisKey, now, `${now}-${Math.random()}`);
      await redis.pexpire(redisKey, this.windowMs);

      return {
        allowed: true,
        remaining: this.maxRequests - currentCount - 1,
        resetTime: now + this.windowMs,
      };
    } catch (error) {
      logger.error('Redis rate limiter error:', error);
      // Allow request if Redis fails
      return {
        allowed: true,
        remaining: 1,
        resetTime: now + this.windowMs,
      };
    }
  }
}

// Rate limit configurations
const rateLimitConfigs = {
  anonymous: {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.anonymous,
  },
  authenticated: {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authenticated,
  },
  premium: {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.premium,
  },
  admin: {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.admin,
  },
};

// Create Redis rate limiters
const limiters = {
  anonymous: new RedisRateLimiter(
    rateLimitConfigs.anonymous.windowMs,
    rateLimitConfigs.anonymous.max
  ),
  authenticated: new RedisRateLimiter(
    rateLimitConfigs.authenticated.windowMs,
    rateLimitConfigs.authenticated.max
  ),
  premium: new RedisRateLimiter(
    rateLimitConfigs.premium.windowMs,
    rateLimitConfigs.premium.max
  ),
  admin: new RedisRateLimiter(
    rateLimitConfigs.admin.windowMs,
    rateLimitConfigs.admin.max
  ),
};

/**
 * Get rate limiter based on user tier
 */
const getLimiterForUser = (req: Request): RedisRateLimiter => {
  const user = (req as any).user;

  if (!user) {
    return limiters.anonymous;
  }

  if (user.role === 'admin') {
    return limiters.admin;
  }

  if (user.subscriptionTier === 'premium' || user.subscriptionTier === 'enterprise') {
    return limiters.premium;
  }

  return limiters.authenticated;
};

/**
 * Dynamic rate limiting middleware
 */
export const dynamicRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const limiter = getLimiterForUser(req);
  const key = keyGenerator(req);

  const result = await limiter.isAllowed(key);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter);
    
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      user_id: (req as any).user?.id,
      path: req.path,
    });

    next(new RateLimitError('Too many requests, please try again later', retryAfter));
    return;
  }

  next();
};

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many attempts, please try again later',
      code: 429,
      retry_after: 900,
    });
  },
});

/**
 * Login rate limiter
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    // Use email from body or IP
    return req.body?.email || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
    });
    
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many login attempts, please try again later',
      code: 429,
      retry_after: 900,
    });
  },
});

/**
 * Registration rate limiter
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
    });
    
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many registration attempts, please try again later',
      code: 429,
      retry_after: 3600,
    });
  },
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.body?.email || req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
    });
    
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many password reset attempts, please try again later',
      code: 429,
      retry_after: 3600,
    });
  },
});

/**
 * API key rate limiter
 */
export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute for API keys
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.headers['x-api-key'] as string || req.ip || 'unknown';
  },
});

/**
 * Webhook rate limiter
 */
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhook requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use webhook ID or IP
    return req.params?.webhookId || req.ip || 'unknown';
  },
});

/**
 * Export rate limit middleware factory
 */
export const rateLimitMiddleware = {
  dynamic: dynamicRateLimit,
  strict: strictRateLimit,
  login: loginRateLimit,
  register: registerRateLimit,
  passwordReset: passwordResetRateLimit,
  apiKey: apiKeyRateLimit,
  webhook: webhookRateLimit,
};

export default rateLimitMiddleware;
