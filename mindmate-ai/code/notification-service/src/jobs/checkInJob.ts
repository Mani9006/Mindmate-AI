/**
 * MindMate AI Notification Service - Check-in Job Processor
 * Handles daily check-in scheduling and personalization
 */

import { Job } from 'bull';
import moment from 'moment-timezone';
import { logger } from '../utils/logger';
import {
  ICheckInJobData,
  INotificationJobData,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../types';
import { User } from '../models';
import { NOTIFICATION_TEMPLATES, config } from '../config';
import { getNotificationQueue } from '../queues';
import { shouldSendNotification, getOptimalSendTime } from '../services';
import { getCurrentTimeInTimezone, shouldSendCheckIn } from '../utils/time';

// ============================================
// Process Check-in Job
// ============================================

export async function processCheckInJob(
  job: Job<ICheckInJobData>
): Promise<void> {
  const data = job.data;

  logger.info('Processing check-in job', {
    jobId: job.id,
    userId: data.userId,
    timezone: data.timezone,
    checkInType: data.checkInType,
  });

  // Get user
  const user = await User.findOne({ id: data.userId });

  if (!user) {
    logger.error('User not found for check-in', { userId: data.userId });
    throw new Error(`User not found: ${data.userId}`);
  }

  // Check if user already checked in today
  if (user.lastCheckIn) {
    const lastCheckIn = moment(user.lastCheckIn).tz(data.timezone);
    const today = getCurrentTimeInTimezone(data.timezone);

    if (lastCheckIn.isSame(today, 'day')) {
      logger.info('User already checked in today', { userId: data.userId });
      return;
    }
  }

  // Check preferences
  const preferenceCheck = await shouldSendNotification(
    data.userId,
    NotificationChannel.PUSH,
    NotificationType.CHECKIN
  );

  if (!preferenceCheck.allowed) {
    logger.info('Check-in notification suppressed', {
      userId: data.userId,
      reason: preferenceCheck.reason,
    });
    return;
  }

  // Generate personalized check-in message
  const message = generateCheckInMessage(data, user.streakCount);

  // Create notification job
  const notificationData: INotificationJobData = {
    userId: data.userId,
    type: NotificationType.CHECKIN,
    channel: preferenceCheck.alternativeChannel || NotificationChannel.PUSH,
    priority: NotificationPriority.NORMAL,
    title: message.title,
    body: message.body,
    data: {
      checkInType: data.checkInType,
      streakCount: user.streakCount.toString(),
      action: 'open_checkin',
    },
  };

  // Add to notification queue
  await getNotificationQueue().add('send-notification', notificationData);

  logger.info('Check-in notification queued', {
    userId: data.userId,
    channel: notificationData.channel,
  });
}

// ============================================
// Generate Personalized Check-in Message
// ============================================

function generateCheckInMessage(
  data: ICheckInJobData,
  streakCount: number
): { title: string; body: string } {
  const templates = NOTIFICATION_TEMPLATES.CHECKIN;
  let template = templates.CUSTOM;

  // Select template based on check-in type
  switch (data.checkInType) {
    case 'morning':
      template = templates.MORNING;
      break;
    case 'evening':
      template = templates.EVENING;
      break;
  }

  // Personalize based on context
  let body = template.body;

  if (streakCount > 0) {
    if (streakCount >= 30) {
      body += ` You're on an incredible ${streakCount}-day streak! 🔥`;
    } else if (streakCount >= 7) {
      body += ` You're on a ${streakCount}-day streak! Keep it up! 💪`;
    } else if (streakCount >= 3) {
      body += ` ${streakCount} days in a row!`;
    }
  }

  // Add personalization based on context
  if (data.personalizationContext) {
    const { mood, recentActivity } = data.personalizationContext;

    if (mood === 'stressed' || mood === 'anxious') {
      body = 'Take a moment to breathe and check in with yourself. You\'ve got this. 💙';
    } else if (mood === 'happy' || mood === 'excited') {
      body = 'Great to see you in good spirits! Let\'s capture this moment. 😊';
    }

    if (recentActivity === 'missed_checkin') {
      body = 'We missed you yesterday! Let\'s get back on track today. 🌟';
    }
  }

  return {
    title: template.title,
    body,
  };
}

// ============================================
// Schedule Check-in for User
// ============================================

export async function scheduleCheckInForUser(
  userId: string,
  scheduledTime?: Date
): Promise<void> {
  const user = await User.findOne({ id: userId });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const timezone = user.timezone;
  const preferredTime = user.preferences.checkInTime;
  const checkInType = determineCheckInType(preferredTime, timezone);

  const jobData: ICheckInJobData = {
    userId,
    timezone,
    preferredTime,
    checkInType,
  };

  // Calculate delay
  let delay: number | undefined;
  if (scheduledTime) {
    delay = scheduledTime.getTime() - Date.now();
    if (delay < 0) {
      delay = 0; // Send immediately if time has passed
    }
  }

  await getNotificationQueue().add('schedule-checkin', jobData, {
    delay,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000,
    },
  });

  logger.info('Check-in scheduled', {
    userId,
    scheduledTime: scheduledTime || 'immediate',
    delay,
  });
}

// ============================================
// Determine Check-in Type
// ============================================

