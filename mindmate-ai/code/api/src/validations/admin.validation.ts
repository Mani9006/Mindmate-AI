/**
 * Admin Validation Schemas
 * Zod schemas for admin endpoints
 */

import { z } from 'zod';

// ==================== ADMIN SCHEMAS ====================

// User ID param
export const userIdParamSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
});

// List users query
export const listUsersQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'pending_verification']).optional(),
  subscription_tier: z.enum(['free', 'premium', 'enterprise']).optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50').refine(n => n <= 500, 'Limit cannot exceed 500'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

// Update user request (admin)
export const adminUpdateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  subscription_tier: z.enum(['free', 'premium', 'enterprise']).optional(),
  account_status: z.enum(['active', 'suspended', 'pending_deletion']).optional(),
  admin_notes: z.string().optional(),
});

// Suspend user request
export const suspendUserSchema = z.object({
  reason: z.string().max(500),
  duration_days: z.number().int().positive().optional(),
});

// Admin analytics query
export const adminAnalyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('day'),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// List sessions query (admin)
export const adminListSessionsQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  status: z.enum(['active', 'completed', 'flagged']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

// List flagged content query
export const listFlaggedContentQuerySchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed']).default('pending'),
  type: z.enum(['message', 'session', 'user']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

// Flag ID param
export const flagIdParamSchema = z.object({
  flag_id: z.string().uuid('Invalid flag ID format'),
});

// Update flagged content request
export const updateFlaggedContentSchema = z.object({
  status: z.enum(['reviewed', 'dismissed', 'escalated']),
  notes: z.string().max(1000).optional(),
  action_taken: z.enum(['none', 'warning', 'suspension', 'content_removed']).optional(),
});

// Create announcement request
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['info', 'warning', 'feature', 'maintenance']).default('info'),
  target_audience: z.enum(['all', 'free', 'premium', 'admin']).default('all'),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
});

// System config update
export const systemConfigSchema = z.object({
  maintenance_mode: z.boolean().optional(),
  registration_enabled: z.boolean().optional(),
  max_sessions_per_user: z.number().int().positive().optional(),
  max_messages_per_session: z.number().int().positive().optional(),
  ai_model: z.string().optional(),
  rate_limits: z.object({
    anonymous: z.object({
      requests_per_minute: z.number().int().positive(),
    }).optional(),
    authenticated: z.object({
      requests_per_minute: z.number().int().positive(),
    }).optional(),
    premium: z.object({
      requests_per_minute: z.number().int().positive(),
    }).optional(),
  }).optional(),
  features: z.object({
    mood_tracking: z.boolean().optional(),
    task_management: z.boolean().optional(),
    crisis_support: z.boolean().optional(),
    progress_analytics: z.boolean().optional(),
    achievements: z.boolean().optional(),
  }).optional(),
});

// ==================== TYPE EXPORTS ====================

export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type AdminAnalyticsQueryInput = z.infer<typeof adminAnalyticsQuerySchema>;
export type AdminListSessionsQueryInput = z.infer<typeof adminListSessionsQuerySchema>;
export type ListFlaggedContentQueryInput = z.infer<typeof listFlaggedContentQuerySchema>;
export type FlagIdParamInput = z.infer<typeof flagIdParamSchema>;
export type UpdateFlaggedContentInput = z.infer<typeof updateFlaggedContentSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type SystemConfigInput = z.infer<typeof systemConfigSchema>;
