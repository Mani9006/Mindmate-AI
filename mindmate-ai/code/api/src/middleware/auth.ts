/**
 * Authentication & Authorization Middleware
 * JWT token validation and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import { AuthenticationError, AuthorizationError } from './errorHandler';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  subscriptionTier: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;
}

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    subscriptionTier: string;
  };
  token?: string;
  tokenPayload?: JWTPayload;
}

// Token types
export type TokenType = 'access' | 'refresh';

/**
 * Generate JWT tokens
 */
export const generateTokens = (
  userId: string,
  email: string,
  role: string = 'user',
  subscriptionTier: string = 'free'
): { accessToken: string; refreshToken: string; expiresIn: number } => {
  const jti = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Access token payload
  const accessPayload = {
    userId,
    email,
    role,
    subscriptionTier,
    iat: now,
    iss: config.security.jwtIssuer,
    aud: config.security.jwtAudience,
    jti,
  };

  // Refresh token payload
  const refreshPayload = {
    userId,
    type: 'refresh',
    jti: crypto.randomUUID(),
    iat: now,
    iss: config.security.jwtIssuer,
    aud: config.security.jwtAudience,
  };

  // Parse expiration times
  const accessExpiration = parseExpiration(config.security.jwtAccessExpiration);
  const refreshExpiration = parseExpiration(config.security.jwtRefreshExpiration);

  // Generate tokens
  const accessToken = jwt.sign(accessPayload, config.security.jwtSecret, {
    expiresIn: accessExpiration,
  });

  const refreshToken = jwt.sign(refreshPayload, config.security.jwtRefreshSecret, {
    expiresIn: refreshExpiration,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiration,
  };
};

/**
 * Parse expiration string to seconds
 */
const parseExpiration = (exp: string): number => {
  const unit = exp.slice(-1);
  const value = parseInt(exp.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 900; // Default 15 minutes
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (
  token: string,
  type: TokenType = 'access'
): JWTPayload => {
  const secret = type === 'access' ? config.security.jwtSecret : config.security.jwtRefreshSecret;
  
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: config.security.jwtIssuer,
      audience: config.security.jwtAudience,
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw error;
  }
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  try {
    const blacklisted = await redis.get(`blacklist:${jti}`);
    return blacklisted !== null;
  } catch (error) {
    logger.error('Error checking token blacklist:', error);
    return false;
  }
};

/**
 * Blacklist a token
 */
export const blacklistToken = async (
  token: string,
  type: TokenType = 'access'
): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.jti) return;

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.setex(`blacklist:${decoded.jti}`, ttl, '1');
    }
  } catch (error) {
    logger.error('Error blacklisting token:', error);
  }
};

/**
 * Extract token from request
 */
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Check query parameter (for WebSocket connections)
  if (req.query?.token) {
    return req.query.token as string;
  }

  return null;
};

/**
 * Authentication middleware
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if token is blacklisted
    if (await isTokenBlacklisted(decoded.jti)) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionTier: true,
        accountStatus: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.accountStatus === 'suspended') {
      throw new AuthorizationError('Account has been suspended');
    }

    if (user.accountStatus === 'pending_deletion') {
      throw new AuthorizationError('Account is pending deletion');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    };
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Doesn't throw error if no token provided
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);

    if (await isTokenBlacklisted(decoded.jti)) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionTier: true,
        accountStatus: true,
      },
    });

    if (user && user.accountStatus === 'active') {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      };
      req.token = token;
      req.tokenPayload = decoded;
    }

    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AuthorizationError('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Subscription tier authorization middleware
 */
export const requireSubscription = (...allowedTiers: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError());
      return;
    }

    const tierHierarchy: Record<string, number> = {
      free: 0,
      premium: 1,
      enterprise: 2,
    };

    const userTierLevel = tierHierarchy[req.user.subscriptionTier] || 0;
    const requiredTierLevel = Math.min(...allowedTiers.map(t => tierHierarchy[t] || 0));

    if (userTierLevel < requiredTierLevel) {
      next(new AuthorizationError('Subscription upgrade required'));
      return;
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Refresh token middleware
 */
export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AuthenticationError('Refresh token required');
    }

    // Verify refresh token
    const decoded = verifyToken(refresh_token, 'refresh');

    // Check if token is blacklisted
    if (await isTokenBlacklisted(decoded.jti)) {
      throw new AuthenticationError('Refresh token has been revoked');
    }

    // Attach decoded token to request
    (req as any).refreshTokenPayload = decoded;
    (req as any).refreshToken = refresh_token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * MFA verification middleware
 */
export const mfaMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { temp_token, code } = req.body;

    if (!temp_token || !code) {
      throw new AuthenticationError('Temporary token and MFA code required');
    }

    // Verify temp token
    const decoded = verifyToken(temp_token);

    // Check if MFA code is valid
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { mfaSecret: true },
    });

    if (!user?.mfaSecret) {
      throw new AuthenticationError('MFA not enabled for this user');
    }

    // Verify TOTP code
    const speakeasy = await import('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      throw new AuthenticationError('Invalid MFA code');
    }

    // Attach user to request
    (req as any).mfaUser = decoded;

    next();
  } catch (error) {
    next(error);
  }
};
