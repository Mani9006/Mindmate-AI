/**
 * Global Error Handler Middleware
 * Centralized error handling with proper HTTP responses
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

// Custom API Error class
export class APIError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: Record<string, unknown>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'internal_error',
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends APIError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 422, 'validation_error', details, true);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'unauthorized', undefined, true);
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'forbidden', undefined, true);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'not_found', undefined, true);
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'conflict', undefined, true);
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'rate_limit_exceeded', retryAfter ? { retry_after: retryAfter } : undefined, true);
  }
}

export class BadRequestError extends APIError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'bad_request', undefined, true);
  }
}

// Error response interface
interface ErrorResponse {
  error: string;
  message: string;
  code: number;
  details?: Record<string, unknown> | Array<{ field: string; message: string; code: string }>;
  request_id?: string;
  stack?: string;
}

// Format Zod validation errors
const formatZodError = (error: ZodError): Array<{ field: string; message: string; code: string }> => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
};

// Format Prisma errors
const formatPrismaError = (error: Prisma.PrismaClientKnownRequestError): APIError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.[0] || 'field';
      return new ConflictError(`A record with this ${field} already exists`);
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Invalid reference to related resource');
    
    case 'P2025':
      // Record not found
      return new NotFoundError('Resource');
    
    case 'P2014':
      // Invalid ID
      return new ValidationError('Invalid ID provided');
    
    default:
      return new APIError(
        'Database operation failed',
        500,
        'database_error',
        { prisma_code: error.code },
        true
      );
  }
};

// Main error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: APIError;

  // Convert different error types to APIError
  if (err instanceof APIError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = new ValidationError('Validation failed', { field_errors: formatZodError(err) });
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = formatPrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new ValidationError('Invalid data provided');
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    error = new APIError('Database connection error', 500, 'database_error');
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    error = new APIError('Database initialization error', 500, 'database_error');
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  } else if (err.name === 'UnauthorizedError') {
    error = new AuthenticationError();
  } else {
    // Unknown error
    error = new APIError(
      config.app.isProduction ? 'Internal server error' : err.message,
      500,
      'internal_error',
      undefined,
      false
    );
  }

  // Log error
  const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
  logger.log(logLevel, error.message, {
    error_code: error.errorCode,
    status_code: error.statusCode,
    path: req.path,
    method: req.method,
    request_id: req.id,
    user_id: (req as any).user?.id,
    stack: error.stack,
    details: error.details,
    is_operational: error.isOperational,
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    error: error.errorCode,
    message: error.message,
    code: error.statusCode,
    request_id: req.id,
  };

  // Add details if available
  if (error.details) {
    errorResponse.details = error.details;
  }

  // Add stack trace in development
  if (config.app.isDevelopment && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Send response
  res.status(error.statusCode).json(errorResponse);
};

// Async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    request_id: req.id,
  });

  res.status(404).json({
    error: error.errorCode,
    message: error.message,
    code: error.statusCode,
    request_id: req.id,
  });
};

// Export error types
export default {
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BadRequestError,
};
