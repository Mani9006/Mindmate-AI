/**
 * MindMate AI Notification Service - Services Export
 */

// Push Notification Service
export {
  initializeFCM,
  initializeAPNs,
  initializeWebPush,
  initializeAllPushServices,
  sendFCM,
  sendAPNs,
  sendWebPush,
  sendPushToUser,
  sendWebPushToUser,
  checkPushServicesHealth,
  closePushServices,
} from './PushNotificationService';

// SMS Service
export {
  initializeTwilio,
  sendSMS,
  sendSMSToUser,
  sendBulkSMS,
  validatePhoneNumber,
  formatPhoneNumber,
  SMS_TEMPLATES,
  sendTemplatedSMS,
  getMessageStatus,
  getSMSMetrics,
  checkTwilioHealth,
  handleOptOut,
  handleOptIn,
} from './SMSService';

// Preference Service
export {
  checkNotificationAllowed,
  getUserChannelPreferences,
  updateNotificationCount,
  getOptimalSendTime,
  shouldSendNotification,
  batchCheckPreferences,
  getPreferenceSummary,
  type PreferenceCheckResult,
  type ChannelPreference,
} from './PreferenceService';
