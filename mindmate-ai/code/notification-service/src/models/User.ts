/**
 * MindMate AI Notification Service - User Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  IUser,
  IUserPreferences,
  IUserDevice,
  IPushToken,
  IChallengeState,
  INotificationHistory,
  NotificationChannel,
  ChallengeCategory,
  ChallengeDifficulty,
} from '../types';

// ============================================
// Sub-schemas
// ============================================

const QuietHoursSchema = new Schema({
  enabled: { type: Boolean, default: true },
  startTime: { type: String, default: '22:00' },
  endTime: { type: String, default: '08:00' },
  timezone: { type: String, default: 'America/New_York' },
  allowCritical: { type: Boolean, default: true },
}, { _id: false });

const NotificationPreferencesSchema = new Schema({
  pushEnabled: { type: Boolean, default: true },
  smsEnabled: { type: Boolean, default: false },
  emailEnabled: { type: Boolean, default: true },
  webPushEnabled: { type: Boolean, default: true },
  inAppEnabled: { type: Boolean, default: true },
  marketingEnabled: { type: Boolean, default: false },
  challengeNotifications: { type: Boolean, default: true },
  checkInNotifications: { type: Boolean, default: true },
  reminderNotifications: { type: Boolean, default: true },
  achievementNotifications: { type: Boolean, default: true },
  insightNotifications: { type: Boolean, default: true },
}, { _id: false });

const UserPreferencesSchema = new Schema({
  notifications: { type: NotificationPreferencesSchema, default: () => ({}) },
  quietHours: { type: QuietHoursSchema, default: () => ({}) },
  checkInTime: { type: String, default: '09:00' },
  challengeFrequency: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'weekly' },
  preferredChannels: [{ type: String, enum: Object.values(NotificationChannel) }],
  language: { type: String, default: 'en' },
}, { _id: false });

const UserDeviceSchema = new Schema({
  id: { type: String, required: true },
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  deviceToken: { type: String, required: true },
  voipToken: { type: String },
  appVersion: { type: String, required: true },
  osVersion: { type: String, required: true },
  model: { type: String, required: true },
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const PushTokenSchema = new Schema({
  token: { type: String, required: true },
  platform: { type: String, enum: ['fcm', 'apns', 'web'], required: true },
  deviceId: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date },
  isValid: { type: Boolean, default: true },
}, { _id: false });

const ChallengeStateSchema = new Schema({
  currentChallengeId: { type: String },
  completedChallenges: [{ type: String }],
  challengeStreak: { type: Number, default: 0 },
  lastChallengeDate: { type: Date },
  preferredCategories: [{ type: String, enum: Object.values(ChallengeCategory) }],
  difficulty: { type: String, enum: Object.values(ChallengeDifficulty), default: 'beginner' },
}, { _id: false });

const NotificationHistorySchema = new Schema({
  lastPushAt: { type: Date },
  lastSmsAt: { type: Date },
  lastEmailAt: { type: Date },
  pushCountToday: { type: Number, default: 0 },
  smsCountToday: { type: Number, default: 0 },
  emailCountToday: { type: Number, default: 0 },
  dailyResetAt: { type: Date, default: Date.now },
}, { _id: false });

// ============================================
// User Schema
// ============================================

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  timezone: { type: String, default: 'America/New_York' },
  locale: { type: String, default: 'en-US' },
  preferences: { type: UserPreferencesSchema, default: () => ({}) },
  devices: { type: [UserDeviceSchema], default: [] },
  pushTokens: { type: [PushTokenSchema], default: [] },
  challengeState: { type: ChallengeStateSchema, default: () => ({}) },
  lastCheckIn: { type: Date },
  streakCount: { type: Number, default: 0 },
  notificationHistory: { type: NotificationHistorySchema, default: () => ({}) },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ============================================
// Indexes
// ============================================

UserSchema.index({ 'preferences.checkInTime': 1, timezone: 1 });
UserSchema.index({ 'challengeState.lastChallengeDate': 1 });
UserSchema.index({ 'notificationHistory.dailyResetAt': 1 });
UserSchema.index({ lastCheckIn: 1 });

// ============================================
// Methods
// ============================================

UserSchema.methods.getActiveDevices = function(): IUserDevice[] {
  return this.devices.filter((device: IUserDevice) => device.isActive);
};

UserSchema.methods.getValidPushTokens = function(): IPushToken[] {
  return this.pushTokens.filter((token: IPushToken) => token.isValid);
};

UserSchema.methods.incrementNotificationCount = async function(
  channel: NotificationChannel
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Reset counts if it's a new day
  if (!this.notificationHistory.dailyResetAt ||
      this.notificationHistory.dailyResetAt < today) {
    this.notificationHistory.pushCountToday = 0;
    this.notificationHistory.smsCountToday = 0;
    this.notificationHistory.emailCountToday = 0;
    this.notificationHistory.dailyResetAt = new Date();
  }
  
  switch (channel) {
    case NotificationChannel.PUSH:
    case NotificationChannel.WEB_PUSH:
      this.notificationHistory.pushCountToday++;
      this.notificationHistory.lastPushAt = new Date();
      break;
    case NotificationChannel.SMS:
      this.notificationHistory.smsCountToday++;
      this.notificationHistory.lastSmsAt = new Date();
      break;
    case NotificationChannel.EMAIL:
      this.notificationHistory.emailCountToday++;
      this.notificationHistory.lastEmailAt = new Date();
      break;
  }
  
  await this.save();
};

UserSchema.methods.resetDailyCounts = async function(): Promise<void> {
  this.notificationHistory.pushCountToday = 0;
  this.notificationHistory.smsCountToday = 0;
  this.notificationHistory.emailCountToday = 0;
  this.notificationHistory.dailyResetAt = new Date();
  await this.save();
};

UserSchema.methods.updateCheckIn = async function(): Promise<void> {
  const now = new Date();
  
  // Check if this maintains the streak
  if (this.lastCheckIn) {
    const lastCheckInDate = new Date(this.lastCheckIn);
    const diffDays = Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      this.streakCount++;
    } else if (diffDays > 1) {
      this.streakCount = 1;
    }
  } else {
    this.streakCount = 1;
  }
  
  this.lastCheckIn = now;
  await this.save();
};

UserSchema.methods.addPushToken = async function(
  token: string,
  platform: 'fcm' | 'apns' | 'web',
  deviceId?: string
): Promise<void> {
  // Check if token already exists
  const existingIndex = this.pushTokens.findIndex(
    (t: IPushToken) => t.token === token
  );
  
  if (existingIndex >= 0) {
    // Update existing token
    this.pushTokens[existingIndex].isValid = true;
    this.pushTokens[existingIndex].lastUsed = new Date();
  } else {
    // Add new token
    this.pushTokens.push({
      token,
      platform,
      deviceId,
      createdAt: new Date(),
      lastUsed: new Date(),
      isValid: true,
    });
  }
  
  await this.save();
};

UserSchema.methods.invalidatePushToken = async function(token: string): Promise<void> {
  const tokenIndex = this.pushTokens.findIndex(
    (t: IPushToken) => t.token === token
  );
  
  if (tokenIndex >= 0) {
    this.pushTokens[tokenIndex].isValid = false;
    await this.save();
  }
};

// ============================================
// Static Methods
// ============================================

UserSchema.statics.findByCheckInTime = function(
  time: string,
  timezone: string
) {
  return this.find({
    'preferences.checkInTime': time,
    timezone: timezone,
    'preferences.notifications.checkInNotifications': true,
  });
};

UserSchema.statics.findDueForChallenge = function(
  lastChallengeBefore: Date
) {
  return this.find({
    $or: [
      { 'challengeState.lastChallengeDate': { $lt: lastChallengeBefore } },
      { 'challengeState.lastChallengeDate': { $exists: false } },
    ],
    'preferences.notifications.challengeNotifications': true,
  });
};

UserSchema.statics.resetAllDailyCounts = async function(): Promise<number> {
  const result = await this.updateMany(
 {},
    {
      $set: {
        'notificationHistory.pushCountToday': 0,
        'notificationHistory.smsCountToday': 0,
        'notificationHistory.emailCountToday': 0,
        'notificationHistory.dailyResetAt': new Date(),
      },
    }
  );
  
  return result.modifiedCount;
};

// ============================================
// Export
// ============================================

export const User = mongoose.model<IUserDocument>('User', UserSchema);
