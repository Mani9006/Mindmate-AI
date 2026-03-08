/**
 * Error Handling Middleware - MindMate AI
 * Centralized error handling for session management API
 */

const { ValidationError } = require('express-validator');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class SessionNotFoundError extends AppError {
  constructor(sessionId) {
    super(`Session not found: ${sessionId}`, 404, 'SESSION_NOT_FOUND');
  }
}

class SessionExpiredError extends AppError {
  constructor() {
    super('Session has expired', 410, 'SESSION_EXPIRED');
  }
}

class InvalidSessionStateError extends AppError {
  constructor(currentState, expectedState) {
    super(
      `Invalid session state: expected ${expectedState}, got ${currentState}`,
      409,
      'INVALID_SESSION_STATE'
    );
  }
}

class AIError extends AppError {
  constructor(message, originalError = null) {
    super(message || 'AI service error', 503, 'AI_SERVICE_ERROR');
    this.originalError = originalError;
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

class ValidationAppError extends AppError {
  constructor(message, details = []) {
    super(message || 'Validation failed', 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Error codes mapping
const errorCodes = {
  // Database errors
  11000: { status: 409, code: 'DUPLICATE_KEY', message: 'Resource already exists' },
  
  // MongoDB errors
  CastError: { status: 400, code: 'INVALID_ID', message: 'Invalid identifier format' },
  ValidationError: { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  
  // JWT errors
  JsonWebTokenError: { status: 401, code: 'INVALID_TOKEN', message: 'Invalid token' },
  TokenExpiredError: { status: 401, code: 'TOKEN_EXPIRED', message: 'Token has expired' },
  
  // AI service errors
  EAI_AGAIN: { status: 503, code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable' },
  ETIMEDOUT: { status: 504, code: 'AI_TIMEOUT', message: 'AI service timeout' },
  ECONNREFUSED: { status: 503, code: 'AI_CONNECTION_ERROR', message: 'Cannot connect to AI service' }
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method,
    userId: req.user?.userId
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Handle specific error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  }
  // Handle Mongoose errors
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  else if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }
  // Handle Axios errors (AI service)
  else if (err.isAxiosError) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      statusCode = 503;
      errorCode = 'AI_UNAVAILABLE';
      message = 'AI service is currently unavailable';
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      statusCode = 504;
      errorCode = 'AI_TIMEOUT';
      message = 'AI service request timed out';
    } else if (err.response) {
      statusCode = 502;
      errorCode = 'AI_ERROR';
      message = 'AI service returned an error';
      details = {
        status: err.response.status,
        data: err.response.data
      };
    }
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: message,
    code: errorCode
  };

  if (details) {
    errorResponse.details = details;
  }

  // Add retry-after header for rate limit errors
  if (err instanceof RateLimitError && err.retryAfter) {
    res.set('Retry-After', err.retryAfter);
  }

  // Add request ID for tracking
  errorResponse.requestId = req.id;

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

/**
 * Async handler wrapper to catch errors in async routes
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Request ID middleware for error tracking
 */
const requestIdMiddleware = (req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.set('X-Request-Id', req.id);
  next();
};

/**
 * Logger middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      requestId: req.id,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  });

  next();
};

/**
 * WebSocket error handler
 */
const wsErrorHandler = (ws, error) => {
  console.error('WebSocket error:', error);
  
  let errorMessage = {
    type: 'error',
    error: 'An error occurred',
    code: 'WS_ERROR'
  };

  if (error instanceof AppError) {
    errorMessage.error = error.message;
    errorMessage.code = error.code;
  } else if (error.message) {
    errorMessage.error = error.message;
  }

  try {
    ws.send(JSON.stringify(errorMessage));
  } catch (sendError) {
    console.error('Failed to send error message to WebSocket:', sendError);
  }
};

module.exports = {
  // Error classes
  AppError,
  SessionNotFoundError,
  SessionExpiredError,
  InvalidSessionStateError,
  AIError,
  RateLimitError,
  ValidationAppError,
  UnauthorizedError,
  ForbiddenError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestIdMiddleware,
  requestLogger,
  wsErrorHandler
};
