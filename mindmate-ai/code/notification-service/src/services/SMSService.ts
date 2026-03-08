/**
 * MindMate AI Notification Service - SMS Service
 * Twilio integration for SMS notifications
 */

import twilio from 'twilio';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  INotificationJobData,
  ISMSPayload,
  INotificationResult,
  NotificationChannel,
} from '../types';
import { User } from '../models';

// ============================================
// Service State
// ============================================

let twilioClient: twilio.Twilio | null = null;

// ============================================
// Initialize Twilio
// ============================================

export function initializeTwilio(): twilio.Twilio {
  if (twilioClient) {
    return twilioClient;
  }

  try {
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    logger.info('Twilio client initialized successfully');
    return twilioClient;
  } catch (error) {
    logger.error('Failed to initialize Twilio', { error: (error as Error).message });
    throw error;
  }
}

// ============================================
// Send SMS
// ============================================

export async function sendSMS(
  payload: ISMSPayload
): Promise<INotificationResult> {
  const client = initializeTwilio();

  try {
    const messageOptions: twilio.messages.MessageListInstanceCreateOptions = {
      to: payload.to,
      body: payload.body,
    };

    // Use messaging service SID if available, otherwise use phone number
    if (config.twilio.messagingServiceSid) {
      messageOptions.messagingServiceSid = config.twilio.messagingServiceSid;
    } else {
      messageOptions.from = payload.from || config.twilio.phoneNumber;
    }

    // Add media URLs if provided
    if (payload.mediaUrls && payload.mediaUrls.length > 0) {
      messageOptions.mediaUrl = payload.mediaUrls;
    }

    // Add status callback if provided
    if (payload.statusCallback) {
      messageOptions.statusCallback = payload.statusCallback;
    }

    const message = await client.messages.create(messageOptions);

    logger.info('SMS sent successfully', {
      to: payload.to.replace(/\d(?=\d{4})/g, '*'),
      messageSid: message.sid,
      status: message.status,
    });

    return {
      success: true,
      messageId: message.sid,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    const twilioError = error as twilio.TwilioError;

    logger.error('SMS sending failed', {
      to: payload.to.replace(/\d(?=\d{4})/g, '*'),
      error: errorMessage,
      code: twilioError.code,
    });

    // Determine if error is retryable
    const retryableCodes = [20429, 20447, 20500, 20501, 20502]; // Rate limit, timeout errors
    const isRetryable = retryableCodes.includes(twilioError.code || 0);

    return {
      success: false,
      error: errorMessage,
      retryable: isRetryable,
      timestamp: new Date(),
    };
  }
}

// ============================================
// Send SMS to User
// ============================================

export async function sendSMSToUser(
  data: INotificationJobData
): Promise<INotificationResult> {
  const user = await User.findOne({ id: data.userId });

  if (!user) {
    logger.error('User not found for SMS', { userId: data.userId });
    return {
      success: false,
      error: 'User not found',
      timestamp: new Date(),
    };
  }

  if (!user.phoneNumber) {
    logger.warn('User has no phone number for SMS', { userId: data.userId });
    return {
      success: false,
      error: 'User has no phone number',
      timestamp: new Date(),
    };
  }

  // Check if user has SMS enabled
  if (!user.preferences.notifications.smsEnabled) {
    logger.info('SMS disabled for user', { userId: data.userId });
    return {
      success: false,
      error: 'SMS notifications disabled',
      timestamp: new Date(),
    };
  }

  const payload: ISMSPayload = {
    to: user.phoneNumber,
    body: `${data.title}\n\n${data.body}`,
  };

  return sendSMS(payload);
}

// ============================================
// Send Bulk SMS
// ============================================

export async function sendBulkSMS(
  payloads: ISMSPayload[],
  throttleMs: number = 100
): Promise<INotificationResult[]> {
  const results: INotificationResult[] = [];

  for (const payload of payloads) {
    const result = await sendSMS(payload);
    results.push(result);

    // Throttle to avoid rate limits
    if (throttleMs > 0) {
      await new Promise(resolve => setTimeout(resolve, throttleMs));
    }
  }

  return results;
}

// ============================================
// Phone Number Validation
// ============================================

export async function validatePhoneNumber(
  phoneNumber: string
): Promise<{
  valid: boolean;
  formatted?: string;
  error?: string;
}> {
  const client = initializeTwilio();

  try {
    const lookup = await client.lookups.v2.phoneNumbers(phoneNumber).fetch();

    return {
      valid: lookup.valid,
      formatted: lookup.phoneNumber,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;

    logger.error('Phone number validation failed', {
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      error: errorMessage,
    });

    return {
      valid: false,
      error: errorMessage,
    };
  }
}

// ============================================
// Format Phone Number
// ============================================

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Add +1 for US numbers if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // Add + if not present
  if (!phoneNumber.startsWith('+')) {
    return `+${cleaned}`;
  }

  return phoneNumber;
}

// ============================================
// SMS Templates
// ============================================

export const SMS_TEMPLATES = {
  CHECKIN: (streakCount: number) =>
    `MindMate Daily Check-in 🌟\n\n${streakCount > 1 ? `You're on a ${streakCount}-day streak! Keep it going! 🔥` : 'Take a moment to check in with yourself today.'}\n\nOpen the app to continue.`,

  CHALLENGE_ASSIGNED: (challengeTitle: string) =>
    `New Challenge: ${challengeTitle} 🎯\n\nA new challenge has been assigned to you. Open MindMate to get started!`,

  CHALLENGE_REMINDER: (challengeTitle: string, dayNumber: number) =>
    `Challenge Reminder 📅\n\nDay ${dayNumber} of "${challengeTitle}" is waiting for you. Don't break your streak!`,

  STREAK_AT_RISK: (streakCount: number) =>
    `⚠️ Streak Alert\n\nYour ${streakCount}-day streak is at risk! Check in today to keep it alive.`,

  STREAK_MILESTONE: (streakCount: number) =>
    `🎉 Milestone Reached!\n\nAmazing! You've hit a ${streakCount}-day streak. Keep up the great work!`,

  ACHIEVEMENT_UNLOCKED: (achievementName: string) =>
    `🏆 Achievement Unlocked!\n\nCongratulations! You've earned: ${achievementName}`,

  INSIGHT: (insightPreview: string) =>
    `MindMate Insight 💡\n\n${insightPreview.substring(0, 100)}${insightPreview.length > 100 ? '...' : ''}\n\nOpen the app to read more.`,

  WELCOME: (name: string) =>
    `Welcome to MindMate, ${name}! 🎉\n\nWe're excited to have you on your wellness journey. Your first challenge awaits!`,

  VERIFICATION_CODE: (code: string) =>
    `Your MindMate verification code is: ${code}\n\nThis code will expire in 10 minutes.`,
};

// ============================================
// Send Templated SMS
// ============================================

export async function sendTemplatedSMS(
  to: string,
  template: keyof typeof SMS_TEMPLATES,
  ...args: any[]
): Promise<INotificationResult> {
  const templateFn = SMS_TEMPLATES[template];
  const body = templateFn(...args);

  return sendSMS({ to, body });
}

// ============================================
// Delivery Status
// ============================================

export async function getMessageStatus(
  messageSid: string
): Promise<{
  status: string;
  errorCode?: string;
  errorMessage?: string;
  dateSent?: Date;
  dateDelivered?: Date;
}> {
  const client = initializeTwilio();

  try {
    const message = await client.messages(messageSid).fetch();

    return {
      status: message.status,
      errorCode: message.errorCode || undefined,
      errorMessage: message.errorMessage || undefined,
      dateSent: message.dateSent || undefined,
      dateDelivered: message.dateUpdated || undefined,
    };
  } catch (error) {
    logger.error('Failed to get message status', {
      messageSid,
      error: (error as Error).message,
    });

    throw error;
  }
}

// ============================================
// SMS Metrics
// ============================================

export async function getSMSMetrics(
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}> {
  const client = initializeTwilio();

  try {
    const messages = await client.messages.list({
      dateSentAfter: startDate,
      dateSentBefore: endDate,
    });

    const metrics = {
      total: messages.length,
      delivered: 0,
      failed: 0,
      pending: 0,
    };

    for (const message of messages) {
      switch (message.status) {
        case 'delivered':
        case 'read':
          metrics.delivered++;
          break;
        case 'failed':
        case 'undelivered':
          metrics.failed++;
          break;
        case 'queued':
        case 'sending':
        case 'sent':
          metrics.pending++;
          break;
      }
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to get SMS metrics', { error: (error as Error).message });
    throw error;
  }
}

// ============================================
// Health Check
// ============================================

export async function checkTwilioHealth(): Promise<boolean> {
  try {
    const client = initializeTwilio();
    // Try to fetch account info
    await client.api.accounts(config.twilio.accountSid).fetch();
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================
// Opt-out Handling
// ============================================

export async function handleOptOut(phoneNumber: string): Promise<void> {
  const user = await User.findOne({ phoneNumber });

  if (user) {
    user.preferences.notifications.smsEnabled = false;
    await user.save();

    logger.info('User opted out of SMS', {
      userId: user.id,
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
    });
  }
}

export async function handleOptIn(phoneNumber: string): Promise<void> {
  const user = await User.findOne({ phoneNumber });

  if (user) {
    user.preferences.notifications.smsEnabled = true;
    await user.save();

    logger.info('User opted in to SMS', {
      userId: user.id,
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
    });
  }
}
