/**
 * MindMate AI Notification Service - Scheduler
 * Cron-based scheduler for recurring notification jobs
 */

import cron from 'node-cron';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './utils/database';
import { connectRedis, resetDailyNotificationCounts } from './utils/redis';
import { initializeQueues, getScheduledQueue } from './queues';
import {
  scheduleAllCheckIns,
  checkStreaksAtRisk,
  sendStreakAtRiskNotification,
} from './jobs/checkInJob';
import { scheduleWeeklyChallenges } from './jobs/challengeJob';
import { reengageInactiveUsers } from './jobs/batchJob';
import { User } from './models';

// ============================================
// Scheduler State
// ============================================

interface ScheduledTask {
  name: string;
  task: cron.ScheduledTask;
  schedule: string;
  description: string;
}

const scheduledTasks: Map<string, ScheduledTask> = new Map();
let isRunning = false;

// ============================================
// Initialize Scheduler
// ============================================

async function initializeScheduler(): Promise<void> {
  logger.info('Initializing notification service scheduler...');

  try {
    // Connect to databases
    await connectRedis();
    await connectDatabase();

    // Initialize queues
    initializeQueues();

    // Setup scheduled tasks
    setupScheduledTasks();

    isRunning = true;
    logger.info('Scheduler initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduler', { error: (error as Error).message });
    throw error;
  }
}

// ============================================
// Setup Scheduled Tasks
// ============================================

function setupScheduledTasks(): void {
  // Daily check-in scheduler - runs every 5 minutes to check for users
  scheduleTask(
    'checkin-scheduler',
    '*/5 * * * *',
    'Check-in scheduler (every 5 minutes)',
    async () => {
      logger.debug('Running check-in scheduler...');
      try {
        const result = await scheduleAllCheckIns();
        logger.info('Check-in scheduler completed', result);
      } catch (error) {
        logger.error('Check-in scheduler failed', { error: (error as Error).message });
      }
    }
  );

  // Weekly challenge assignment - Mondays at 8 AM
  scheduleTask(
    'challenge-scheduler',
    config.scheduler.challengeSchedule,
    'Weekly challenge assignment (Mondays at 8 AM)',
    async () => {
      logger.info('Running weekly challenge scheduler...');
      try {
        const result = await scheduleWeeklyChallenges();
        logger.info('Challenge scheduler completed', result);
      } catch (error) {
        logger.error('Challenge scheduler failed', { error: (error as Error).message });
      }
    }
  );

  // Streak at-risk check - runs every hour
  scheduleTask(
    'streak-check',
    '0 * * * *',
    'Streak at-risk check (hourly)',
    async () => {
      logger.debug('Running streak at-risk check...');
      try {
        const atRiskUsers = await checkStreaksAtRisk();
        
        for (const user of atRiskUsers) {
          await sendStreakAtRiskNotification(user.userId, user.streakCount);
        }
        
        if (atRiskUsers.length > 0) {
          logger.info('Streak at-risk notifications sent', {
            count: atRiskUsers.length,
          });
        }
      } catch (error) {
        logger.error('Streak check failed', { error: (error as Error).message });
      }
    }
  );

  // Daily notification count reset - midnight
  scheduleTask(
    'reset-daily-counts',
    '0 0 * * *',
    'Reset daily notification counts (midnight)',
    async () => {
      logger.info('Resetting daily notification counts...');
      try {
        const today = new Date().toISOString().split('T')[0];
        await resetDailyNotificationCounts(today);
        
        const resetCount = await User.resetAllDailyCounts();
        logger.info('Daily notification counts reset', { resetCount });
      } catch (error) {
        logger.error('Reset daily counts failed', { error: (error as Error).message });
      }
    }
  );

  // Re-engagement campaign - weekly on Wednesdays
  scheduleTask(
    'reengagement-campaign',
    '0 10 * * 3',
    'Re-engagement campaign (Wednesdays at 10 AM)',
    async () => {
      logger.info('Running re-engagement campaign...');
      try {
        const result = await reengageInactiveUsers(7);
        logger.info('Re-engagement campaign completed', result);
      } catch (error) {
        logger.error('Re-engagement campaign failed', { error: (error as Error).message });
      }
    }
  );

  // Cleanup old jobs - daily at 3 AM
  scheduleTask(
    'cleanup-jobs',
    '0 3 * * *',
    'Cleanup old jobs (daily at 3 AM)',
    async () => {
      logger.info('Cleaning up old jobs...');
      try {
        const { cleanOldJobs } = await import('./queues');
        
        // Clean completed jobs older than 24 hours
        await cleanOldJobs('mindmate:notifications', 24 * 60 * 60 * 1000, 'completed');
        await cleanOldJobs('mindmate:push', 24 * 60 * 60 * 1000, 'completed');
        await cleanOldJobs('mindmate:sms', 24 * 60 * 60 * 1000, 'completed');
        
        logger.info('Old jobs cleaned up');
      } catch (error) {
        logger.error('Cleanup jobs failed', { error: (error as Error).message });
      }
    }
  );

  // Health check logging - every 5 minutes
  scheduleTask(
    'health-check',
    '*/5 * * * *',
    'Health check logging (every 5 minutes)',
    async () => {
      try {
        const { getQueueStatus } = await import('./queues');
        const queueStatus = await getQueueStatus();
        
        // Log queue depths
        for (const [queueName, status] of Object.entries(queueStatus)) {
          if (status.waiting > 100 || status.failed > 10) {
            logger.warn('Queue health check alert', {
              queue: queueName,
              waiting: status.waiting,
              failed: status.failed,
            });
          }
        }
      } catch (error) {
        logger.error('Health check failed', { error: (error as Error).message });
      }
    }
  );

  logger.info('All scheduled tasks setup complete', {
    tasks: Array.from(scheduledTasks.keys()),
  });
}

