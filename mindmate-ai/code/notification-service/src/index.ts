/**
 * MindMate AI Notification Service - Main API Server
 * Express server for notification management endpoints
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger, logStream } from './utils/logger';
import { connectDatabase } from './utils/database';
import { connectRedis, isRedisHealthy } from './utils/redis';
import { initializeQueues, getQueueStatus, closeQueues } from './queues';
import {
  initializeAllPushServices,
  initializeTwilio,
  checkPushServicesHealth,
  checkTwilioHealth,
  closePushServices,
} from './services';
import { isDatabaseHealthy } from './utils/database';
import { User, NotificationLog, Challenge } from './models';
import { v4 as uuidv4 } from 'uuid';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from './types';
import { getNotificationQueue } from './queues';

// ============================================
// Express App
// ============================================

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Health Check Endpoint
// ============================================

app.get('/health', async (req, res) => {
  const [redisHealth, dbHealth, pushHealth, twilioHealth] = await Promise.all([
    isRedisHealthy(),
    Promise.resolve(isDatabaseHealthy()),
    checkPushServicesHealth(),
    checkTwilioHealth(),
  ]);

  const queueStatus = await getQueueStatus();

  const isHealthy = redisHealth && dbHealth && pushHealth.fcm && pushHealth.apns;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisHealth,
      mongodb: dbHealth,
      fcm: pushHealth.fcm,
      apns: pushHealth.apns,
      webPush: pushHealth.webPush,
      twilio: twilioHealth,
    },
    queues: queueStatus,
  });
});

// ============================================
// Queue Status Endpoint
// ============================================

app.get('/api/queues/status', async (req, res) => {
  try {
    const status = await getQueueStatus();
    res.json(status);
  } catch (error) {
    logger.error('Failed to get queue status', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// ============================================
// Send Notification Endpoint
// ============================================

app.post('/api/notifications/send', async (req, res) => {
  try {
    const {
      userId,
      type,
      channel,
      title,
      body,
      data,
      priority = 'normal',
      scheduledAt,
    } = req.body;

    // Validate required fields
    if (!userId || !type || !channel || !title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, channel, title, body',
      });
    }

    // Validate channel
    if (!Object.values(NotificationChannel).includes(channel)) {
      return res.status(400).json({
        error: `Invalid channel. Must be one of: ${Object.values(NotificationChannel).join(', ')}`,
      });
    }

    // Validate type
    if (!Object.values(NotificationType).includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${Object.values(NotificationType).join(', ')}`,
      });
    }

    const notificationData = {
      userId,
      type: type as NotificationType,
      channel: channel as NotificationChannel,
      priority: priority as NotificationPriority,
      title,
      body,
      data,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    };

    const queue = getNotificationQueue();
    const jobOptions: any = {};

    if (scheduledAt) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      if (delay > 0) {
        jobOptions.delay = delay;
      }
    }

    const job = await queue.add('send-notification', notificationData, jobOptions);

    res.json({
      success: true,
      jobId: job.id,
      message: scheduledAt ? 'Notification scheduled' : 'Notification queued',
    });
  } catch (error) {
    logger.error('Failed to send notification', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ============================================
// Send Batch Notification Endpoint
// ============================================

app.post('/api/notifications/batch', async (req, res) => {
  try {
    const {
      userIds,
      type,
      channel,
      title,
      body,
      data,
      priority = 'normal',
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'userIds must be a non-empty array',
      });
    }

    const { getBatchQueue } = await import('./queues');
    const queue = getBatchQueue();

    const job = await queue.add('batch-notify', {
      userIds,
      notification: {
        type: type as NotificationType,
        channel: channel as NotificationChannel,
        priority: priority as NotificationPriority,
        title,
        body,
        data,
      },
      batchSize: 100,
      throttleMs: 50,
    });

    res.json({
      success: true,
      jobId: job.id,
      message: `Batch notification queued for ${userIds.length} users`,
    });
  } catch (error) {
    logger.error('Failed to send batch notification', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to send batch notification' });
  }
});

// ============================================
// Schedule Check-in Endpoint
// ============================================

app.post('/api/checkins/schedule', async (req, res) => {
  try {
    const { userId, scheduledTime } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { scheduleCheckInForUser } = await import('./jobs/checkInJob');
    await scheduleCheckInForUser(
      userId,
      scheduledTime ? new Date(scheduledTime) : undefined
    );

    res.json({
      success: true,
      message: 'Check-in scheduled',
    });
  } catch (error) {
    logger.error('Failed to schedule check-in', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to schedule check-in' });
  }
});

// ============================================
// Get Check-in Status Endpoint
// ============================================

app.get('/api/checkins/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { getCheckInStatus } = await import('./jobs/checkInJob');
    
    const status = await getCheckInStatus(userId);
    res.json(status);
  } catch (error) {
    logger.error('Failed to get check-in status', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get check-in status' });
  }
});

// ============================================
// Assign Challenge Endpoint
// ============================================

app.post('/api/challenges/assign', async (req, res) => {
  try {
    const { userId, challengeId, autoSelect = true } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { getChallengeQueue } = await import('./queues');
    const queue = getChallengeQueue();

    const job = await queue.add('assign-challenge', {
      userId,
      challengeId,
      autoSelect: autoSelect && !challengeId,
      reason: 'user_request',
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Challenge assignment queued',
    });
  } catch (error) {
    logger.error('Failed to assign challenge', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to assign challenge' });
  }
});

// ============================================
// Get User's Current Challenge Endpoint
// ============================================

app.get('/api/challenges/:userId/current', async (req, res) => {
  try {
    const { userId } = req.params;
    const { getUserCurrentChallenge } = await import('./jobs/challengeJob');
    
    const challenge = await getUserCurrentChallenge(userId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'No active challenge found' });
    }
    
    res.json(challenge);
  } catch (error) {
    logger.error('Failed to get current challenge', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get current challenge' });
  }
});

// ============================================
// Complete Challenge Endpoint
// ============================================

app.post('/api/challenges/complete', async (req, res) => {
  try {
    const { userId, challengeId } = req.body;

    if (!userId || !challengeId) {
      return res.status(400).json({ error: 'userId and challengeId are required' });
    }

    const { completeChallenge } = await import('./jobs/challengeJob');
    await completeChallenge(userId, challengeId);

    res.json({
      success: true,
      message: 'Challenge marked as complete',
    });
  } catch (error) {
    logger.error('Failed to complete challenge', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
});

// ============================================
// Get Notification History Endpoint
// ============================================

app.get('/api/notifications/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, status } = req.query;

    const history = await NotificationLog.findByUser(userId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      status: status as any,
    });

    res.json(history);
  } catch (error) {
    logger.error('Failed to get notification history', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

// ============================================
// Get User Preferences Endpoint
// ============================================

app.get('/api/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { getPreferenceSummary } = await import('./services/PreferenceService');
    
    const preferences = await getPreferenceSummary(userId);
    
    if (!preferences) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(preferences);
  } catch (error) {
    logger.error('Failed to get user preferences', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get user preferences' });
  }
});

// ============================================
// Update User Preferences Endpoint
// ============================================

app.patch('/api/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update preferences
    if (updates.pushEnabled !== undefined) {
      user.preferences.notifications.pushEnabled = updates.pushEnabled;
    }
    if (updates.smsEnabled !== undefined) {
      user.preferences.notifications.smsEnabled = updates.smsEnabled;
    }
    if (updates.emailEnabled !== undefined) {
      user.preferences.notifications.emailEnabled = updates.emailEnabled;
    }
    if (updates.quietHours) {
      Object.assign(user.preferences.quietHours, updates.quietHours);
    }
    if (updates.checkInTime) {
      user.preferences.checkInTime = updates.checkInTime;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: user.preferences,
    });
  } catch (error) {
    logger.error('Failed to update user preferences', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// ============================================
// Register Push Token Endpoint
// ============================================

app.post('/api/users/:userId/push-tokens', async (req, res) => {
  try {
    const { userId } = req.params;
    const { token, platform, deviceId } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ error: 'token and platform are required' });
    }

    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.addPushToken(token, platform, deviceId);

    res.json({
      success: true,
      message: 'Push token registered',
    });
  } catch (error) {
    logger.error('Failed to register push token', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// ============================================
// Unregister Push Token Endpoint
// ============================================

app.delete('/api/users/:userId/push-tokens/:token', async (req, res) => {
  try {
    const { userId, token } = req.params;

    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.invalidatePushToken(token);

    res.json({
      success: true,
      message: 'Push token unregistered',
    });
  } catch (error) {
    logger.error('Failed to unregister push token', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to unregister push token' });
  }
});

// ============================================
// Get Notification Stats Endpoint
// ============================================

app.get('/api/stats/notifications', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string, 10));

    const stats = await NotificationLog.getStats(startDate, new Date());

    res.json({
      period: `${days} days`,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get notification stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get notification stats' });
  }
});

// ============================================
// Error Handler
// ============================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Initialize and Start Server
// ============================================

async function initializeServer(): Promise<void> {
  logger.info('Initializing notification service API server...');

  try {
    // Connect to databases
    await connectRedis();
    await connectDatabase();

    // Initialize notification services
    initializeAllPushServices();
    initializeTwilio();

    // Initialize queues
    initializeQueues();

    logger.info('Server initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize server', { error: (error as Error).message });
    throw error;
  }
}

async function startServer(): Promise<void> {
  await initializeServer();

  const server = app.listen(config.port, () => {
    logger.info(`Notification service API server listening on port ${config.port}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    server.close(async () => {
      await closeQueues();
      await closePushServices();
      logger.info('Server shut down complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});

// Export for testing
export { app, initializeServer };
