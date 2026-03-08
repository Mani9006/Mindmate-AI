/**
 * MindMate AI Notification Service - Type Definitions
 */

// ============================================
// Core Notification Types
// ============================================

export enum NotificationType {
  CHECKIN = 'checkin',
  CHALLENGE = 'challenge',
  REMINDER = 'reminder',
  ACHIEVEMENT = 'achievement',
  STREAK = 'streak',
  INSIGHT = 'insight',
  SYSTEM = 'system',
  MARKETING = 'marketing',
}

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
  WEB_PUSH = 'web_push',
}

export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SUPPRESSED = 'suppressed',
}

// ============================================
// User Types
// ============================================

export interface IUser {
  id: string;
  email: string;
  phoneNumber?: string;
  timezone: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: IUserPreferences;
  devices: IUserDevice[];
  pushTokens: IPushToken[];
  challengeState: IChallengeState;
  lastCheckIn?: Date;
  streakCount: number;
  notificationHistory: INotificationHistory;
}

export interface IUserPreferences {
  notifications: INotificationPreferences;
  quietHours: IQuietHours;
  checkInTime: string; // HH:mm format
  challengeFrequency: 'daily' | 'weekly' | 'custom';
  preferredChannels: NotificationChannel[];
  language: string;
}

export interface INotificationPreferences {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  webPushEnabled: boolean;
  inAppEnabled: boolean;
  marketingEnabled: boolean;
  challengeNotifications: boolean;
  checkInNotifications: boolean;
  reminderNotifications: boolean;
  achievementNotifications: boolean;
  insightNotifications: boolean;
}

export interface IQuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
  allowCritical: boolean;
}

export interface IUserDevice {
  id: string;
  platform: 'ios' | 'android' | 'web';
  deviceToken: string;
  voipToken?: string;
  appVersion: string;
  osVersion: string;
  model: string;
  lastActive: Date;
  isActive: boolean;
}

export interface IPushToken {
  token: string;
  platform: 'fcm' | 'apns' | 'web';
  deviceId?: string;
  createdAt: Date;
  lastUsed?: Date;
  isValid: boolean;
}

export interface IChallengeState {
  currentChallengeId?: string;
  completedChallenges: string[];
  challengeStreak: number;
  lastChallengeDate?: Date;
  preferredCategories: ChallengeCategory[];
  difficulty: ChallengeDifficulty;
}

export enum ChallengeCategory {
  MINDFULNESS = 'mindfulness',
  GRATITUDE = 'gratitude',
  SLEEP = 'sleep',
  EXERCISE = 'exercise',
  SOCIAL = 'social',
  LEARNING = 'learning',
  CREATIVITY = 'creativity',
  PRODUCTIVITY = 'productivity',
}

export enum ChallengeDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// ============================================
// Challenge Types
// ============================================

export interface IChallenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration: number; // in days
  tasks: IChallengeTask[];
  rewards: IChallengeReward[];
  prerequisites?: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChallengeTask {
  id: string;
  day: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  type: 'reflection' | 'activity' | 'meditation' | 'journal' | 'quiz';
}

export interface IChallengeReward {
  type: 'badge' | 'points' | 'streak' | 'unlock';
  value: string | number;
  description: string;
}

// ============================================
// Notification Job Types
// ============================================

export interface INotificationJobData {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ICheckInJobData {
  userId: string;
  timezone: string;
  preferredTime: string;
  checkInType: 'morning' | 'evening' | 'custom';
  personalizationContext?: {
    mood?: string;
    recentActivity?: string;
    streakCount?: number;
  };
}

export interface IChallengeAssignmentJobData {
  userId: string;
  challengeId?: string;
  autoSelect: boolean;
  preferredCategories?: ChallengeCategory[];
  difficulty?: ChallengeDifficulty;
  reason: 'scheduled' | 'user_request' | 'streak_recovery' | 'milestone';
}

export interface IBatchNotificationJobData {
  userIds: string[];
  notification: Omit<INotificationJobData, 'userId'>;
  batchSize?: number;
  throttleMs?: number;
}

// ============================================
// Notification History
// ============================================

export interface INotificationHistory {
  lastPushAt?: Date;
  lastSmsAt?: Date;
  lastEmailAt?: Date;
  pushCountToday: number;
  smsCountToday: number;
  emailCountToday: number;
  dailyResetAt: Date;
}

export interface INotificationLog {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  body: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================
// Push Notification Payloads
// ============================================

export interface IFCMPayload {
  token: string;
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data: Record<string, string>;
  android?: {
    priority: 'high' | 'normal';
    notification: {
      channelId: string;
      sound: string;
      icon: string;
      color: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        alert: {
          title: string;
          body: string;
        };
        badge: number;
        sound: string;
        category: string;
      };
    };
  };
}

export interface IAPNsPayload {
  deviceToken: string;
  alert: {
    title: string;
    body: string;
  };
  badge?: number;
  sound?: string;
  category?: string;
  customData?: Record<string, any>;
  priority?: number;
  expiration?: number;
}

export interface IWebPushPayload {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

// ============================================
// SMS Types
// ============================================

export interface ISMSPayload {
  to: string;
  body: string;
  from?: string;
  mediaUrls?: string[];
  statusCallback?: string;
}

// ============================================
// Queue Types
// ============================================

export interface IQueueConfig {
  name: string;
  concurrency: number;
  attempts: number;
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete: boolean | number;
  removeOnFail: boolean | number;
}

export interface IJobProgress {
  processed: number;
  total: number;
  failed: number;
  percentage: number;
}

// ============================================
// Service Response Types
// ============================================

export interface INotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
  timestamp: Date;
}

export interface IBatchResult {
  total: number;
  successful: number;
  failed: number;
  suppressed: number;
  results: Array<{
    userId: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================
// API Types
// ============================================

export interface IScheduleNotificationRequest {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  scheduledAt: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
}

export interface IImmediateNotificationRequest {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
}

export interface INotificationPreferenceUpdate {
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  quietHours?: Partial<IQuietHours>;
  checkInTime?: string;
}

// ============================================
// Health & Monitoring Types
// ============================================

export interface IHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    redis: boolean;
    mongodb: boolean;
    fcm: boolean;
    apns: boolean;
    twilio: boolean;
  };
  queues: {
    [queueName: string]: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  };
}

export interface IMetrics {
  notificationsSent: number;
  notificationsFailed: number;
  averageProcessingTime: number;
  queueDepth: number;
  errorRate: number;
}
