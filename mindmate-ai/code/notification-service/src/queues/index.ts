/**
 * MindMate AI Notification Service - Bull Queue Configuration
 */

import Bull, { Queue, Job } from 'bull';
import { config, QUEUE_NAMES, JOB_NAMES } from '../config';
import { getRedisUrl } from '../config';
import { logger } from '../utils/logger';
import {
  INotificationJobData,
  ICheckInJobData,
  IChallengeAssignmentJobData,
  IBatchNotificationJobData,
} from '../types';

// ============================================
// Queue Instances
// ============================================

let notificationQueue: Queue<INotificationJobData> | null = null;
let checkInQueue: Queue<ICheckInJobData> | null = null;
let challengeQueue: Queue<IChallengeAssignmentJobData> | null = null;
let pushQueue: Queue<INotificationJobData> | null = null;
let smsQueue: Queue<INotificationJobData> | null = null;
let emailQueue: Queue<INotificationJobData> | null = null;
let batchQueue: Queue<IBatchNotificationJobData> | null = null;
let scheduledQueue: Queue<any> | null = null;

// ============================================
// Default Queue Options
// ============================================

const defaultQueueOptions: Bull.QueueOptions = {
  redis: getRedisUrl(),
  defaultJobOptions: {
    attempts: config.queue.attempts,
    backoff: {
      type: config.queue.backoff.type,
      delay: config.queue.backoff.delay,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 2,
    guardInterval: 5000,
  },
};

// ============================================
// Queue Factory
// ============================================

function createQueue<T>(name: string, options?: Bull.QueueOptions): Queue<T> {
  const queue = new Bull<T>(name, {
    ...defaultQueueOptions,
    ...options,
  });

  // Event handlers
  queue.on('completed', (job: Job<T>) => {
    logger.info(`Job completed`, { queue: name, jobId: job.id });
  });

  queue.on('failed', (job: Job<T>, error: Error) => {
    logger.error(`Job failed`, {
      queue: name,
      jobId: job.id,
      error: error.message,
      attemptsMade: job.attemptsMade,
    });
  });

  queue.on('stalled', (job: Job<T>) => {
    logger.warn(`Job stalled`, { queue: name, jobId: job.id });
  });

  queue.on('progress', (job: Job<T>, progress: number) => {
    logger.debug(`Job progress`, { queue: name, jobId: job.id, progress });
  });

  queue.on('error', (error: Error) => {
    logger.error(`Queue error`, { queue: name, error: error.message });
  });

  return queue;
}

// ============================================
// Get Queue Instances
// ============================================

export function getNotificationQueue(): Queue<INotificationJobData> {
  if (!notificationQueue) {
    notificationQueue = createQueue<INotificationJobData>(QUEUE_NAMES.NOTIFICATIONS);
  }
  return notificationQueue;
}

export function getCheckInQueue(): Queue<ICheckInJobData> {
  if (!checkInQueue) {
    checkInQueue = createQueue<ICheckInJobData>(QUEUE_NAMES.CHECKINS, {
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
      },
    });
  }
  return checkInQueue;
}

export function getChallengeQueue(): Queue<IChallengeAssignmentJobData> {
  if (!challengeQueue) {
    challengeQueue = createQueue<IChallengeAssignmentJobData>(QUEUE_NAMES.CHALLENGES);
  }
  return challengeQueue;
}

export function getPushQueue(): Queue<INotificationJobData> {
  if (!pushQueue) {
    pushQueue = createQueue<INotificationJobData>(QUEUE_NAMES.PUSH, {
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 3,
        timeout: 10000, // 10 seconds
      },
    });
  }
  return pushQueue;
}

export function getSMSQueue(): Queue<INotificationJobData> {
  if (!smsQueue) {
    smsQueue = createQueue<INotificationJobData>(QUEUE_NAMES.SMS, {
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 3,
        timeout: 30000, // 30 seconds
      },
    });
  }
  return smsQueue;
}

export function getEmailQueue(): Queue<INotificationJobData> {
  if (!emailQueue) {
    emailQueue = createQueue<INotificationJobData>(QUEUE_NAMES.EMAIL, {
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 3,
        timeout: 30000, // 30 seconds
      },
    });
  }
  return emailQueue;
}