// ============================================
// Schedule a Task
// ============================================

function scheduleTask(
  name: string,
  schedule: string,
  description: string,
  handler: () => Promise<void>
): void {
  // Validate cron expression
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid cron expression: ${schedule}`);
  }

  const task = cron.schedule(schedule, async () => {
    logger.debug(`Running scheduled task: ${name}`);
    try {
      await handler();
    } catch (error) {
      logger.error(`Scheduled task ${name} failed`, { error: (error as Error).message });
    }
  }, {
    scheduled: true,
    timezone: config.scheduler.timezoneDefault,
  });

  scheduledTasks.set(name, { name, task, schedule, description });
  logger.info(`Scheduled task: ${name} (${description})`);
}

// ============================================
// Stop a Task
// ============================================

export function stopTask(name: string): boolean {
  const scheduledTask = scheduledTasks.get(name);
  if (scheduledTask) {
    scheduledTask.task.stop();
    scheduledTasks.delete(name);
    logger.info(`Stopped scheduled task: ${name}`);
    return true;
  }
  return false;
}

// ============================================
// Start a Task
// ============================================

export function startTask(name: string): boolean {
  const scheduledTask = scheduledTasks.get(name);
  if (scheduledTask) {
    scheduledTask.task.start();
    logger.info(`Started scheduled task: ${name}`);
    return true;
  }
  return false;
}

// ============================================
// Get Scheduled Tasks Status
// ============================================

export function getScheduledTasksStatus(): Array<{
  name: string;
  schedule: string;
  description: string;
  running: boolean;
}> {
  return Array.from(scheduledTasks.values()).map(task => ({
    name: task.name,
    schedule: task.schedule,
    description: task.description,
    running: isRunning,
  }));
}

// ============================================
// Run Task Manually
// ============================================

export async function runTaskManually(name: string): Promise<boolean> {
  const task = scheduledTasks.get(name);
  if (!task) {
    return false;
  }

  logger.info(`Manually running task: ${name}`);
  
  // Trigger the task
  task.task.now();
  
  return true;
}

// ============================================
// Graceful Shutdown
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Scheduler received ${signal}, stopping tasks...`);

  isRunning = false;

  // Stop all scheduled tasks
  for (const [name, task] of scheduledTasks) {
    task.task.stop();
    logger.info(`Stopped task: ${name}`);
  }

  scheduledTasks.clear();

  logger.info('Scheduler shutdown complete');
  process.exit(0);
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
    await initializeScheduler();

    logger.info('Scheduler is running and waiting for scheduled tasks...');
  } catch (error) {
    logger.error('Scheduler failed to start', { error: (error as Error).message });
    process.exit(1);
  }
}

// Start the scheduler
main();

// Export for testing
export { initializeScheduler, setupScheduledTasks, gracefulShutdown, scheduleTask };
