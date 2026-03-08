/**
 * Route Registration
 * Centralized route registration for all API endpoints
 */

import { Application, Router } from 'express';
import { config } from '../config';

// Import route modules
import authRoutes from './auth';
import userRoutes from './users';
import sessionRoutes from './sessions';
import messageRoutes from './messages';
import taskRoutes from './tasks';
import moodRoutes from './mood';
import notificationRoutes from './notifications';
import progressRoutes from './progress';
import crisisRoutes from './crisis';
import adminRoutes from './admin';

// API prefix
const API_PREFIX = config.app.apiPrefix;

/**
 * Register all routes
 */
export const registerRoutes = (app: Application): void => {
  // Health check and version are registered directly in server.ts

  // Authentication routes (public)
  app.use(`${API_PREFIX}/auth`, authRoutes);

  // User routes (authenticated)
  app.use(`${API_PREFIX}/users`, userRoutes);

  // Session routes (authenticated)
  app.use(`${API_PREFIX}/sessions`, sessionRoutes);

  // Message routes (authenticated)
  app.use(`${API_PREFIX}/sessions`, messageRoutes);

  // Task routes (authenticated)
  app.use(`${API_PREFIX}/tasks`, taskRoutes);

  // Mood routes (authenticated)
  app.use(`${API_PREFIX}/mood`, moodRoutes);

  // Notification routes (authenticated)
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);

  // Progress routes (authenticated)
  app.use(`${API_PREFIX}/progress`, progressRoutes);

  // Crisis routes (mixed - some public, some authenticated)
  app.use(`${API_PREFIX}/crisis`, crisisRoutes);

  // Admin routes (admin only)
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  // Log registered routes in development
  if (config.app.isDevelopment) {
    console.log('📡 Registered API Routes:');
    console.log(`  ${API_PREFIX}/auth - Authentication`);
    console.log(`  ${API_PREFIX}/users - User Management`);
    console.log(`  ${API_PREFIX}/sessions - Sessions`);
    console.log(`  ${API_PREFIX}/sessions/:id/messages - Messages`);
    console.log(`  ${API_PREFIX}/tasks - Tasks`);
    console.log(`  ${API_PREFIX}/mood - Mood Tracking`);
    console.log(`  ${API_PREFIX}/notifications - Notifications`);
    console.log(`  ${API_PREFIX}/progress - Progress`);
    console.log(`  ${API_PREFIX}/crisis - Crisis Support`);
    console.log(`  ${API_PREFIX}/admin - Admin`);
  }
};

/**
 * Create a base router with common middleware
 */
export const createBaseRouter = (): Router => {
  const router = Router({ mergeParams: true });
  return router;
};

export default registerRoutes;
