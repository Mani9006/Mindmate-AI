/**
 * Winston Logger Configuration
 * Production-ready logging with rotation and multiple transports
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config';

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Custom log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray',
};

// Add colors to winston
winston.addColors(logColors);

// Format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: config.app.isDevelopment ? 'debug' : config.log.level,
  }),
];

// Add file transports in production
if (config.app.isProduction) {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(config.log.filePath, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: `${config.log.maxFiles}d`,
      maxSize: '20m',
      zippedArchive: true,
    })
  );

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(config.log.filePath, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: `${config.log.maxFiles}d`,
      maxSize: '50m',
      zippedArchive: true,
    })
  );

  // HTTP request log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(config.log.filePath, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: fileFormat,
      maxFiles: `${config.log.maxFiles}d`,
      maxSize: '100m',
      zippedArchive: true,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: config.log.level,
  defaultMeta: {
    service: 'mindmate-ai-api',
    environment: config.app.env,
  },
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: config.app.isProduction
    ? [
        new DailyRotateFile({
          filename: path.join(config.log.filePath, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: `${config.log.maxFiles}d`,
          zippedArchive: true,
        }),
      ]
    : [],
  // Handle unhandled promise rejections
  rejectionHandlers: config.app.isProduction
    ? [
        new DailyRotateFile({
          filename: path.join(config.log.filePath, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: `${config.log.maxFiles}d`,
          zippedArchive: true,
        }),
      ]
    : [],
  exitOnError: false,
});

// Morgan stream for HTTP logging
export const stream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// Request context logger
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Performance logging helper
export const logPerformance = (
  operation: string,
  durationMs: number,
  metadata?: Record<string, unknown>
): void => {
  const level = durationMs > 1000 ? 'warn' : 'debug';
  logger.log(level, `Performance: ${operation}`, {
    operation,
    duration_ms: durationMs,
    ...metadata,
  });
};

// Error logging helper with stack trace
export const logError = (
  error: Error,
  context?: Record<string, unknown>
): void => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

// Audit logging helper
export const logAudit = (
  action: string,
  userId: string,
  details: Record<string, unknown>
): void => {
  logger.info(`Audit: ${action}`, {
    audit: true,
    action,
    user_id: userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Security logging helper
export const logSecurity = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, unknown>
): void => {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  logger.log(level, `Security: ${event}`, {
    security: true,
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export { logger };
