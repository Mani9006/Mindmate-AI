/**
 * MindMate AI Notification Service - Logger
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

// ============================================
// Log Format
// ============================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// ============================================
// Transports
// ============================================

const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (config.nodeEnv === 'production') {
  // Application logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );

  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: logFormat,
    })
  );

  // Notification logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/notifications-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '7d',
      format: logFormat,
    })
  );
}

// ============================================
// Logger Instance
// ============================================

export const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: {
    service: 'notification-service',
    environment: config.nodeEnv,
  },
  transports,
  exitOnError: false,
});

// ============================================
// Stream for Morgan (HTTP logging)
// ============================================

export const logStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

// ============================================
// Helper Functions
// ============================================

export function logNotification(
  userId: string,
  type: string,
  channel: string,
  status: string,
  metadata?: Record<string, any>
): void {
  logger.info('Notification processed', {
    userId,
    notificationType: type,
    channel,
    status,
    ...metadata,
  });
}

export function logQueueEvent(
  queueName: string,
  event: string,
  jobId: string | number,
  metadata?: Record<string, any>
): void {
  logger.info('Queue event', {
    queueName,
    event,
    jobId,
    ...metadata,
  });
}

export function logError(
  error: Error,
  context?: Record<string, any>
): void {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

export function logJobProgress(
  jobName: string,
  progress: { processed: number; total: number; failed: number }
): void {
  const percentage = Math.round((progress.processed / progress.total) * 100);
  logger.info(`Job progress: ${jobName}`, {
    jobName,
    ...progress,
    percentage,
  });
}
