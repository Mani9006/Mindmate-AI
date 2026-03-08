/**
 * MindMate AI Notification Service - Push Notification Service
 * Supports FCM (Firebase Cloud Messaging), APNs (Apple Push Notification Service), and Web Push
 */

import admin from 'firebase-admin';
import apn from 'apn';
import webPush from 'web-push';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  INotificationJobData,
  IFCMPayload,
  IAPNsPayload,
  IWebPushPayload,
  INotificationResult,
  NotificationChannel,
} from '../types';
import { User } from '../models';

// ============================================
// Service State
// ============================================

let fcmInitialized = false;
let apnsProvider: apn.Provider | null = null;
let webPushConfigured = false;

// ============================================
// Initialize Services
// ============================================

export function initializeFCM(): void {
  if (fcmInitialized) return;

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
      databaseURL: config.firebase.databaseUrl,
    });

    fcmInitialized = true;
    logger.info('FCM initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize FCM', { error: (error as Error).message });
    throw error;
  }
}

export function initializeAPNs(): void {
  if (apnsProvider) return;

  try {
    const apnsOptions: apn.ProviderOptions = {
      token: {
        key: config.apns.keyPath,
        keyId: config.apns.keyId,
        teamId: config.apns.teamId,
      },
      production: config.apns.production,
    };

    apnsProvider = new apn.Provider(apnsOptions);
    logger.info('APNs provider initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize APNs', { error: (error as Error).message });
    throw error;
  }
}

export function initializeWebPush(): void {
  if (webPushConfigured) return;

  try {
    webPush.setVapidDetails(
      config.webPush.subject,
      config.webPush.vapidPublicKey,
      config.webPush.vapidPrivateKey
    );

    webPushConfigured = true;
    logger.info('Web Push configured successfully');
  } catch (error) {
    logger.error('Failed to configure Web Push', { error: (error as Error).message });
    throw error;
  }
}

export function initializeAllPushServices(): void {
  initializeFCM();
  initializeAPNs();
  initializeWebPush();
}

// ============================================
// FCM (Firebase Cloud Messaging)
// ============================================

export async function sendFCM(
  token: string,
  data: INotificationJobData
): Promise<INotificationResult> {
  if (!fcmInitialized) {
    initializeFCM();
  }

  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
      },
      data: data.data ? Object.entries(data.data).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>) : {},
      android: {
        priority: data.priority === 'high' || data.priority === 'critical' ? 'high' : 'normal',
        notification: {
          channelId: 'mindmate_default',
          sound: 'default',
          icon: 'ic_notification',
          color: '#4CAF50',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: data.title,
              body: data.body,
            },
            badge: 1,
            sound: 'default',
            category: data.type,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);

    logger.info('FCM notification sent', {
      userId: data.userId,
      messageId: response,
    });

    return {
      success: true,
      messageId: response,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    const isInvalidToken = errorMessage.includes('registration-token-not-registered') ||
                          errorMessage.includes('invalid-registration-token');

    logger.error('FCM notification failed', {
      userId: data.userId,
      error: errorMessage,
    });

    // Invalidate token if it's invalid
    if (isInvalidToken) {
      await invalidateUserToken(data.userId, token);
    }

    return {
      success: false,
      error: errorMessage,
      retryable: !isInvalidToken,
      timestamp: new Date(),
    };
  }
}

// ============================================
// APNs (Apple Push Notification Service)
// ============================================