export function getBatchQueue(): Queue<IBatchNotificationJobData> {
  if (!batchQueue) {
    batchQueue = createQueue<IBatchNotificationJobData>(QUEUE_NAMES.BATCH, {
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 2,
      },
    });
  }
  return batchQueue;
}

export function getScheduledQueue(): Queue<any> {
  if (!scheduledQueue) {
    scheduledQueue = createQueue<any>(QUEUE_NAMES.SCHEDULED, {
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 3,
      },
    });
  }
  return scheduledQueue;
}

// ============================================
// Initialize All Queues
// ============================================

export function initializeQueues(): void {
  getNotificationQueue();
  getCheckInQueue();
  getChallengeQueue();
  getPushQueue();
  getSMSQueue();
  getEmailQueue();
  getBatchQueue();
  getScheduledQueue();
  
  logger.info('All queues initialized');
}

// ============================================
// Close All Queues
// ============================================

export async function closeQueues(): Promise<void> {
  const queues = [
    notificationQueue,
    checkInQueue,
    challengeQueue,
    pushQueue,
    smsQueue,
    emailQueue,
    batchQueue,
    scheduledQueue,
  ];

  for (const queue of queues) {
    if (queue) {
      await queue.close();
    }
  }

  logger.info('All queues closed');
}

// ============================================
// Get Queue Status
// ============================================

export async function getQueueStatus(): Promise<{
  [queueName: string]: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  };
}> {
  const queues = [
    { name: QUEUE_NAMES.NOTIFICATIONS, queue: getNotificationQueue() },
    { name: QUEUE_NAMES.CHECKINS, queue: getCheckInQueue() },
    { name: QUEUE_NAMES.CHALLENGES, queue: getChallengeQueue() },
    { name: QUEUE_NAMES.PUSH, queue: getPushQueue() },
    { name: QUEUE_NAMES.SMS, queue: getSMSQueue() },
    { name: QUEUE_NAMES.EMAIL, queue: getEmailQueue() },
    { name: QUEUE_NAMES.BATCH, queue: getBatchQueue() },
    { name: QUEUE_NAMES.SCHEDULED, queue: getScheduledQueue() },
  ];

  const status: any = {};

  for (const { name, queue } of queues) {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    status[name] = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  return status;
}

// ============================================
// Pause/Resume Queues
// ============================================

export async function pauseAllQueues(): Promise<void> {
  const queues = [
    getNotificationQueue(),
    getCheckInQueue(),
    getChallengeQueue(),
    getPushQueue(),
    getSMSQueue(),
    getEmailQueue(),
    getBatchQueue(),
  ];

  await Promise.all(queues.map(queue => queue.pause()));
  logger.info('All queues paused');
}

export async function resumeAllQueues(): Promise<void> {
  const queues = [
    getNotificationQueue(),
    getCheckInQueue(),
    getChallengeQueue(),
    getPushQueue(),
    getSMSQueue(),
    getEmailQueue(),
    getBatchQueue(),
  ];

  await Promise.all(queues.map(queue => queue.resume()));
  logger.info('All queues resumed');
}

// ============================================
// Clean Old Jobs
// ============================================

export async function cleanOldJobs(
  queueName: string,
  gracePeriodMs: number = 24 * 60 * 60 * 1000, // 24 hours
  status: 'completed' | 'failed' = 'completed'
): Promise<void> {
  const queueMap: { [key: string]: Queue<any> } = {
    [QUEUE_NAMES.NOTIFICATIONS]: getNotificationQueue(),
    [QUEUE_NAMES.CHECKINS]: getCheckInQueue(),
    [QUEUE_NAMES.CHALLENGES]: getChallengeQueue(),
    [QUEUE_NAMES.PUSH]: getPushQueue(),
    [QUEUE_NAMES.SMS]: getSMSQueue(),
    [QUEUE_NAMES.EMAIL]: getEmailQueue(),
    [QUEUE_NAMES.BATCH]: getBatchQueue(),
    [QUEUE_NAMES.SCHEDULED]: getScheduledQueue(),
  };

  const queue = queueMap[queueName];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}`);
  }

  await queue.clean(gracePeriodMs, status);
  logger.info(`Cleaned ${status} jobs from ${queueName}`, { gracePeriodMs });
}

// ============================================
// Export Job Names
// ============================================

export { JOB_NAMES, QUEUE_NAMES };
