/**
 * MindMate AI Notification Service - Utils Export
 */

export { logger, logStream, logNotification, logQueueEvent, logError, logJobProgress } from './logger';
export { connectDatabase, disconnectDatabase, isDatabaseHealthy, getConnectionState } from './database';
export {
  createRedisClient,
  getRedisClient,
  getRedisSubscriber,
  connectRedis,
  disconnectRedis,
  isRedisHealthy,
  incrementCounter,
  getCounter,
  resetCounter,
  trackNotification,
  getNotificationCount,
  resetDailyNotificationCounts,
  setUserOnline,
  isUserOnline,
  scheduleJob,
  getDueJobs,
  removeScheduledJob,
} from './redis';
export {
  getCurrentTimeInTimezone,
  getCurrentHourInTimezone,
  isValidTimezone,
  getUserLocalTime,
  isInQuietHours,
  getNextCheckInTime,
  shouldSendCheckIn,
  getNextChallengeTime,
  hasEnoughTimePassed,
  formatDateInTimezone,
  getStartOfDayInTimezone,
  getEndOfDayInTimezone,
  isBusinessHours,
  isLikelySleeping,
  getOptimalNotificationTime,
  generateCronForTimezone,
  isWithinTimeWindow,
} from './time';
