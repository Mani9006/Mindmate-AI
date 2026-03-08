/**
 * Session Controller - MindMate AI
 * HTTP request handlers for session management endpoints
 */

const SessionService = require('../services/SessionService');
const { asyncHandler } = require('../middleware/errorHandler');

class SessionController {
  constructor(aiConfig = {}) {
    this.sessionService = new SessionService(aiConfig);
  }

  /**
   * POST /sessions/start
   * Create a new therapy session
   */
  startSession = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    
    // Check if user already has an active session
    const Session = require('../models/Session');
    const existingSession = await Session.findActiveByUser(userId);
    
    if (existingSession) {
      return res.status(409).json({
        success: false,
        error: 'You already have an active session',
        code: 'ACTIVE_SESSION_EXISTS',
        data: {
          sessionId: existingSession._id,
          startedAt: existingSession.startedAt
        }
      });
    }

    // Extract session configuration from request
    const sessionConfig = {
      therapyMode: req.body.therapyMode,
      language: req.body.language,
      aiPersona: req.body.aiPersona,
      sessionGoals: req.body.sessionGoals,
      maxDuration: req.body.maxDuration,
      userContext: req.body.userContext
    };

    // Extract metadata
    const metadata = {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      deviceType: this.detectDeviceType(req.get('user-agent')),
      source: req.body.source || 'web'
    };

    // Create session
    const session = await this.sessionService.createSession(userId, {
      ...sessionConfig,
      metadata
    });

    // Get the welcome message (last message in transcript)
    const welcomeMessage = session.transcript[session.transcript.length - 1];

    res.status(201).json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          startedAt: session.startedAt,
          config: session.config,
          welcomeMessage: {
            id: welcomeMessage.id,
            role: welcomeMessage.role,
            content: welcomeMessage.content,
            timestamp: welcomeMessage.timestamp
          }
        }
      }
    });
  });

  /**
   * POST /sessions/:id/message
   * Send a message and get AI response
   */
  sendMessage = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;
    const { content, metadata = {} } = req.body;

    const result = await this.sessionService.sendMessage(
      sessionId,
      userId,
      content,
      metadata
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * POST /sessions/:id/end
   * End a session and optionally generate summary
   */
  endSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;
    const { generateSummary = true } = req.body;

    const session = await this.sessionService.endSession(sessionId, userId, {
      generateSummary
    });

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          durationMinutes: session.metrics.durationMinutes,
          messageCount: session.metrics.messageCount,
          summary: session.summary ? {
            generatedAt: session.summary.generatedAt,
            keyPoints: session.summary.keyPoints,
            progressAssessment: session.summary.progressAssessment,
            actionItems: session.summary.actionItems,
            insights: session.summary.insights
          } : null
        }
      }
    });
  });

  /**
   * GET /sessions
   * List user's sessions with pagination
   */
  listSessions = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const {
      limit = 20,
      offset = 0,
      status,
      startDate,
      endDate
    } = req.query;

    const result = await this.sessionService.listSessions(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * GET /sessions/:id
   * Get session details with optional transcript
   */
  getSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;
    const includeTranscript = req.query.includeTranscript !== 'false';

    const session = await this.sessionService.getSession(sessionId, userId, {
      includeTranscript
    });

    // Format response based on whether transcript is included
    const responseData = {
      id: session._id,
      userId: session.userId,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      lastActivityAt: session.lastActivityAt,
      config: session.config,
      metrics: session.metrics,
      flags: session.flags
    };

    if (includeTranscript) {
      responseData.transcript = session.transcript;
      responseData.aiContext = {
        sessionInsights: session.aiContext.sessionInsights
      };
    }

    if (session.summary && session.summary.generatedAt) {
      responseData.summary = session.summary;
    }

    res.json({
      success: true,
      data: { session: responseData }
    });
  });

  /**
   * GET /sessions/stats
   * Get user's session statistics
   */
  getUserStats = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const stats = await this.sessionService.getUserStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  });

  /**
   * POST /sessions/:id/pause
   * Pause an active session
   */
  pauseSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;

    const session = await this.sessionService.pauseSession(sessionId, userId);

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          pausedAt: new Date()
        }
      }
    });
  });

  /**
   * POST /sessions/:id/resume
   * Resume a paused session
   */
  resumeSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;

    const session = await this.sessionService.resumeSession(sessionId, userId);

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          resumedAt: new Date()
        }
      }
    });
  });

  /**
   * POST /sessions/:id/archive
   * Archive an ended session
   */
  archiveSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;

    const session = await this.sessionService.archiveSession(sessionId, userId);

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          archivedAt: new Date()
        }
      }
    });
  });

  /**
   * DELETE /sessions/:id
   * Soft delete a session
   */
  deleteSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;

    await this.sessionService.deleteSession(sessionId, userId);

    res.json({
      success: true,
      data: { deleted: true }
    });
  });

  /**
   * POST /sessions/:id/feedback
   * Submit feedback for a session
   */
  submitFeedback = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;
    const { rating, comment, helpful } = req.body;

    const Session = require('../models/Session');
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Add feedback to session
    if (!session.feedback) {
      session.feedback = [];
    }
    
    session.feedback.push({
      rating,
      comment,
      helpful,
      submittedAt: new Date()
    });

    await session.save();

    res.json({
      success: true,
      data: { feedbackSubmitted: true }
    });
  });

  /**
   * GET /sessions/:id/export
   * Export session data
   */
  exportSession = asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;
    const format = req.query.format || 'json';

    const session = await this.sessionService.getSession(sessionId, userId, {
      includeTranscript: true
    });

    session.flags.exportedAt = new Date();
    await session.save();

    if (format === 'pdf') {
      // PDF export would be implemented here
      // For now, return JSON with export metadata
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.json"`);
    }

    const exportData = {
      exportMetadata: {
        exportedAt: new Date(),
        format,
        version: '1.0'
      },
      session: {
        id: session._id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        config: session.config,
        transcript: session.transcript.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })),
        summary: session.summary
      }
    };

    res.json({
      success: true,
      data: exportData
    });
  });

  /**
   * Helper: Detect device type from user agent
   */
  detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
      return /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    
    return 'desktop';
  }
}

module.exports = SessionController;
