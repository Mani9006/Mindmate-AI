/**
 * Session Management API - MindMate AI
 * Main entry point for the session management module
 */

const createSessionRoutes = require('./routes/sessionRoutes');
const SessionController = require('./controllers/SessionController');
const SessionService = require('./services/SessionService');
const Session = require('./models/Session');
const SessionWebSocket = require('./websocket/SessionWebSocket');
const { authenticate, requireSessionOwnership } = require('./middleware/auth');
const { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  requestIdMiddleware,
  requestLogger,
  AppError,
  SessionNotFoundError,
  InvalidSessionStateError,
  AIError
} = require('./middleware/errorHandler');
const { sessionValidators, wsValidators } = require('./utils/validators');
const AIClient = require('./utils/aiClient');

/**
 * Initialize the session management module
 * @param {Object} options - Configuration options
 * @param {Object} options.app - Express app instance
 * @param {Object} options.server - HTTP server instance (for WebSocket)
 * @param {Object} options.aiConfig - AI client configuration
 * @param {string} options.apiPrefix - API route prefix (default: '/api/v1')
 * @returns {Object} Module exports
 */
const initialize = (options = {}) => {
  const { 
    app, 
    server, 
    aiConfig = {}, 
    apiPrefix = '/api/v1' 
  } = options;

  // Setup middleware
  if (app) {
    app.use(requestIdMiddleware);
    app.use(requestLogger);

    // Mount session routes
    const sessionRoutes = createSessionRoutes({ aiConfig });
    app.use(`${apiPrefix}/sessions`, sessionRoutes);

    // Error handling (should be last)
    app.use(notFoundHandler);
    app.use(errorHandler);
  }

  // Setup WebSocket if server is provided
  let wsHandler = null;
  if (server) {
    wsHandler = new SessionWebSocket(server, { aiConfig });
  }

  return {
    routes: createSessionRoutes,
    controller: SessionController,
    service: SessionService,
    model: Session,
    websocket: wsHandler,
    middleware: {
      authenticate,
      requireSessionOwnership
    },
    errors: {
      AppError,
      SessionNotFoundError,
      InvalidSessionStateError,
      AIError
    },
    validators: {
      sessionValidators,
      wsValidators
    },
    utils: {
      AIClient
    }
  };
};

module.exports = {
  initialize,
  createSessionRoutes,
  SessionController,
  SessionService,
  Session,
  SessionWebSocket,
  authenticate,
  requireSessionOwnership,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestIdMiddleware,
  requestLogger,
  AppError,
  SessionNotFoundError,
  InvalidSessionStateError,
  AIError,
  sessionValidators,
  wsValidators,
  AIClient
};
