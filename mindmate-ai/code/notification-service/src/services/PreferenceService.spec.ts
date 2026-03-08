/**
 * MindMate AI Notification Service - Preference Service Tests
 */

import {
  checkNotificationAllowed,
  getUserChannelPreferences,
  getOptimalSendTime,
} from './PreferenceService';
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  IUser,
} from '../types';

// Mock user data
const mockUser: IUser = {
  id: 'user-123',
  email: 'test@example.com',
  phoneNumber: '+1234567890',
  timezone: 'America/New_York',
  locale: 'en-US',
  createdAt: new Date(),
  updatedAt: new Date(),
  preferences: {
    notifications: {
      pushEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      webPushEnabled: true,
      inAppEnabled: true,
      marketingEnabled: false,
      challengeNotifications: true,
      checkInNotifications: true,
      reminderNotifications: true,
      achievementNotifications: true,
      insightNotifications: true,
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'America/New_York',
      allowCritical: true,
    },
    checkInTime: '09:00',
    challengeFrequency: 'weekly',
    preferredChannels: [NotificationChannel.PUSH],
    language: 'en',
  },
  devices: [],
  pushTokens: [],
  challengeState: {
    completedChallenges: [],
    challengeStreak: 0,
    preferredCategories: [],
    difficulty: 'beginner',
  },
  lastCheckIn: undefined,
  streakCount: 0,
  notificationHistory: {
    pushCountToday: 0,
    smsCountToday: 0,
    emailCountToday: 0,
    dailyResetAt: new Date(),
  },
};

describe('PreferenceService', () => {
  describe('checkNotificationAllowed', () => {
    it('should allow notification when all preferences are enabled', async () => {
      const result = await checkNotificationAllowed(
        mockUser,
        NotificationChannel.PUSH,
        NotificationType.CHECKIN
      );

      expect(result.allowed).toBe(true);
    });

    it('should block notification when channel is disabled', async () => {
      const userWithDisabledPush = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          notifications: {
            ...mockUser.preferences.notifications,
            pushEnabled: false,
          },
        },
      };

      const result = await checkNotificationAllowed(
        userWithDisabledPush,
        NotificationChannel.PUSH,
        NotificationType.CHECKIN
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it('should allow critical notifications during quiet hours', async () => {
      // Mock current time to be during quiet hours (23:00)
      const mockDate = new Date('2024-01-15T23:00:00-05:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = await checkNotificationAllowed(
        mockUser,
        NotificationChannel.PUSH,
        NotificationType.SYSTEM,
        NotificationPriority.CRITICAL
      );

      expect(result.allowed).toBe(true);

      jest.restoreAllMocks();
    });

    it('should block marketing notifications when disabled', async () => {
      const result = await checkNotificationAllowed(
        mockUser,
        NotificationChannel.PUSH,
        NotificationType.MARKETING
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Marketing');
    });
  });

  describe('getUserChannelPreferences', () => {
    it('should return all channel preferences', async () => {
      const preferences = await getUserChannelPreferences(mockUser);

      expect(preferences).toHaveLength(4);
      expect(preferences.map(p => p.channel)).toContain(NotificationChannel.PUSH);
      expect(preferences.map(p => p.channel)).toContain(NotificationChannel.SMS);
      expect(preferences.map(p => p.channel)).toContain(NotificationChannel.EMAIL);
      expect(preferences.map(p => p.channel)).toContain(NotificationChannel.IN_APP);
    });

    it('should return correct enabled status for each channel', async () => {
      const preferences = await getUserChannelPreferences(mockUser);

      const pushPref = preferences.find(p => p.channel === NotificationChannel.PUSH);
      expect(pushPref?.enabled).toBe(true);

      const smsPref = preferences.find(p => p.channel === NotificationChannel.SMS);
      expect(smsPref?.enabled).toBe(true);
    });
  });

  describe('getOptimalSendTime', () => {
    it('should return preferred time if in the future', () => {
      // Mock current time to 06:00
      const mockDate = new Date('2024-01-15T06:00:00-05:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const optimalTime = getOptimalSendTime(mockUser, '09:00');

      // Should be today at 09:00
      expect(optimalTime.getHours()).toBe(9);
      expect(optimalTime.getMinutes()).toBe(0);

      jest.restoreAllMocks();
    });

    it('should return next day if preferred time has passed', () => {
      // Mock current time to 12:00
      const mockDate = new Date('2024-01-15T12:00:00-05:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const optimalTime = getOptimalSendTime(mockUser, '09:00');

      // Should be tomorrow at 09:00
      expect(optimalTime.getHours()).toBe(9);
      expect(optimalTime.getDate()).toBe(16);

      jest.restoreAllMocks();
    });
  });
});
