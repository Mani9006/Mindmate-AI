import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification channels for Android
const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });

    await Notifications.setNotificationChannelAsync('sessions', {
      name: 'Sessions',
      description: 'Notifications for therapy sessions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8b5cf6',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      description: 'Daily reminders and check-ins',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 125, 125, 125],
      lightColor: '#10b981',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions',
      description: 'Special offers and updates',
      importance: Notifications.AndroidImportance.LOW,
      lightColor: '#ec4899',
    });
  }
};

// Register for push notifications
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // Setup notification channels
    await setupNotificationChannels();

    // Check if device is physical
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// Unregister push token
export const unregisterPushToken = async (token: string): Promise<void> => {
  try {
    await apiClient.post('/notifications/unregister-token', { token });
  } catch (error) {
    console.error('Error unregistering push token:', error);
  }
};

// Send push token to server
export const sendPushTokenToServer = async (token: string): Promise<void> => {
  try {
    await apiClient.post('/notifications/register-token', {
      token,
      platform: 'expo',
      deviceInfo: {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
      },
    });
  } catch (error) {
    console.error('Error sending push token to server:', error);
  }
};

// Schedule a local notification
export const scheduleNotification = async (
  title: string,
  body: string,
  trigger?: Notifications.NotificationTriggerInput,
  data?: Record<string, any>
): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      badge: 1,
    },
    trigger: trigger || null,
  });

  return identifier;
};

// Schedule a daily reminder
export const scheduleDailyReminder = async (
  hour: number,
  minute: number,
  title: string = 'Daily Check-in',
  body: string = 'How are you feeling today? Take a moment to check in with MindMate AI.'
): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'reminder' },
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  });

  return identifier;
};

// Schedule a weekly reminder
export const scheduleWeeklyReminder = async (
  weekday: number, // 1 = Sunday, 7 = Saturday
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'reminder' },
      sound: true,
    },
    trigger: {
      weekday,
      hour,
      minute,
      repeats: true,
    } as Notifications.WeeklyTriggerInput,
  });

  return identifier;
};

// Cancel a scheduled notification
export const cancelNotification = async (identifier: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(identifier);
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Get all scheduled notifications
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

// Set badge count
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

// Get badge count
export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

// Present local notification immediately
export const presentLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // null trigger shows immediately
  });
};

// Notification categories/actions
export const setNotificationCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync('session_reminder', [
    {
      identifier: 'start_session',
      buttonTitle: 'Start Session',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'snooze',
      buttonTitle: 'Snooze',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('mood_check', [
    {
      identifier: 'log_mood',
      buttonTitle: 'Log Mood',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'dismiss',
      buttonTitle: 'Dismiss',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);
};

// Parse notification data
export const parseNotificationData = (notification: Notifications.Notification) => {
  const { data, title, body } = notification.request.content;
  
  return {
    id: notification.request.identifier,
    title: title || '',
    body: body || '',
    type: (data?.type as string) || 'system',
    data: data || {},
    timestamp: notification.date,
  };
};
