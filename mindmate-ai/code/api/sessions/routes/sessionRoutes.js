/**
 * Session Routes - MindMate AI
 * Route definitions for session management API
 */

const express = require('express');
const SessionController = require('../controllers/SessionController');
const { sessionValidators } = require('../utils/validators');
const { 
  authenticate, 
  requireSessionOwnership,
  createSessionRateLimit,
  messageRateLimit 
} = require('../middleware/auth');
const Session = require('../models/Session');

/**
 * Create and configure session routes
 */
const createSessionRoutes = (options = {}) => {
  const router = express.Router();
  const controller = new SessionController(options.aiConfig);

  // Apply authentication to all routes
  router.use(authenticate);

  // ============== SESSION LIFECYCLE ==============

  /**
   * POST /sessions/start
   * Create a new therapy session
   */
  router.post(
    '/start',
    createSessionRateLimit({ windowMs: 3600000, maxRequests: 10 }),
    sessionValidators.startSession,
    controller.startSession
  );

  /**
   * POST /sessions/:id/message
   * Send a message and get AI response
   */
  router.post(
    '/:id/message',
    messageRateLimit({ windowMs: 60000, maxMessages: 30 }),
    sessionValidators.sendMessage,
    requireSessionOwnership(Session),
    controller.sendMessage
  );

  /**
   * POST /sessions/:id/end
   * End a session and optionally generate summary
   */
  router.post(
    '/:id/end',
    sessionValidators.endSession,
    requireSessionOwnership(Session),
    controller.endSession
  );

  // ============== SESSION MANAGEMENT ==============

  /**
   * GET /sessions
   * List user's sessions with pagination
   */
  router.get(
    '/',
    sessionValidators.listSessions,
    controller.listSessions
  );

  /**
   * GET /sessions/stats
   * Get user's session statistics
   */
  router.get(
    '/stats',
    controller.getUserStats
  );

  /**
   * GET /sessions/:id
   * Get session details with optional transcript
   */
  router.get(
    '/:id',
    sessionValidators.getSession,
    requireSessionOwnership(Session),
    controller.getSession
  );

  /**
   * POST /sessions/:id/pause
   * Pause an active session
   */
  router.post(
    '/:id/pause',
    sessionValidators.getSession,
    requireSessionOwnership(Session),
    controller.pauseSession
  );

  /**
   * POST /sessions/:id/resume
   * Resume a paused session
   */
  router.post(
    '/:id/resume',
    sessionValidators.getSession,
    requireSessionOwnership(Session),
    controller.resumeSession
  );

  /**
   * POST /sessions/:id/archive
   * Archive an ended session
   */
  router.post(
    '/:id/archive',
    sessionValidators.getSession,
    requireSessionOwnership(Session),
    controller.archiveSession
  );

  /**
   * DELETE /sessions/:id
   * Soft delete a session
   */
  router.delete(
    '/:id',
    sessionValidators.getSession,
    requireSessionOwnership(Session),
    controller.deleteSession
  );

  // ============== SESSION INTERACTIONS ==============

  /**
   * POST /sessions/:id/feedback
   * Submit feedback for a session
   */
  router.post(
    '/:id/feedback',
    sessionValidators.getSession,
    requireSessionOwnership(Session),
    controller.submitFeedback
  );

  /**
   * GET /sessions/:id/export
   * Export session data
   */
  router.get(
    '/:id/export',
    sessionValidators.getSession,
    requireSessionOwnership(Session),
    controller.exportSession
  );

  return router;
};

module.exports = createSessionRoutes;
