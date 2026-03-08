/**
 * MindMate AI Notification Service - Notification Job Processor
 */

import { Job } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  INotificationJobData,
  NotificationChannel,
  NotificationStatus,
  INotificationResult,
} from '../types';
import { NotificationLog } from '../models';
import {
  sendPushToUser,
  sendSMSToUser,
  updateNotificationCount,
  shouldSendNotification,
} from '../services';
import { getPushQueue, getSMSQueue, getEmailQueue } from '../queues';

// ============================================
// Process Notification Job
// ============================================

export async function processNotificationJob(
  job: Job<INotificationJobData>
): Promise<INotificationResult[]> {
  const data = job.data;
  const results: INotificationResult[] = [];

  logger.info('Processing notification job', {
    jobId: job.id,
    userId: data.userId,
    type: data.type,
    channel: data.channel,
  });

  // Check preferences before sending
  const preferenceCheck = await shouldSendNotification(
    data.userId,
    data.channel,
    data.type,
    data.priority
  );

  if (!preferenceCheck.allowed) {
    logger.info('Notification suppressed by preferences', {
      jobId: job.id,
      userId: data.userId,
      reason: preferenceCheck.reason,
    });

    // Log suppressed notification
    await logNotification(data, NotificationStatus.SUPPRESSED, preferenceCheck.reason);

    // Try alternative channel if available
    if (preferenceCheck.alternativeChannel) {
      logger.info('Trying alternative channel', {
        jobId: job.id,
        alternativeChannel: preferenceCheck.alternativeChannel,
      });

      const altData = { ...data, channel: preferenceCheck.alternativeChannel };
      const altResult = await sendViaChannel(altData);
      results.push(altResult);
    }

    return results;
  }

  // Send via the specified channel
  const result = await sendViaChannel(data);
  results.push(result);

  // Update notification count if successful
  if (result.success) {
    await updateNotificationCount(data.userId, data.channel);
  }

  // Log the notification
  await logNotification(
    data,
    result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
    result.error
  );

  return results;
}

// ============================================
// Send Via Specific Channel
// ============================================

async function sendViaChannel(
  data: INotificationJobData
): Promise<INotificationResult> {
  switch (data.channel) {
    case NotificationChannel.PUSH:
    case NotificationChannel.WEB_PUSH:
      return sendPushToUser(data);

    case NotificationChannel.SMS:
      return sendSMSToUser(data);

    case NotificationChannel.EMAIL:
      // Email would be handled by a separate email service
      return {
        success: false,
        error: 'Email channel not implemented',
        timestamp: new Date(),
      };

    case NotificationChannel.IN_APP:
      // In-app notifications are stored in the database
      return {
        success: true,
        timestamp: new Date(),
      };

    default:
      return {
        success: false,
        error: `Unknown channel: ${data.channel}`,
        timestamp: new Date(),
      };
  }
}

// ============================================
// Log Notification
// ============================================

async function logNotification(
  data: INotificationJobData,
  status: NotificationStatus,
  errorMessage?: string
): Promise<void> {
  try {
    const log = new NotificationLog({
      id: uuidv4(),
      userId: data.userId,
      type: data.type,
      channel: data.channel,
      status,
      title: data.title,
      body: data.body,
      sentAt: status === NotificationStatus.SENT ? new Date() : undefined,
      errorMessage,
      metadata: {
        priority: data.priority,
        data: data.data,
        scheduledAt: data.scheduledAt,
      },
    });

    await log.save();
  } catch (error) {
    logger.error('Failed to log notification', {
      error: (error as Error).message,
      userId: data.userId,
    });
  }
}

// ============================================
// Process Push Job
// ============================================

export async function processPushJob(
  job: Job<INotificationJobData>
): Promise<INotificationResult> {
  const data = job.data;

  logger.info('Processing push job', {
    jobId: job.id,
    userId: data.userId,
    type: data.type,
  });

  const result = await sendPushToUser(data);

  if (result.success) {
    await updateNotificationCount(data.userId, NotificationChannel.PUSH);
    await logNotification(data, NotificationStatus.SENT);
  } else {
    await logNotification(data, NotificationStatus.FAILED, result.error);
  }

  return result;
}

// ============================================
// Process SMS Job
// ============================================

export async function processSMSJob(
  job: Job<INotificationJobData>
): Promise<INotificationResult> {
  const data = job.data;

  logger.info('Processing SMS job', {
    jobId: job.id,
    userId: data.userId,
    type: data.type,
  });

  const result = await sendSMSToUser(data);

  if (result.success) {
    await updateNotificationCount(data.userId, NotificationChannel.SMS);
    await logNotification(data, NotificationStatus.SENT);
  } else {
    await logNotification(data, NotificationStatus.FAILED, result.error);
  }

  return result;
}

// ============================================
// Process Email Job
// ============================================

export async function processEmailJob(
  job: Job<INotificationJobData>
): Promise<INotificationResult> {
  const data = job.data;

  logger.info('Processing email job', {
    jobId: job.id,
    userId: data.userId,
    type: data.type,
  });

  // Email sending would be implemented here
  // For now, just log it
  await logNotification(
    data,
    NotificationStatus.FAILED,
    'Email channel not implemented'
  );

  return {
    success: false,
    error: 'Email channel not implemented',
    timestamp: new Date(),
  };
}

// ============================================
// Route to Channel Queue
// ============================================

export async function routeToChannelQueue(
  data: INotificationJobData,
  delay?: number
): Promise<void> {
  switch (data.channel) {
    case NotificationChannel.PUSH:
    case NotificationChannel.WEB_PUSH:
      await getPushQueue().add(JOB_NAMES.SEND_PUSH, data, { delay });
      break;

    case NotificationChannel.SMS:
      await getSMSQueue().add(JOB_NAMES.SEND_SMS, data, { delay });
      break;

    case NotificationChannel.EMAIL:
      await getEmailQueue().add(JOB_NAMES.SEND_EMAIL, data, { delay });
      break;

    default:
      logger.warn('Unknown channel for routing', { channel: data.channel });
  }
}

// ============================================
// Export Job Names
// ============================================

export const JOB_NAMES = {
  SEND_NOTIFICATION: 'send-notification',
  SEND_PUSH: 'send-push',
  SEND_SMS: 'send-sms',
  SEND_EMAIL: 'send-email',
} as const;
