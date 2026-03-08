/**
 * Validators Utility - MindMate AI
 * Input validation helpers for session management
 */

const { body, param, query, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// UUID validator
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// Session validators
const sessionValidators = {
  // POST /sessions/start
  startSession: [
    body('therapyMode')
      .optional()
      .isIn(['cbt', 'dbt', 'act', 'general', 'crisis', 'mindfulness'])
      .withMessage('Invalid therapy mode'),
    
    body('language')
      .optional()
      .isLength({ min: 2, max: 5 })
      .withMessage('Language code must be 2-5 characters'),
    
    body('aiPersona')
      .optional()
      .isIn(['empathetic', 'professional', 'casual', 'directive'])
      .withMessage('Invalid AI persona'),
    
    body('sessionGoals')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Maximum 5 session goals allowed'),
    
    body('sessionGoals.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('Each goal must be 1-200 characters'),
    
    body('maxDuration')
      .optional()
      .isInt({ min: 5, max: 180 })
      .withMessage('Duration must be between 5 and 180 minutes'),
    
    body('userContext')
      .optional()
      .isObject()
      .withMessage('User context must be an object'),
    
    handleValidationErrors
  ],

  // POST /sessions/:id/message
  sendMessage: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Invalid session ID format'),
    
    body('content')
      .exists()
      .withMessage('Message content is required')
      .isString()
      .withMessage('Content must be a string')
      .isLength({ min: 1, max: 4000 })
      .withMessage('Message must be between 1 and 4000 characters')
      .trim()
      .escape(),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
    
    handleValidationErrors
  ],

  // POST /sessions/:id/end
  endSession: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Invalid session ID format'),
    
    body('generateSummary')
      .optional()
      .isBoolean()
      .withMessage('generateSummary must be a boolean'),
    
    handleValidationErrors
  ],

  // GET /sessions
  listSessions: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
      .toInt(),
    
    query('status')
      .optional()
      .isIn(['active', 'paused', 'ended', 'archived'])
      .withMessage('Invalid status filter'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    
    handleValidationErrors
  ],

  // GET /sessions/:id
  getSession: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Invalid session ID format'),
    
    query('includeTranscript')
      .optional()
      .isBoolean()
      .withMessage('includeTranscript must be a boolean')
      .toBoolean(),
    
    handleValidationErrors
  ]
};

// WebSocket message validators
const wsValidators = {
  validateMessage: (data) => {
    const errors = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid message format'] };
    }

    if (!data.type) {
      errors.push('Message type is required');
    }

    if (!['message', 'typing', 'ping', 'reaction', 'feedback'].includes(data.type)) {
      errors.push('Invalid message type');
    }

    if (data.type === 'message') {
      if (!data.content || typeof data.content !== 'string') {
        errors.push('Message content is required');
      } else if (data.content.length > 4000) {
        errors.push('Message content exceeds maximum length of 4000 characters');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  validateAuth: (data) => {
    if (!data || !data.token) {
      return { valid: false, error: 'Authentication token required' };
    }
    return { valid: true };
  }
};

// Custom sanitizers
const sanitizers = {
  sanitizeMessage: (content) => {
    return content
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 4000); // Enforce max length
  },

  sanitizeSessionConfig: (config) => {
    const allowedFields = ['therapyMode', 'language', 'aiPersona', 'sessionGoals', 'maxDuration'];
    const sanitized = {};
    
    allowedFields.forEach(field => {
      if (config[field] !== undefined) {
        sanitized[field] = config[field];
      }
    });

    return sanitized;
  }
};

// Rate limiting helpers
const rateLimitHelpers = {
  // Message rate limits per session
  sessionMessageLimits: {
    windowMs: 60000, // 1 minute
    maxMessages: 30 // Max 30 messages per minute per session
  },

  // Session creation limits per user
  sessionCreationLimits: {
    windowMs: 3600000, // 1 hour
    maxSessions: 10 // Max 10 new sessions per hour
  },

  checkRateLimit: (key, store, limits) => {
    const now = Date.now();
    const windowStart = now - limits.windowMs;
    
    // Clean old entries
    store.forEach((timestamp, k) => {
      if (timestamp < windowStart) {
        store.delete(k);
      }
    });

    // Count entries in current window
    let count = 0;
    store.forEach((timestamp, k) => {
      if (k.startsWith(key) && timestamp >= windowStart) {
        count++;
      }
    });

    return {
      allowed: count < limits.maxMessages,
      remaining: limits.maxMessages - count,
      resetTime: now + limits.windowMs
    };
  }
};

module.exports = {
  sessionValidators,
  wsValidators,
  sanitizers,
  rateLimitHelpers,
  handleValidationErrors,
  isValidUUID
};
