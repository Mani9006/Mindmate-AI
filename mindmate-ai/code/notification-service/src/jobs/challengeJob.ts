/**
 * MindMate AI Notification Service - Challenge Job Processor
 * Handles challenge assignment based on user state
 */

import { Job } from 'bull';
import { logger } from '../utils/logger';
import {
  IChallengeAssignmentJobData,
  INotificationJobData,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  ChallengeCategory,
  ChallengeDifficulty,
} from '../types';
import { User, Challenge } from '../models';
import { NOTIFICATION_TEMPLATES, config } from '../config';
import { getNotificationQueue } from '../queues';
import { shouldSendNotification } from '../services';

// ============================================
// Process Challenge Assignment Job
// ============================================

export async function processChallengeAssignmentJob(
  job: Job<IChallengeAssignmentJobData>
): Promise<{
  success: boolean;
  challengeId?: string;
  challengeTitle?: string;
  error?: string;
}> {
  const data = job.data;

  logger.info('Processing challenge assignment job', {
    jobId: job.id,
    userId: data.userId,
    autoSelect: data.autoSelect,
    reason: data.reason,
  });

  try {
    // Get user
    const user = await User.findOne({ id: data.userId });

    if (!user) {
      throw new Error(`User not found: ${data.userId}`);
    }

    // Check if user already has an active challenge
    if (user.challengeState.currentChallengeId && data.reason !== 'user_request') {
      const currentChallenge = await Challenge.findOne({
        id: user.challengeState.currentChallengeId,
      });

      if (currentChallenge) {
        logger.info('User already has active challenge', {
          userId: data.userId,
          challengeId: currentChallenge.id,
        });

        // Send reminder instead of new assignment
        await sendChallengeReminder(user.id, currentChallenge);

        return {
          success: true,
          challengeId: currentChallenge.id,
          challengeTitle: currentChallenge.title,
        };
      }
    }

    // Select challenge
    let challenge: InstanceType<typeof Challenge> | null = null;

    if (data.challengeId) {
      // Use specified challenge
      challenge = await Challenge.findOne({ id: data.challengeId, isActive: true });
    }

    if (!challenge && data.autoSelect) {
      // Auto-select based on user state
      challenge = await selectChallengeForUser(user);
    }

    if (!challenge) {
      throw new Error('No suitable challenge found');
    }

    // Assign challenge to user
    await assignChallengeToUser(user, challenge);

    // Send notification
    await sendChallengeAssignmentNotification(user.id, challenge);

    logger.info('Challenge assigned successfully', {
      userId: data.userId,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
    });

    return {
      success: true,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
    };
  } catch (error) {
    logger.error('Challenge assignment failed', {
      jobId: job.id,
      userId: data.userId,
      error: (error as Error).message,
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// ============================================
// Select Challenge for User
// ============================================

async function selectChallengeForUser(
  user: InstanceType<typeof User>
): Promise<InstanceType<typeof Challenge> | null> {
  const challengeState = user.challengeState;

  // Get recommended challenge based on user state
  const challenge = await Challenge.getRecommendedChallenge({
    completedChallenges: challengeState.completedChallenges,
    preferredCategories: challengeState.preferredCategories.length > 0
      ? challengeState.preferredCategories
      : getDefaultCategories(),
    difficulty: challengeState.difficulty,
    challengeStreak: challengeState.challengeStreak,
  });

  return challenge;
}

// ============================================
// Get Default Categories
// ============================================

function getDefaultCategories(): ChallengeCategory[] {
  return [
    ChallengeCategory.MINDFULNESS,
    ChallengeCategory.GRATITUDE,
    ChallengeCategory.SLEEP,
  ];
}

// ============================================
// Assign Challenge to User
// ============================================

async function assignChallengeToUser(
  user: InstanceType<typeof User>,
  challenge: InstanceType<typeof Challenge>
): Promise<void> {
  user.challengeState.currentChallengeId = challenge.id;
  user.challengeState.lastChallengeDate = new Date();
  await user.save();

  logger.info('Challenge assigned to user', {
    userId: user.id,
    challengeId: challenge.id,
  });
}

// ============================================
// Send Challenge Assignment Notification
// ============================================

async function sendChallengeAssignmentNotification(
  userId: string,
  challenge: InstanceType<typeof Challenge>
): Promise<void> {
  // Check preferences
  const preferenceCheck = await shouldSendNotification(
    userId,
    NotificationChannel.PUSH,
    NotificationType.CHALLENGE
  );

  if (!preferenceCheck.allowed) {
    logger.info('Challenge notification suppressed', {
      userId,
      reason: preferenceCheck.reason,
    });
    return;
  }

  const template = NOTIFICATION_TEMPLATES.CHALLENGE.NEW;

  const notificationData: INotificationJobData = {
    userId,
    type: NotificationType.CHALLENGE,
    channel: preferenceCheck.alternativeChannel || NotificationChannel.PUSH,
    priority: NotificationPriority.NORMAL,
    title: template.title,
    body: `${challenge.title}: ${challenge.description.substring(0, 100)}...`,
    data: {
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      category: challenge.category,
      duration: challenge.duration.toString(),
      action: 'open_challenge',
    },
  };

  await getNotificationQueue().add('send-notification', notificationData);

  logger.info('Challenge assignment notification sent', {
    userId,
    challengeId: challenge.id,
  });
}

// ============================================
// Send Challenge Reminder
// ============================================

async function sendChallengeReminder(
  userId: string,
  challenge: InstanceType<typeof Challenge>
): Promise<void> {
  const preferenceCheck = await shouldSendNotification(
    userId,
    NotificationChannel.PUSH,
    NotificationType.CHALLENGE
  );

  if (!preferenceCheck.allowed) {
    return;
  }

  const template = NOTIFICATION_TEMPLATES.CHALLENGE.REMINDER;

  const notificationData: INotificationJobData = {
    userId,
    type: NotificationType.CHALLENGE,
    channel: preferenceCheck.alternativeChannel || NotificationChannel.PUSH,
    priority: NotificationPriority.LOW,
    title: template.title,
    body: `Don't forget about "${challenge.title}"! Your daily task is waiting.`,
    data: {
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      action: 'open_challenge',
    },
  };

  await getNotificationQueue().add('send-notification', notificationData);
}

// ============================================
// Schedule Weekly Challenges
// ============================================

export async function scheduleWeeklyChallenges(): Promise<{
  assigned: number;
  errors: number;
}> {
  // Find users who are due for a new challenge
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const users = await User.findDueForChallenge(oneWeekAgo);

  let assigned = 0;
  let errors = 0;

  for (const user of users) {
    try {
      // Skip if user already has an active challenge
      if (user.challengeState.currentChallengeId) {
        continue;
      }

      const jobData: IChallengeAssignmentJobData = {
        userId: user.id,
        autoSelect: true,
        reason: 'scheduled',
      };

      await getNotificationQueue().add('assign-challenge', jobData);
      assigned++;
    } catch (error) {
      logger.error('Failed to schedule challenge', {
        userId: user.id,
        error: (error as Error).message,
      });
      errors++;
    }
  }

  logger.info('Scheduled weekly challenges', { assigned, errors, totalUsers: users.length });

  return { assigned, errors };
}

// ============================================
// Complete Challenge
// ============================================

export async function completeChallenge(
  userId: string,
  challengeId: string
): Promise<void> {
  const user = await User.findOne({ id: userId });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Add to completed challenges
  if (!user.challengeState.completedChallenges.includes(challengeId)) {
    user.challengeState.completedChallenges.push(challengeId);
  }

  // Clear current challenge
  user.challengeState.currentChallengeId = undefined;

  // Increment challenge streak
  user.challengeState.challengeStreak++;

  await user.save();

  // Send completion notification
  await sendChallengeCompletionNotification(userId, challengeId);

  logger.info('Challenge completed', { userId, challengeId });
}

// ============================================
// Send Challenge Completion Notification
// ============================================

async function sendChallengeCompletionNotification(
  userId: string,
  challengeId: string
): Promise<void> {
  const challenge = await Challenge.findOne({ id: challengeId });

  if (!challenge) {
    return;
  }

  const preferenceCheck = await shouldSendNotification(
    userId,
    NotificationChannel.PUSH,
    NotificationType.ACHIEVEMENT
  );

  if (!preferenceCheck.allowed) {
    return;
  }

  const template = NOTIFICATION_TEMPLATES.CHALLENGE.COMPLETED;

  const notificationData: INotificationJobData = {
    userId,
    type: NotificationType.ACHIEVEMENT,
    channel: preferenceCheck.alternativeChannel || NotificationChannel.PUSH,
    priority: NotificationPriority.NORMAL,
    title: template.title,
    body: `Great job completing "${challenge.title}"! 🎉`,
    data: {
      challengeId,
      challengeTitle: challenge.title,
      action: 'view_rewards',
    },
  };

  await getNotificationQueue().add('send-notification', notificationData);
}

// ============================================
// Get User's Current Challenge
// ============================================

export async function getUserCurrentChallenge(
  userId: string
): Promise<{
  challenge?: InstanceType<typeof Challenge>;
  progress: {
    day: number;
    totalDays: number;
    completed: boolean;
  };
} | null> {
  const user = await User.findOne({ id: userId });

  if (!user || !user.challengeState.currentChallengeId) {
    return null;
  }

  const challenge = await Challenge.findOne({
    id: user.challengeState.currentChallengeId,
  });

  if (!challenge) {
    return null;
  }

  // Calculate current day based on start date
  const startDate = user.challengeState.lastChallengeDate;
  const now = new Date();
  const daysSinceStart = startDate
    ? Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;

  const day = Math.min(daysSinceStart, challenge.duration);
  const completed = daysSinceStart > challenge.duration;

  return {
    challenge,
    progress: {
      day,
      totalDays: challenge.duration,
      completed,
    },
  };
}

// ============================================
// Skip Challenge
// ============================================

export async function skipChallenge(userId: string): Promise<void> {
  const user = await User.findOne({ id: userId });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Reset challenge streak
  user.challengeState.challengeStreak = 0;
  user.challengeState.currentChallengeId = undefined;

  await user.save();

  logger.info('Challenge skipped', { userId });
}
