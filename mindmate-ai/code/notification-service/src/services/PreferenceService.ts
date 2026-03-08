/**
 * MindMate AI Notification Service - Preference Service
 * Enforces notification preferences: quiet hours, frequency caps, channel preferences
 */

import { config } from '../config';
import { logger } from '../utils/logger';
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  IUser,
} from '../types';
import { isInQuietHours, getCurrentTimeInTimezone } from '../utils/time';
import { getNotificationCount, trackNotification } from '../utils/redis';
import { User } from '../models';

// ============================================
// Types
// ============================================

export interface PreferenceCheckResult {
  allowed: boolean;
  reason?: string;
  suppressed?: boolean;
  alternativeChannel?: NotificationChannel;
}

export interface ChannelPreference {
  channel: NotificationChannel;
  enabled: boolean;
  dailyLimit: number;
  currentCount: number;
}

// ============================================
// Check if Notification is Allowed
// ============================================

export async function checkNotificationAllowed(
  user: IUser,
  channel: NotificationChannel,
  type: NotificationType,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<PreferenceCheckResult> {
  // Critical notifications bypass most checks
  if (priority === NotificationPriority.CRITICAL) {
    return { allowed: true };
  }

  // Check if channel is enabled for user
  const channelEnabled = await checkChannelEnabled(user, channel, type);
  if (!channelEnabled.allowed) {
    // Try to find an alternative channel
    const alternative = await findAlternativeChannel(user, type, priority);
    if (alternative) {
      return {
        allowed: false,
        reason: channelEnabled.reason,
        alternativeChannel: alternative,
      };
    }
    return channelEnabled;
  }

  // Check quiet hours
  const quietHoursCheck = checkQuietHours(user, priority);
  if (!quietHoursCheck.allowed) {
    return quietHoursCheck;
  }

  // Check frequency caps
  const frequencyCheck = await checkFrequencyCap(user, channel);
  if (!frequencyCheck.allowed) {
    return frequencyCheck;
  }

  // Check notification type preference
  const typeCheck = checkNotificationTypeEnabled(user, type);
  if (!typeCheck.allowed) {
    return typeCheck;
  }

  return { allowed: true };
}

// ============================================
// Check Channel Enabled
// ============================================

async function checkChannelEnabled(
  user: IUser,
  channel: NotificationChannel,
  type: NotificationType
): Promise<PreferenceCheckResult> {
  const prefs = user.preferences.notifications;

  switch (channel) {
    case NotificationChannel.PUSH:
    case NotificationChannel.WEB_PUSH:
      if (!prefs.pushEnabled && !prefs.webPushEnabled) {
        return {
          allowed: false,
          reason: 'Push notifications disabled',
          suppressed: true,
        };
      }
      break;

    case NotificationChannel.SMS:
      if (!prefs.smsEnabled) {
        return {
          allowed: false,
          reason: 'SMS notifications disabled',
          suppressed: true,
        };
      }
      // Also check if user has phone number
      if (!user.phoneNumber) {
        return {
          allowed: false,
          reason: 'No phone number on file',
          suppressed: true,
        };
      }
      break;

    case NotificationChannel.EMAIL:
      if (!prefs.emailEnabled) {
        return {
          allowed: false,
          reason: 'Email notifications disabled',
          suppressed: true,
        };
      }
      break;

    case NotificationChannel.IN_APP:
      if (!prefs.inAppEnabled) {
        return {
          allowed: false,
          reason: 'In-app notifications disabled',
          suppressed: true,
        };
      }
      break;
  }

  // Check marketing preference for marketing notifications
  if (type === NotificationType.MARKETING && !prefs.marketingEnabled) {
    return {
      allowed: false,
      reason: 'Marketing notifications disabled',
      suppressed: true,
    };
  }

  return { allowed: true };
}

// ============================================
// Check Quiet Hours
// ============================================

function checkQuietHours(
  user: IUser,
  priority: NotificationPriority
): PreferenceCheckResult {
  const quietHours = user.preferences.quietHours;

  if (!quietHours.enabled) {
    return { allowed: true };
  }

  const inQuietHours = isInQuietHours(
    {
      enabled: quietHours.enabled,
      startTime: quietHours.startTime,
      endTime: quietHours.endTime,
      timezone: quietHours.timezone || user.timezone,
      allowCritical: quietHours.allowCritical,
    },
    priority
  );

  if (inQuietHours) {
    return {
      allowed: false,
      reason: 'In quiet hours',
      suppressed: true,
    };
  }

  return { allowed: true };
}

// ============================================
// Check Frequency Cap
// ============================================

async function checkFrequencyCap(
  user: IUser,
  channel: NotificationChannel
): Promise<PreferenceCheckResult> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get count from Redis (real-time tracking)
  const redisCount = await getNotificationCount(user.id, channel, today);
  
  // Get count from user document (as fallback)
  let count = redisCount;
  if (count === 0) {
    switch (channel) {
      case NotificationChannel.PUSH:
      case NotificationChannel.WEB_PUSH:
        count = user.notificationHistory.pushCountToday;
        break;
      case NotificationChannel.SMS:
        count = user.notificationHistory.smsCountToday;
        break;
      case NotificationChannel.EMAIL:
        count = user.notificationHistory.emailCountToday;
        break;
    }
  }

  // Determine limit based on channel
  let limit: number;
  switch (channel) {
    case NotificationChannel.PUSH:
    case NotificationChannel.WEB_PUSH:
      limit = config.limits.maxPushPerDay;
      break;
    case NotificationChannel.SMS:
      limit = config.limits.maxSmsPerDay;
      break;
    case NotificationChannel.EMAIL:
      limit = config.limits.maxEmailPerDay;
      break;
    default:
      limit = Infinity;
  }

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Daily ${channel} limit reached (${count}/${limit})`,
      suppressed: true,
    };
  }

  return { allowed: true };
}

// ============================================
// Check Notification Type Enabled
// ============================================

function checkNotificationTypeEnabled(
  user: IUser,
  type: NotificationType
): PreferenceCheckResult {
  const prefs = user.preferences.notifications;

  switch (type) {
    case NotificationType.CHECKIN:
      if (!prefs.checkInNotifications) {
        return {
          allowed: false,
          reason: 'Check-in notifications disabled',
          suppressed: true,
        };
      }
      break;

    case NotificationType.CHALLENGE:
      if (!prefs.challengeNotifications) {
        return {
          allowed: false,
          reason: 'Challenge notifications disabled',
          suppressed: true,
        };
      }
      break;

    case NotificationType.REMINDER:
      if (!prefs.reminderNotifications) {
        return {
          allowed: false,
          reason: 'Reminder notifications disabled',
          suppressed: true,
        };
      }
      break;

    case NotificationType.ACHIEVEMENT:
      if (!prefs.achievementNotifications) {
        return {
          allowed: false,
          reason: 'Achievement notifications disabled',
          suppressed: true,
        };
      }
      break;

    case NotificationType.INSIGHT:
      if (!prefs.insightNotifications) {
        return {
          allowed: false,
          reason: 'Insight notifications disabled',
          suppressed: true,
        };
      }
      break;
  }

  return { allowed: true };
}

// ============================================
// Find Alternative Channel
// ============================================

async function findAlternativeChannel(
  user: IUser,
  type: NotificationType,
  priority: NotificationPriority
): Promise<NotificationChannel | undefined> {
  const prefs = user.preferences.notifications;
  const preferredChannels = user.preferences.preferredChannels || [];

  // Order of preference for fallback
  const fallbackOrder: NotificationChannel[] = [
    NotificationChannel.PUSH,
    NotificationChannel.WEB_PUSH,
    NotificationChannel.IN_APP,
    NotificationChannel.EMAIL,
    NotificationChannel.SMS,
  ];

  // Prioritize user's preferred channels
  const channelsToTry = [
    ...preferredChannels,
    ...fallbackOrder.filter(ch => !preferredChannels.includes(ch)),
  ];

  for (const channel of channelsToTry) {
    const check = await checkNotificationAllowed(user, channel, type, priority);
    if (check.allowed) {
      return channel;
    }
  }

  return undefined;
}

// ============================================
// Get User Channel Preferences
// ============================================

export async function getUserChannelPreferences(
  user: IUser
): Promise<ChannelPreference[]> {
  const today = new Date().toISOString().split('T')[0];
  const prefs = user.preferences.notifications;

  return [
    {
      channel: NotificationChannel.PUSH,
      enabled: prefs.pushEnabled,
      dailyLimit: config.limits.maxPushPerDay,
      currentCount: user.notificationHistory.pushCountToday,
    },
    {
      channel: NotificationChannel.SMS,
      enabled: prefs.smsEnabled,
      dailyLimit: config.limits.maxSmsPerDay,
      currentCount: user.notificationHistory.smsCountToday,
    },
    {
      channel: NotificationChannel.EMAIL,
      enabled: prefs.emailEnabled,
      dailyLimit: config.limits.maxEmailPerDay,
      currentCount: user.notificationHistory.emailCountToday,
    },
    {
      channel: NotificationChannel.IN_APP,
      enabled: prefs.inAppEnabled,
      dailyLimit: Infinity,
      currentCount: 0,
    },
  ];
}

// ============================================
// Update Notification Count
// ============================================

export async function updateNotificationCount(
  userId: string,
  channel: NotificationChannel
): Promise<void> {
  // Update Redis
  await trackNotification(userId, channel);

  // Update user document
  const user = await User.findOne({ id: userId });
  if (user) {
    await user.incrementNotificationCount(channel);
  }
}

// ============================================
// Get Optimal Send Time
// ============================================

export function getOptimalSendTime(
  user: IUser,
  preferredTime?: string
): Date {
  const timezone = user.timezone;
  const now = getCurrentTimeInTimezone(timezone);
  const quietHours = user.preferences.quietHours;

  // If preferred time is provided, use it
  if (preferredTime) {
    const [hours, minutes] = preferredTime.split(':').map(Number);
    let sendTime = now.clone().hours(hours).minutes(minutes).seconds(0);

    // If time has passed today, schedule for tomorrow
    if (sendTime.isSameOrBefore(now)) {
      sendTime = sendTime.add(1, 'day');
    }

    // Check if send time is in quiet hours
    if (quietHours.enabled) {
      const [quietStartHour, quietStartMinute] = quietHours.startTime.split(':').map(Number);
      const [quietEndHour, quietEndMinute] = quietHours.endTime.split(':').map(Number);
      const sendHour = sendTime.hour();
      const sendMinute = sendTime.minute();

      const sendTimeMinutes = sendHour * 60 + sendMinute;
      const quietStartMinutes = quietStartHour * 60 + quietStartMinute;
      const quietEndMinutes = quietEndHour * 60 + quietEndMinute;

      // If send time is in quiet hours, adjust to after quiet hours
      if (quietStartMinutes > quietEndMinutes) {
        // Overnight quiet hours
        if (sendTimeMinutes >= quietStartMinutes || sendTimeMinutes < quietEndMinutes) {
          sendTime = sendTime.hours(quietEndHour).minutes(quietEndMinute);
        }
      } else {
        // Same-day quiet hours
        if (sendTimeMinutes >= quietStartMinutes && sendTimeMinutes < quietEndMinutes) {
          sendTime = sendTime.hours(quietEndHour).minutes(quietEndMinute);
        }
      }
    }

    return sendTime.toDate();
  }

  // Default: schedule for 1 hour from now, avoiding quiet hours
  let optimalTime = now.clone().add(1, 'hour');

  if (quietHours.enabled) {
    const [quietStartHour] = quietHours.startTime.split(':').map(Number);
    const [quietEndHour] = quietHours.endTime.split(':').map(Number);
    const sendHour = optimalTime.hour();

    if (quietStartHour > quietEndHour) {
      // Overnight quiet hours
      if (sendHour >= quietStartHour || sendHour < quietEndHour) {
        optimalTime = optimalTime.hours(quietEndHour).minutes(0);
      }
    } else {
      // Same-day quiet hours
      if (sendHour >= quietStartHour && sendHour < quietEndHour) {
        optimalTime = optimalTime.hours(quietEndHour).minutes(0);
      }
    }
  }

  return optimalTime.toDate();
}

// ============================================
// Should Send Notification
// ============================================

export async function shouldSendNotification(
  userId: string,
  channel: NotificationChannel,
  type: NotificationType,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<PreferenceCheckResult> {
  const user = await User.findOne({ id: userId });

  if (!user) {
    return {
      allowed: false,
      reason: 'User not found',
    };
  }

  return checkNotificationAllowed(user, channel, type, priority);
}

// ============================================
// Batch Preference Check
// ============================================

export async function batchCheckPreferences(
  userIds: string[],
  channel: NotificationChannel,
  type: NotificationType,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<Map<string, PreferenceCheckResult>> {
  const results = new Map<string, PreferenceCheckResult>();

  const users = await User.find({ id: { $in: userIds } });
  const userMap = new Map(users.map(u => [u.id, u]));

  for (const userId of userIds) {
    const user = userMap.get(userId);
    if (!user) {
      results.set(userId, { allowed: false, reason: 'User not found' });
      continue;
    }

    const check = await checkNotificationAllowed(user, channel, type, priority);
    results.set(userId, check);
  }

  return results;
}

// ============================================
// Preference Summary
// ============================================

export async function getPreferenceSummary(
  userId: string
): Promise<{
  userId: string;
  channels: ChannelPreference[];
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    inQuietHours: boolean;
  };
  notificationTypes: Record<string, boolean>;
} | null> {
  const user = await User.findOne({ id: userId });

  if (!user) {
    return null;
  }

  const channels = await getUserChannelPreferences(user);
  const quietHours = user.preferences.quietHours;
  const prefs = user.preferences.notifications;

  return {
    userId,
    channels,
    quietHours: {
      enabled: quietHours.enabled,
      startTime: quietHours.startTime,
      endTime: quietHours.endTime,
      inQuietHours: isInQuietHours(
        {
          enabled: quietHours.enabled,
          startTime: quietHours.startTime,
          endTime: quietHours.endTime,
          timezone: quietHours.timezone || user.timezone,
          allowCritical: quietHours.allowCritical,
        },
        undefined
      ),
    },
    notificationTypes: {
      checkIn: prefs.checkInNotifications,
      challenge: prefs.challengeNotifications,
      reminder: prefs.reminderNotifications,
      achievement: prefs.achievementNotifications,
      insight: prefs.insightNotifications,
      marketing: prefs.marketingEnabled,
    },
  };
}
