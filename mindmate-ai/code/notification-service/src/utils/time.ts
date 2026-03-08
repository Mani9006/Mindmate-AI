/**
 * MindMate AI Notification Service - Time Utilities
 */

import moment from 'moment-timezone';
import { config } from '../config';

// ============================================
// Timezone Helpers
// ============================================

export function getCurrentTimeInTimezone(timezone: string): moment.Moment {
  return moment().tz(timezone);
}

export function getCurrentHourInTimezone(timezone: string): number {
  return getCurrentTimeInTimezone(timezone).hour();
}

export function isValidTimezone(timezone: string): boolean {
  return moment.tz.names().includes(timezone);
}

export function getUserLocalTime(timezone: string = config.scheduler.timezoneDefault): Date {
  return getCurrentTimeInTimezone(timezone).toDate();
}

// ============================================
// Quiet Hours Check
// ============================================

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
  allowCritical: boolean;
}

export function isInQuietHours(
  config: QuietHoursConfig,
  priority?: string
): boolean {
  if (!config.enabled) {
    return false;
  }

  // Critical notifications can bypass quiet hours
  if (priority === 'critical' && config.allowCritical) {
    return false;
  }

  const now = getCurrentTimeInTimezone(config.timezone);
  const currentHour = now.hour();
  const currentMinute = now.minute();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = config.startTime.split(':').map(Number);
  const [endHour, endMinute] = config.endTime.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  // Same-day quiet hours (e.g., 14:00 - 16:00)
  return currentTime >= startTime && currentTime < endTime;
}

// ============================================
// Check-in Time Calculation
// ============================================

export function getNextCheckInTime(
  preferredTime: string,
  timezone: string
): Date {
  const now = getCurrentTimeInTimezone(timezone);
  const [hours, minutes] = preferredTime.split(':').map(Number);
  
  let checkInTime = now.clone().hours(hours).minutes(minutes).seconds(0);
  
  // If the time has already passed today, schedule for tomorrow
  if (checkInTime.isSameOrBefore(now)) {
    checkInTime = checkInTime.add(1, 'day');
  }
  
  return checkInTime.toDate();
}

export function shouldSendCheckIn(
  preferredTime: string,
  timezone: string,
  lastCheckIn?: Date,
  toleranceMinutes: number = 30
): boolean {
  const now = getCurrentTimeInTimezone(timezone);
  const [hours, minutes] = preferredTime.split(':').map(Number);
  
  const checkInTime = now.clone().hours(hours).minutes(minutes);
  const diffMinutes = Math.abs(now.diff(checkInTime, 'minutes'));
  
  // Check if we're within the tolerance window
  if (diffMinutes > toleranceMinutes) {
    return false;
  }
  
  // Check if user already checked in today
  if (lastCheckIn) {
    const lastCheckInMoment = moment(lastCheckIn).tz(timezone);
    if (lastCheckInMoment.isSame(now, 'day')) {
      return false;
    }
  }
  
  return true;
}

// ============================================
// Challenge Scheduling
// ============================================

export function getNextChallengeTime(timezone: string): Date {
  const now = getCurrentTimeInTimezone(timezone);
  
  // Schedule for next Monday at 8 AM
  let nextMonday = now.clone().day(8).hours(8).minutes(0).seconds(0);
  
  // If today is Monday and before 8 AM, use today
  if (now.day() === 1 && now.hour() < 8) {
    nextMonday = now.clone().hours(8).minutes(0).seconds(0);
  }
  
  return nextMonday.toDate();
}

// ============================================
// Frequency Limiting
// ============================================

export function hasEnoughTimePassed(
  lastSent: Date | undefined,
  minIntervalMinutes: number
): boolean {
  if (!lastSent) {
    return true;
  }
  
  const lastSentMoment = moment(lastSent);
  const now = moment();
  const diffMinutes = now.diff(lastSentMoment, 'minutes');
  
  return diffMinutes >= minIntervalMinutes;
}

// ============================================
// Date Formatting
// ============================================

export function formatDateInTimezone(
  date: Date,
  timezone: string,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  return moment(date).tz(timezone).format(format);
}

export function getStartOfDayInTimezone(
  timezone: string,
  date: Date = new Date()
): Date {
  return moment(date).tz(timezone).startOf('day').toDate();
}

export function getEndOfDayInTimezone(
  timezone: string,
  date: Date = new Date()
): Date {
  return moment(date).tz(timezone).endOf('day').toDate();
}

// ============================================
// Business Hours Check
// ============================================

export function isBusinessHours(
  timezone: string,
  startHour: number = 9,
  endHour: number = 17
): boolean {
  const now = getCurrentTimeInTimezone(timezone);
  const hour = now.hour();
  const day = now.day();
  
  // Not business hours on weekends
  if (day === 0 || day === 6) {
    return false;
  }
  
  return hour >= startHour && hour < endHour;
}

// ============================================
// Sleep Time Detection
// ============================================

export function isLikelySleeping(
  timezone: string,
  sleepStartHour: number = 22,
  sleepEndHour: number = 7
): boolean {
  const now = getCurrentTimeInTimezone(timezone);
  const hour = now.hour();
  
  // Overnight sleep period
  if (sleepStartHour > sleepEndHour) {
    return hour >= sleepStartHour || hour < sleepEndHour;
  }
  
  return hour >= sleepStartHour && hour < sleepEndHour;
}

// ============================================
// Optimal Notification Time
// ============================================

export function getOptimalNotificationTime(
  timezone: string,
  preferredTime?: string
): Date {
  const now = getCurrentTimeInTimezone(timezone);
  
  if (preferredTime) {
    const [hours, minutes] = preferredTime.split(':').map(Number);
    const preferred = now.clone().hours(hours).minutes(minutes);
    
    // If preferred time is in the future today, use it
    if (preferred.isAfter(now)) {
      return preferred.toDate();
    }
    
    // Otherwise, use preferred time tomorrow
    return preferred.add(1, 'day').toDate();
  }
  
  // Default: schedule for 1 hour from now, but not during quiet hours
  let optimalTime = now.clone().add(1, 'hour');
  
  const quietHoursStart = config.limits.quietHoursStart;
  const quietHoursEnd = config.limits.quietHoursEnd;
  const hour = optimalTime.hour();
  
  // If during quiet hours, schedule for after quiet hours
  if (hour >= quietHoursStart || hour < quietHoursEnd) {
    optimalTime = optimalTime.hours(quietHoursEnd).minutes(0);
  }
  
  return optimalTime.toDate();
}

// ============================================
// Cron Expression Helpers
// ============================================

export function generateCronForTimezone(
  baseCron: string,
  timezone: string
): string {
  // For Bull queue, we use the timezone option directly
  // This helper is for documentation purposes
  return baseCron;
}

// ============================================
// Time Window Validation
// ============================================

export function isWithinTimeWindow(
  date: Date,
  startTime: string,
  endTime: string,
  timezone: string
): boolean {
  const checkMoment = moment(date).tz(timezone);
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const checkMinutes = checkMoment.hours() * 60 + checkMoment.minutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return checkMinutes >= startMinutes && checkMinutes <= endMinutes;
}
