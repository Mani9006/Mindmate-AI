/**
 * MindMate AI Notification Service - Configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables
dotenv.config();

// ============================================
// Configuration Schema Validation
// ============================================

const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().default(3003),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Redis
  redis: z.object({
    url: z.string().optional(),
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
  }),

  // MongoDB
  mongodb: z.object({
    uri: z.string().default('mongodb://localhost:27017/mindmate_notifications'),
  }),

  // Firebase
  firebase: z.object({
    projectId: z.string(),
    privateKey: z.string(),
    clientEmail: z.string(),
    databaseUrl: z.string().optional(),
  }),

  // APNs
  apns: z.object({
    keyId: z.string(),
    teamId: z.string(),
    bundleId: z.string(),
    production: z.boolean().default(false),
    keyPath: z.string(),
  }),

  // Web Push
  webPush: z.object({
    vapidPublicKey: z.string(),
    vapidPrivateKey: z.string(),
    subject: z.string().default('mailto:support@mindmate.ai'),
  }),

  // Twilio
  twilio: z.object({
    accountSid: z.string(),
    authToken: z.string(),
    phoneNumber: z.string(),
    messagingServiceSid: z.string().optional(),
  }),

  // Queue
  queue: z.object({
    prefix: z.string().default('mindmate'),
    concurrency: z.number().default(5),
    attempts: z.number().default(3),
    backoff: z.object({
      type: z.enum(['fixed', 'exponential']).default('exponential'),
      delay: z.number().default(5000),
    }),
  }),

  // Scheduler
  scheduler: z.object({
    checkInSchedule: z.string().default('0 9 * * *'),
    challengeSchedule: z.string().default('0 8 * * 1'),
    timezoneDefault: z.string().default('America/New_York'),
  }),

  // Notification Limits
  limits: z.object({
    maxPushPerDay: z.number().default(10),
    maxSmsPerDay: z.number().default(3),
    maxEmailPerDay: z.number().default(5),
    quietHoursStart: z.number().default(22),
    quietHoursEnd: z.number().default(8),
  }),

  // Rate Limiting
  rateLimit: z.object({
    windowMs: z.number().default(60000),
    maxRequests: z.number().default(100),
  }),

  // Health Check
  healthCheck: z.object({
    interval: z.number().default(30000),
  }),
});

export type Config = z.infer<typeof configSchema>;

// ============================================
// Parse Configuration
// ============================================

function parseConfig(): Config {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    logLevel: process.env.LOG_LEVEL,

    redis: {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
    },

    mongodb: {
      uri: process.env.MONGODB_URI,
    },

    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      databaseUrl: process.env.FIREBASE_DATABASE_URL,
    },

    apns: {
      keyId: process.env.APNS_KEY_ID,
      teamId: process.env.APNS_TEAM_ID,
      bundleId: process.env.APNS_BUNDLE_ID,
      production: process.env.APNS_PRODUCTION === 'true',
      keyPath: process.env.APNS_KEY_PATH,
    },

    webPush: {
      vapidPublicKey: process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
      subject: process.env.WEB_PUSH_SUBJECT,
    },

    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    },

    queue: {
      prefix: process.env.QUEUE_PREFIX,
      concurrency: process.env.QUEUE_CONCURRENCY ? parseInt(process.env.QUEUE_CONCURRENCY, 10) : undefined,
      attempts: process.env.QUEUE_ATTEMPTS ? parseInt(process.env.QUEUE_ATTEMPTS, 10) : undefined,
      backoff: {
        type: process.env.QUEUE_BACKOFF_TYPE as 'fixed' | 'exponential' | undefined,
        delay: process.env.QUEUE_BACKOFF_DELAY ? parseInt(process.env.QUEUE_BACKOFF_DELAY, 10) : undefined,
      },
    },

    scheduler: {
      checkInSchedule: process.env.CHECKIN_SCHEDULE,
      challengeSchedule: process.env.CHALLENGE_SCHEDULE,
      timezoneDefault: process.env.TIMEZONE_DEFAULT,
    },

    limits: {
      maxPushPerDay: process.env.MAX_PUSH_PER_DAY ? parseInt(process.env.MAX_PUSH_PER_DAY, 10) : undefined,
      maxSmsPerDay: process.env.MAX_SMS_PER_DAY ? parseInt(process.env.MAX_SMS_PER_DAY, 10) : undefined,
      maxEmailPerDay: process.env.MAX_EMAIL_PER_DAY ? parseInt(process.env.MAX_EMAIL_PER_DAY, 10) : undefined,
      quietHoursStart: process.env.QUIET_HOURS_START ? parseInt(process.env.QUIET_HOURS_START, 10) : undefined,
      quietHoursEnd: process.env.QUIET_HOURS_END ? parseInt(process.env.QUIET_HOURS_END, 10) : undefined,
    },

    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : undefined,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : undefined,
    },

    healthCheck: {
      interval: process.env.HEALTH_CHECK_INTERVAL ? parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) : undefined,
    },
  };

  return configSchema.parse(rawConfig);
}

// ============================================
// Export Configuration
// ============================================

export const config = parseConfig();

// ============================================
// Queue Names
// ============================================

export const QUEUE_NAMES = {
  NOTIFICATIONS: `${config.queue.prefix}:notifications`,
  CHECKINS: `${config.queue.prefix}:checkins`,
  CHALLENGES: `${config.queue.prefix}:challenges`,
  PUSH: `${config.queue.prefix}:push`,
  SMS: `${config.queue.prefix}:sms`,
  EMAIL: `${config.queue.prefix}:email`,
  BATCH: `${config.queue.prefix}:batch`,
  SCHEDULED: `${config.queue.prefix}:scheduled`,
} as const;

// ============================================
// Job Names
// ============================================

export const JOB_NAMES = {
  SEND_NOTIFICATION: 'send-notification',
  SEND_PUSH: 'send-push',
  SEND_SMS: 'send-sms',
  SEND_EMAIL: 'send-email',
  SCHEDULE_CHECKIN: 'schedule-checkin',
  ASSIGN_CHALLENGE: 'assign-challenge',
  BATCH_NOTIFY: 'batch-notify',
  CLEANUP_OLD_JOBS: 'cleanup-old-jobs',
  RESET_DAILY_LIMITS: 'reset-daily-limits',
} as const;

// ============================================
// Notification Templates
// ============================================

export const NOTIFICATION_TEMPLATES = {
  CHECKIN: {
    MORNING: {
      title: 'Good morning! ☀️',
      body: 'Start your day with a quick check-in. How are you feeling?',
    },
    EVENING: {
      title: 'Evening reflection 🌙',
      body: 'Take a moment to reflect on your day before bed.',
    },
    CUSTOM: {
      title: 'Time for your check-in',
      body: 'Let\'s see how you\'re doing today.',
    },
  },
  CHALLENGE: {
    NEW: {
      title: 'New Challenge Available! 🎯',
      body: 'A new challenge has been assigned to you. Ready to grow?',
    },
    REMINDER: {
      title: 'Challenge Reminder',
      body: 'Don\'t forget about your current challenge!',
    },
    COMPLETED: {
      title: 'Challenge Completed! 🎉',
      body: 'Great job completing your challenge!',
    },
  },
  STREAK: {
    MILESTONE: {
      title: 'Streak Milestone! 🔥',
      body: 'You\'ve hit a {{streak}} day streak! Keep it up!',
    },
    AT_RISK: {
      title: 'Streak at Risk ⚠️',
      body: 'Don\'t lose your {{streak}} day streak! Check in today.',
    },
  },
  ACHIEVEMENT: {
    UNLOCKED: {
      title: 'Achievement Unlocked! 🏆',
      body: 'Congratulations! You\'ve earned: {{achievementName}}',
    },
  },
} as const;

// ============================================
// Helper Functions
// ============================================

export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

export function isTest(): boolean {
  return config.nodeEnv === 'test';
}

export function getRedisUrl(): string {
  if (config.redis.url) {
    return config.redis.url;
  }
  const auth = config.redis.password ? `:${config.redis.password}@` : '';
  return `redis://${auth}${config.redis.host}:${config.redis.port}/${config.redis.db}`;
}