function determineCheckInType(
  preferredTime: string,
  timezone: string
): 'morning' | 'evening' | 'custom' {
  const [hours] = preferredTime.split(':').map(Number);

  if (hours >= 5 && hours < 12) {
    return 'morning';
  } else if (hours >= 17 && hours < 23) {
    return 'evening';
  }

  return 'custom';
}

// ============================================
// Schedule All Check-ins
// ============================================

export async function scheduleAllCheckIns(): Promise<{
  scheduled: number;
  errors: number;
}> {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  // Find users whose check-in time is now (within 5 minute window)
  const users = await User.find({
    'preferences.notifications.checkInNotifications': true,
    $or: [
      { 'preferences.checkInTime': currentTime },
      { 'preferences.checkInTime': `${currentHour.toString().padStart(2, '0')}:${(currentMinute - 1).toString().padStart(2, '0')}` },
      { 'preferences.checkInTime': `${currentHour.toString().padStart(2, '0')}:${(currentMinute - 2).toString().padStart(2, '0')}` },
      { 'preferences.checkInTime': `${currentHour.toString().padStart(2, '0')}:${(currentMinute - 3).toString().padStart(2, '0')}` },
      { 'preferences.checkInTime': `${currentHour.toString().padStart(2, '0')}:${(currentMinute - 4).toString().padStart(2, '0')}` },
      { 'preferences.checkInTime': `${currentHour.toString().padStart(2, '0')}:${(currentMinute - 5).toString().padStart(2, '0')}` },
    ],
  });

  let scheduled = 0;
  let errors = 0;

  for (const user of users) {
    try {
      // Check if user already checked in today in their timezone
      if (user.lastCheckIn) {
        const lastCheckIn = moment(user.lastCheckIn).tz(user.timezone);
        const today = getCurrentTimeInTimezone(user.timezone);

        if (lastCheckIn.isSame(today, 'day')) {
          continue; // Skip if already checked in
        }
      }

      await scheduleCheckInForUser(user.id);
      scheduled++;
    } catch (error) {
      logger.error('Failed to schedule check-in', {
        userId: user.id,
        error: (error as Error).message,
      });
      errors++;
    }
  }

  logger.info('Scheduled check-ins', { scheduled, errors, totalUsers: users.length });

  return { scheduled, errors };
}

// ============================================
// Get Check-in Status
// ============================================

export async function getCheckInStatus(
  userId: string
): Promise<{
  lastCheckIn?: Date;
  streakCount: number;
  checkedInToday: boolean;
  nextCheckInTime?: Date;
}> {
  const user = await User.findOne({ id: userId });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const timezone = user.timezone;
  const today = getCurrentTimeInTimezone(timezone);
  let checkedInToday = false;

  if (user.lastCheckIn) {
    const lastCheckIn = moment(user.lastCheckIn).tz(timezone);
    checkedInToday = lastCheckIn.isSame(today, 'day');
  }

  // Calculate next check-in time
  const [hours, minutes] = user.preferences.checkInTime.split(':').map(Number);
  let nextCheckIn = today.clone().hours(hours).minutes(minutes).seconds(0);

  if (nextCheckIn.isSameOrBefore(today)) {
    nextCheckIn = nextCheckIn.add(1, 'day');
  }

  return {
    lastCheckIn: user.lastCheckIn,
    streakCount: user.streakCount,
    checkedInToday,
    nextCheckInTime: nextCheckIn.toDate(),
  };
}

// ============================================
// Streak Recovery Check
// ============================================

export async function checkStreaksAtRisk(): Promise<
  Array<{
    userId: string;
    streakCount: number;
    hoursRemaining: number;
  }>
> {
  const atRiskUsers: Array<{
    userId: string;
    streakCount: number;
    hoursRemaining: number;
  }> = [];

  // Find users with active streaks who haven't checked in today
  const users = await User.find({
    streakCount: { $gt: 0 },
    $or: [
      { lastCheckIn: { $exists: false } },
      {
        lastCheckIn: {
          $lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // More than 24 hours ago
        },
      },
    ],
  });

  for (const user of users) {
    const timezone = user.timezone;
    const now = getCurrentTimeInTimezone(timezone);
    const [quietEndHour] = user.preferences.quietHours.endTime.split(':').map(Number);

    // Calculate hours until end of day
    const hoursRemaining = 24 - now.hour();

    // If less than 4 hours remain and streak is significant
    if (hoursRemaining <= 4 && user.streakCount >= 3) {
      atRiskUsers.push({
        userId: user.id,
        streakCount: user.streakCount,
        hoursRemaining,
      });
    }
  }

  return atRiskUsers;
}

// ============================================
// Send Streak At Risk Notification
// ============================================

export async function sendStreakAtRiskNotification(
  userId: string,
  streakCount: number
): Promise<void> {
  const notificationData: INotificationJobData = {
    userId,
    type: NotificationType.STREAK,
    channel: NotificationChannel.PUSH,
    priority: NotificationPriority.HIGH,
    title: 'Streak at Risk! ⚠️',
    body: `Don't lose your ${streakCount}-day streak! Check in today to keep it alive.`,
    data: {
      action: 'open_checkin',
      streakCount: streakCount.toString(),
    },
  };

  await getNotificationQueue().add('send-notification', notificationData);

  logger.info('Streak at risk notification sent', { userId, streakCount });
}
