/**
 * MindMate AI Notification Service - Worker
 * Bull queue worker that processes notification jobs
 */

import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './utils/database';
import { connectRedis } from './utils/redis';
import {
  initializeQueues,
  getNotificationQueue,
  getCheckInQueue,
  getChallengeQueue,
  getPushQueue,
  getSMSQueue,
  getEmailQueue,
  getBatchQueue,
  closeQueues,
  QUEUE_NAMES,
} from './queues';
import {
  initializeAllPushServices,
  initializeTwilio,
  closePushServices,
} from './services';
import {
  processNotificationJob,
  processPushJob,
  processSMSJob,
  processEmailJob,
  processCheckInJob,
  processChallengeAssignmentJob,
  processBatchNotificationJob,
} from './jobs';

// ============================================
// Worker State
// ============================================

let isRunning = false;

// ============================================
// Initialize Worker
// ============================================

async function initializeWorker(): Promise<void> {
  logger.info('Initializing notification service worker...');

  try {
    // Connect to databases
    await connectRedis();
    await connectDatabase();

    // Initialize notification services
    initializeAllPushServices();
    initializeTwilio();

    // Initialize queues
    initializeQueues();

    // Setup queue processors
    setupQueueProcessors();

    isRunning = true;
    logger.info('Worker initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize worker', { error: (error as Error).message });
    throw error;
  }
}

// ============================================
// Setup Queue Processors
// ============================================

function setupQueueProcessors(): void {
  // Main notification queue
  const notificationQueue = getNotificationQueue();
  notificationQueue.process(
    config.queue.concurrency,
    async (job) => {
      return processNotificationJob(job);
    }
  );

  // Push notification queue
  const pushQueue = getPushQueue();
  pushQueue.process(
    config.queue.concurrency,
    async (job) => {
      return processPushJob(job);
    }
  );

  // SMS queue
  const smsQueue = getSMSQueue();
  smsQueue.process(
    Math.max(1, Math.floor(config.queue.concurrency / 2)), // Lower concurrency for SMS
    async (job) => {
      return processSMSJob(job);
    }
  );

  // Email queue
  const emailQueue = getEmailQueue();
  emailQueue.process(
    config.queue.concurrency,
    async (job) => {
      return processEmailJob(job);
    }
  );

  // Check-in queue
  const checkInQueue = getCheckInQueue();
  checkInQueue.process(
    config.queue.concurrency,
    async (job) => {
      return processCheckInJob(job);
    }
  );

  // Challenge queue
  const challengeQueue = getChallengeQueue();
  challengeQueue.process(
    config.queue.concurrency,
    async (job) => {
      return processChallengeAssignmentJob(job);
    }
  );

  // Batch queue
  const batchQueue = getBatchQueue();
  batchQueue.process(
    Math.max(1, Math.floor(config.queue.concurrency / 2)),
    async (job) => {
      return processBatchNotificationJob(job);
    }
  );

  logger.info('Queue processors setup complete', {
    queues: [
      QUEUE_NAMES.NOTIFICATIONS,
      QUEUE_NAMES.PUSH,
      QUEUE_NAMES.SMS,
      QUEUE_NAMES.EMAIL,
      QUEUE_NAMES.CHECKINS,
      QUEUE_NAMES.CHALLENGES,
      QUEUE_NAMES.BATCH,
    ],
  });
}

// ============================================
// Graceful Shutdown
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  isRunning = false;

  try {
    // Close queues (wait for active jobs to complete)
    await closeQueues();

    // Close push services
    await closePushServices();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
}

// ============================================
// Health Check
// ============================================

export async function getWorkerHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  isRunning: boolean;
  timestamp: Date;
}> {
  return {
    status: isRunning ? 'healthy' : 'unhealthy',
    isRunning,
    timestamp: new Date(),
  };
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  // Setup signal handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
  });

  try {
    await initializeWorker();

    // Keep the process alive
    setInterval(() => {
      if (!isRunning) {
        logger.warn('Worker is not running');
      }
    }, 30000);

    logger.info('Worker is running and waiting for jobs...');
  } catch (error) {
    logger.error('Worker failed to start', { error: (error as Error).message });
    process.exit(1);
  }
}

// Start the worker
main();

// Export for testing
export { initializeWorker, setupQueueProcessors, gracefulShutdown };
