/**
 * Authentication Middleware - MindMate AI
 * Handles user authentication and authorization for session routes
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
const generateToken = (userId, additionalClaims = {}) => {
  return jwt.sign(
    { 
      userId,
      ...additionalClaims 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter (for WebSocket connections)
  if (req.query && req.query.token) {
    return req.query.token;
  }

  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

/**
 * Main authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const { valid, decoded, error } = await verifyToken(token);

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        details: error
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      ...decoded
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const { valid, decoded } = await verifyToken(token);
      if (valid) {
        req.user = { userId: decoded.userId, ...decoded };
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

/**
 * Session ownership middleware
 * Ensures user can only access their own sessions
 */
const requireSessionOwnership = (SessionModel) => async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const session = await SessionModel.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - you do not own this session'
      });
    }

    // Attach session to request for later use
    req.session = session;
    next();
  } catch (error) {
    console.error('Session ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify session ownership'
    });
  }
};

/**
 * Admin role middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * Rate limiting middleware for session creation
 */
const createSessionRateLimit = (options = {}) => {
  const { windowMs = 3600000, maxRequests = 10 } = options;
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) return next();

    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `session_create:${userId}`;

    // Get or initialize user's request timestamps
    let userRequests = requests.get(key) || [];
    
    // Filter to only include requests within the window
    userRequests = userRequests.filter(time => time > windowStart);

    if (userRequests.length >= maxRequests) {
      const oldestRequest = userRequests[0];
      const resetTime = oldestRequest + windowMs;
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((resetTime - now) / 1000)
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

/**
 * Message rate limiting per session
 */
const messageRateLimit = (options = {}) => {
  const { windowMs = 60000, maxMessages = 30 } = options;
  const messages = new Map();

  return (req, res, next) => {
    const sessionId = req.params.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `messages:${sessionId}`;

    let sessionMessages = messages.get(key) || [];
    sessionMessages = sessionMessages.filter(time => time > windowStart);

    if (sessionMessages.length >= maxMessages) {
      const resetTime = sessionMessages[0] + windowMs;
      
      return res.status(429).json({
        success: false,
        error: 'Message rate limit exceeded',
        code: 'MESSAGE_RATE_LIMIT',
        retryAfter: Math.ceil((resetTime - now) / 1000)
      });
    }

    sessionMessages.push(now);
    messages.set(key, sessionMessages);

    next();
  };
};

/**
 * WebSocket authentication handler
 */
const wsAuthenticate = async (ws, req) => {
  try {
    const token = extractToken(req);

    if (!token) {
      ws.close(4001, 'Authentication required');
      return null;
    }

    const { valid, decoded, error } = await verifyToken(token);

    if (!valid) {
      ws.close(4001, `Authentication failed: ${error}`);
      return null;
    }

    return { userId: decoded.userId, ...decoded };
  } catch (error) {
    ws.close(4001, 'Authentication error');
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  authenticate,
  optionalAuth,
  requireSessionOwnership,
  requireAdmin,
  createSessionRateLimit,
  messageRateLimit,
  wsAuthenticate
};