export async function sendAPNs(
  deviceToken: string,
  data: INotificationJobData
): Promise<INotificationResult> {
  if (!apnsProvider) {
    initializeAPNs();
  }

  try {
    const notification = new apn.Notification();
    notification.alert = {
      title: data.title,
      body: data.body,
    };
    notification.badge = 1;
    notification.sound = 'default';
    notification.topic = config.apns.bundleId;
    notification.category = data.type;
    notification.payload = data.data || {};
    notification.priority = data.priority === 'high' || data.priority === 'critical' ? 10 : 5;

    const response = await apnsProvider!.send(notification, deviceToken);

    if (response.sent.length > 0) {
      logger.info('APNs notification sent', {
        userId: data.userId,
        deviceToken: deviceToken.substring(0, 10) + '...',
      });

      return {
        success: true,
        timestamp: new Date(),
      };
    } else if (response.failed.length > 0) {
      const failure = response.failed[0];
      const isInvalidToken = failure.response?.reason === 'Unregistered' ||
                            failure.response?.reason === 'BadDeviceToken';

      logger.error('APNs notification failed', {
        userId: data.userId,
        error: failure.response?.reason,
      });

      // Invalidate token if it's invalid
      if (isInvalidToken) {
        await invalidateUserToken(data.userId, deviceToken);
      }

      return {
        success: false,
        error: failure.response?.reason || 'Unknown error',
        retryable: !isInvalidToken,
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: 'Unknown APNs error',
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = (error as Error).message;

    logger.error('APNs notification error', {
      userId: data.userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      retryable: true,
      timestamp: new Date(),
    };
  }
}

// ============================================
// Web Push
// ============================================

export async function sendWebPush(
  subscription: IWebPushPayload['subscription'],
  data: INotificationJobData
): Promise<INotificationResult> {
  if (!webPushConfigured) {
    initializeWebPush();
  }

  try {
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.type,
      requireInteraction: data.priority === 'high' || data.priority === 'critical',
      data: data.data || {},
      actions: data.data?.actions || [],
    });

    const result = await webPush.sendNotification(subscription, payload);

    logger.info('Web Push notification sent', {
      userId: data.userId,
      statusCode: result.statusCode,
    });

    return {
      success: result.statusCode === 201,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    const isInvalidSubscription = errorMessage.includes('expired') ||
                                  errorMessage.includes('Not subscribed');

    logger.error('Web Push notification failed', {
      userId: data.userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      retryable: !isInvalidSubscription,
      timestamp: new Date(),
    };
  }
}

// ============================================
// Send to User (All Devices)
// ============================================

export async function sendPushToUser(
  data: INotificationJobData
): Promise<INotificationResult[]> {
  const user = await User.findOne({ id: data.userId });

  if (!user) {
    logger.error('User not found for push notification', { userId: data.userId });
    return [{
      success: false,
      error: 'User not found',
      timestamp: new Date(),
    }];
  }

  const validTokens = user.getValidPushTokens();

  if (validTokens.length === 0) {
    logger.warn('No valid push tokens for user', { userId: data.userId });
    return [{
      success: false,
      error: 'No valid push tokens',
      timestamp: new Date(),
    }];
  }

  const results: INotificationResult[] = [];

  for (const tokenData of validTokens) {
    let result: INotificationResult;

    switch (tokenData.platform) {
      case 'fcm':
        result = await sendFCM(tokenData.token, data);
        break;
      case 'apns':
        result = await sendAPNs(tokenData.token, data);
        break;
      case 'web':
        // For web push, we need the full subscription object
        // This should be stored with the token
        result = {
          success: false,
          error: 'Web push requires full subscription object',
          timestamp: new Date(),
        };
        break;
      default:
        result = {
          success: false,
          error: `Unknown platform: ${tokenData.platform}`,
          timestamp: new Date(),
        };
    }

    results.push(result);

    // Update last used timestamp
    if (result.success) {
      tokenData.lastUsed = new Date();
    }
  }

  await user.save();

  return results;
}

// ============================================
// Send Web Push to User
// ============================================

export async function sendWebPushToUser(
  data: INotificationJobData,
  subscription: IWebPushPayload['subscription']
): Promise<INotificationResult> {
  return sendWebPush(subscription, data);
}

// ============================================
// Token Management
// ============================================

async function invalidateUserToken(
  userId: string,
  token: string
): Promise<void> {
  try {
    const user = await User.findOne({ id: userId });
    if (user) {
      await user.invalidatePushToken(token);
      logger.info('Invalidated push token', { userId, token: token.substring(0, 10) + '...' });
    }
  } catch (error) {
    logger.error('Failed to invalidate push token', {
      userId,
      error: (error as Error).message,
    });
  }
}

// ============================================
// Health Check
// ============================================

export async function checkPushServicesHealth(): Promise<{
  fcm: boolean;
  apns: boolean;
  webPush: boolean;
}> {
  const health = {
    fcm: false,
    apns: false,
    webPush: false,
  };

  // Check FCM
  try {
    if (!fcmInitialized) {
      initializeFCM();
    }
    // Try to get the app instance - this will fail if FCM is not properly initialized
    admin.app();
    health.fcm = true;
  } catch (error) {
    health.fcm = false;
  }

  // Check APNs
  try {
    if (!apnsProvider) {
      initializeAPNs();
    }
    health.apns = !!apnsProvider;
  } catch (error) {
    health.apns = false;
  }

  // Check Web Push
  try {
    if (!webPushConfigured) {
      initializeWebPush();
    }
    health.webPush = webPushConfigured;
  } catch (error) {
    health.webPush = false;
  }

  return health;
}

// ============================================
// Close Connections
// ============================================

export async function closePushServices(): Promise<void> {
  if (apnsProvider) {
    apnsProvider.shutdown();
    apnsProvider = null;
    logger.info('APNs provider shut down');
  }
}
