/**
 * MindMate AI Notification Service - Database Connection
 */

import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from './logger';

// ============================================
// Connection Options
// ============================================

const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0,
};

// ============================================
// Connection State
// ============================================

let isConnected = false;

// ============================================
// Connect to MongoDB
// ============================================

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    logger.debug('Using existing MongoDB connection');
    return mongoose;
  }

  try {
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri.replace(/\/\/.*@/, '//***@') });
    
    const connection = await mongoose.connect(config.mongodb.uri, mongooseOptions);
    
    isConnected = true;
    logger.info('MongoDB connected successfully');

    // Event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

// ============================================
// Disconnect from MongoDB
// ============================================

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: (error as Error).message });
    throw error;
  }
}

// ============================================
// Graceful Shutdown
// ============================================

async function gracefulShutdown(): Promise<void> {
  logger.info('Shutting down MongoDB connection...');
  await disconnectDatabase();
  process.exit(0);
}

// ============================================
// Health Check
// ============================================

export function isDatabaseHealthy(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getConnectionState(): string {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}
