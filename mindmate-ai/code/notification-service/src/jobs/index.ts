/**
 * MindMate AI Notification Service - Jobs Export
 */

// Notification Job
export {
  processNotificationJob,
  processPushJob,
  processSMSJob,
  processEmailJob,
  routeToChannelQueue,
  JOB_NAMES as NOTIFICATION_JOB_NAMES,
} from './notificationJob';

// Check-in Job
export {
  processCheckInJob,
  scheduleCheckInForUser,
  scheduleAllCheckIns,
  getCheckInStatus,
  checkStreaksAtRisk,
  sendStreakAtRiskNotification,
} from './checkInJob';

// Challenge Job
export {
  processChallengeAssignmentJob,
  scheduleWeeklyChallenges,
  completeChallenge,
  getUserCurrentChallenge,
  skipChallenge,
} from './challengeJob';

// Batch Job
export {
  processBatchNotificationJob,
  sendAnnouncement,
  sendTargetedNotification,
  sendStreakMilestoneNotifications,
  reengageInactiveUsers,
} from './batchJob';
