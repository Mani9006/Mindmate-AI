/**
 * Request Validation Middleware
 * Zod-based validation for requests
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ValidationError } from './errorHandler';

// Validation targets
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

// Validation options
interface ValidationOptions {
  stripUnknown?: boolean;
  allowUnknown?: boolean;
}

/**
 * Create validation middleware
 */
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req[target];
      
      // Parse and validate
      const result = await schema.parseAsync(data);
      
      // Replace request data with validated result
      req[target] = result;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });

        next(new ValidationError('Validation failed', { field_errors: formattedErrors }));
        return;
      }

      next(error);
    }
  };
};

/**
 * Validate multiple targets
 */
export const validateMultiple = (
  schemas: Partial<Record<ValidationTarget, ZodSchema>>,
  options: ValidationOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const allErrors: Array<{ field: string; message: string; code: string }> = [];

    for (const [target, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      try {
        const data = req[target as ValidationTarget];
        const result = await schema.parseAsync(data);
        req[target as ValidationTarget] = result;
      } catch (error) {
        if (error instanceof ZodError) {
          const formattedErrors = error.errors.map((err) => ({
            field: `${target}.${err.path.join('.')}`,
            message: err.message,
            code: err.code,
          }));
          allErrors.push(...formattedErrors);
        }
      }
    }

    if (allErrors.length > 0) {
      logger.warn('Validation failed', {
        path: req.path,
        method: req.method,
        errors: allErrors,
      });

      next(new ValidationError('Validation failed', { field_errors: allErrors }));
      return;
    }

    next();
  };
};

/**
 * Request sanitizer middleware
 * Removes potentially dangerous characters
 */
export const sanitizeRequest = (
  targets: ValidationTarget[] = ['body', 'query']
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sanitizeString = (str: string): string => {
      return str
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    for (const target of targets) {
      if (req[target]) {
        req[target] = sanitizeObject(req[target]);
      }
    }

    next();
  };
};

/**
 * Content type validator
 */
export const validateContentType = (...allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'] || '';
    
    if (!allowedTypes.some(type => contentType.includes(type))) {
      logger.warn('Invalid content type', {
        path: req.path,
        content_type: contentType,
        allowed_types: allowedTypes,
      });

      next(new ValidationError(
        `Content-Type must be one of: ${allowedTypes.join(', ')}`
      ));
      return;
    }

    next();
  };
};

/**
 * File upload validator
 */
export const validateFileUpload = (
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}
) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 1,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.files && !req.file) {
      next();
      return;
    }

    const files = req.files 
      ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
      : [req.file];

    if (files.length > maxFiles) {
      next(new ValidationError(`Maximum ${maxFiles} file(s) allowed`));
      return;
    }

    for (const file of files) {
      if (!file) continue;

      if (file.size > maxSize) {
        next(new ValidationError(
          `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
        ));
        return;
      }

      if (!allowedTypes.includes(file.mimetype)) {
        next(new ValidationError(
          `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        ));
        return;
      }
    }

    next();
  };
};

/**
 * Pagination validator
 */
export const validatePagination = (
  options: {
    defaultLimit?: number;
    maxLimit?: number;
  } = {}
) => {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    let limit = parseInt(req.query.limit as string, 10) || defaultLimit;
    let offset = parseInt(req.query.offset as string, 10) || 0;

    // Enforce limits
    limit = Math.min(Math.max(1, limit), maxLimit);
    offset = Math.max(0, offset);

    // Add validated pagination to request
    (req as any).pagination = { limit, offset };

    next();
  };
};

/**
 * Sort validator
 */
export const validateSort = (
  allowedFields: string[],
  defaultSort: { field: string; order: 'asc' | 'desc' } = { field: 'createdAt', order: 'desc' }
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sortField = (req.query.sort_by as string) || defaultSort.field;
    const sortOrder = (req.query.sort_order as string) || defaultSort.order;

    if (!allowedFields.includes(sortField)) {
      next(new ValidationError(
        `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
      ));
      return;
    }

    const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    (req as any).sort = { field: sortField, order };

    next();
  };
};

/**
 * Date range validator
 */
export const validateDateRange = (
  fieldName: string = 'date',
  options: {
    maxRangeDays?: number;
    allowFuture?: boolean;
  } = {}
) => {
  const { maxRangeDays = 365, allowFuture = false } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const fromDate = req.query[`from_${fieldName}`] as string;
    const toDate = req.query[`to_${fieldName}`] as string;

    if (!fromDate && !toDate) {
      next();
      return;
    }

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && isNaN(from.getTime())) {
      next(new ValidationError(`Invalid from_${fieldName} date format`));
      return;
    }

    if (to && isNaN(to.getTime())) {
      next(new ValidationError(`Invalid to_${fieldName} date format`));
      return;
    }

    if (!allowFuture) {
      const now = new Date();
      if (from && from > now) {
        next(new ValidationError(`from_${fieldName} cannot be in the future`));
        return;
      }
      if (to && to > now) {
        next(new ValidationError(`to_${fieldName} cannot be in the future`));
        return;
      }
    }

    if (from && to) {
      const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > maxRangeDays) {
        next(new ValidationError(
          `Date range cannot exceed ${maxRangeDays} days`
        ));
        return;
      }
    }

    (req as any).dateRange = { from, to };

    next();
  };
};

/**
 * UUID validator for route parameters
 */
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    
    if (!value) {
      next(new ValidationError(`Missing required parameter: ${paramName}`));
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      next(new ValidationError(`Invalid UUID format for parameter: ${paramName}`));
      return;
    }

    next();
  };
};

// Export all validators
export const requestValidator = {
  validate,
  validateMultiple,
  sanitizeRequest,
  validateContentType,
  validateFileUpload,
  validatePagination,
  validateSort,
  validateDateRange,
  validateUUID,
};

export default requestValidator;
