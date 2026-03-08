/**
 * MindMate AI Notification Service - Batch Notification Job Processor
 * Handles bulk notifications with throttling and progress tracking
 */

import { Job } from 'bull';
import { logger } from '../utils/logger';
import {
  IBatchNotificationJobData,
  INotificationJobData,
  INotificationResult,
  IBatchResult,
} from '../types';
import { getNotificationQueue } from '../queues';
import { batchCheckPreferences } from '../services';

// ============================================
// Process Batch Notification Job
// ============================================

export async function processBatchNotificationJob(
  job: Job<IBatchNotificationJobData>
): Promise<IBatchResult> {
  const data = job.data;
  const { userIds, notification, batchSize = 100, throttleMs = 100 } = data;

  logger.info('Processing batch notification job', {
    jobId: job.id,
    totalUsers: userIds.length,
    batchSize,
    throttleMs,
    type: notification.type,
  });

  const result: IBatchResult = {
    total: userIds.length,
    successful: 0,
    failed: 0,
    suppressed: 0,
    results: [],
  };

  // Check preferences for all users in batch
  const preferenceChecks = await batchCheckPreferences(
    userIds,
    notification.channel,
    notification.type,
    notification.priority
  );

  // Process in batches
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(userIds.length / batchSize);

    logger.debug(`Processing batch ${batchNumber}/${totalBatches}`, {
      batchSize: batch.length,
    });

    // Process each user in the batch
    for (const userId of batch) {
      const preferenceCheck = preferenceChecks.get(userId);

      if (!preferenceCheck) {
        result.failed++;
        result.results.push({
          userId,
          success: false,
          error: 'Preference check failed',
        });
        continue;
      }

      if (!preferenceCheck.allowed) {
        result.suppressed++;
        result.results.push({
          userId,
          success: false,
          error: preferenceCheck.reason || 'Notification suppressed',
        });
        continue;
      }

      try {
        // Create individual notification job
        const notificationData: INotificationJobData = {
          userId,
          type: notification.type,
          channel: preferenceCheck.alternativeChannel || notification.channel,
          priority: notification.priority,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          imageUrl: notification.imageUrl,
          actionUrl: notification.actionUrl,
        };

        await getNotificationQueue().add('send-notification', notificationData);

        result.successful++;
        result.results.push({ userId, success: true });
      } catch (error) {
        result.failed++;
        result.results.push({
          userId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    // Update job progress
    const progress = Math.round(((i + batch.length) / userIds.length) * 100);
    await job.progress(progress);

    // Throttle between batches
    if (i + batchSize < userIds.length && throttleMs > 0) {
      await new Promise(resolve => setTimeout(resolve, throttleMs));
    }
  }

  logger.info('Batch notification job completed', {
    jobId: job.id,
    total: result.total,
    successful: result.successful,
    failed: result.failed,
    suppressed: result.suppressed,
  });

  return result;
}

// ============================================
// Send Announcement to All Users
// ============================================

export async function sendAnnouncement(
  title: string,
  body: string,
  options: {
    channels?: string[];
    priority?: string;
    data?: Record<string, any>;
    filter?: {
      minStreak?: number;
      maxStreak?: number;
      hasPhoneNumber?: boolean;
      timezone?: string;
    };
  } = {}
): Promise<IBatchResult> {
  const { User } = await import('../models');

  // Build filter query
  const query: any = {};

  if (options.filter) {
    if (options.filter.minStreak !== undefined) {
      query.streakCount = { $gte: options.filter.minStreak };
    }
    if (options.filter.maxStreak !== undefined) {
      query.streakCount = { ...query.streakCount, $lte: options.filter.maxStreak };
    }
    if (options.filter.hasPhoneNumber) {
      query.phoneNumber = { $exists: true, $ne: null };
    }
    if (options.filter.timezone) {
      query.timezone = options.filter.timezone;
    }
  }

  // Get users
  const users = await User.find(query).select('id');
  const userIds = users.map(u => u.id);

  logger.info('Sending announcement', {
    title,
    totalUsers: userIds.length,
  });

  // Create batch job
  const batchData: IBatchNotificationJobData = {
    userIds,
    notification: {
      type: 'system' as any,
      channel: 'push' as any,
      priority: (options.priority as any) || 'normal',
      title,
      body,
      data: options.data,
    },
    batchSize: 100,
    throttleMs: 50,
  };

  await getNotificationQueue().add('batch-notify', batchData);

  return {
    total: userIds.length,
    successful: userIds.length,
    failed: 0,
    suppressed: 0,
    results: userIds.map(id => ({ userId: id, success: true })),
  };
}

// ============================================
// Send Targeted Notification
// ============================================

export async function sendTargetedNotification(
  userIds: string[],
  title: string,
  body: string,
  options: {
    type?: string;
    channel?: string;
    priority?: string;
    data?: Record<string, any>;
  } = {}
): Promise<IBatchResult> {
  logger.info('Sending targeted notification', {
    title,
    userCount: userIds.length,
  });

  const batchData: IBatchNotificationJobData = {
    userIds,
    notification: {
      type: (options.type as any) || 'system',
      channel: (options.channel as any) || 'push',
      priority: (options.priority as any) || 'normal',
      title,
      body,
      data: options.data,
    },
    batchSize: 50,
    throttleMs: 100,
  };

  const job = await getNotificationQueue().add('batch-notify', batchData);

  // Wait for job to complete (for synchronous usage)
  const result = await job.finished();

  return result as IBatchResult;
}

// ============================================
// Send Streak Milestone Notifications
// ============================================

export async function sendStreakMilestoneNotifications(
  milestone: number
): Promise<IBatchResult> {
  const { User } = await import('../models');

  // Find users who just hit the milestone
  const users = await User.find({
    streakCount: milestone,
    'preferences.notifications.achievementNotifications': true,
  });

  const userIds = users.map(u => u.id);

  logger.info('Sending streak milestone notifications', {
    milestone,
    userCount: userIds.length,
  });

  const batchData: IBatchNotificationJobData = {
    userIds,
    notification: {
      type: 'streak' as any,
      channel: 'push' as any,
      priority: 'normal',
      title: `🔥 ${milestone} Day Streak!`,
      body: `Amazing! You've maintained your wellness streak for ${milestone} days. Keep up the great work!`,
      data: {
        milestone,
        action: 'view_streak',
      },
    },
    batchSize: 100,
    throttleMs: 50,
  };

  await getNotificationQueue().add('batch-notify', batchData);

  return {
    total: userIds.length,
    successful: userIds.length,
    failed: 0,
    suppressed: 0,
    results: userIds.map(id => ({ userId: id, success: true })),
  };
}

// ============================================
// Re-engage Inactive Users
// ============================================

export async function reengageInactiveUsers(
  daysInactive: number = 7
): Promise<IBatchResult> {
  const { User } = await import('../models');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  // Find users who haven't checked in
  const users = await User.find({
    $or: [
      { lastCheckIn: { $lt: cutoffDate } },
      { lastCheckIn: { $exists: false } },
    ],
    'preferences.notifications.checkInNotifications': true,
  });

  const userIds = users.map(u => u.id);

  logger.info('Re-engaging inactive users', {
    daysInactive,
    userCount: userIds.length,
  });

  const batchData: IBatchNotificationJobData = {
    userIds,
    notification: {
      type: 'reminder' as any,
      channel: 'push' as any,
      priority: 'low',
      title: 'We miss you! 💙',
      body: 'It\'s been a while since your last check-in. Take a moment for yourself today.',
      data: {
        action: 'open_checkin',
        reengagement: 'true',
      },
    },
    batchSize: 100,
    throttleMs: 100,
  };

  await getNotificationQueue().add('batch-notify', batchData);

  return {
    total: userIds.length,
    successful: userIds.length,
    failed: 0,
    suppressed: 0,
    results: userIds.map(id => ({ userId: id, success: true })),
  };
}
