/**
 * Notification Validation Schemas
 * Zod schemas for notification endpoints
 */

import { z } from 'zod';

// ==================== NOTIFICATION SCHEMAS ====================

// Notification ID param
export const notificationIdParamSchema = z.object({
  notification_id: z.string().uuid('Invalid notification ID format'),
});

// List notifications query
export const listNotificationsQuerySchema = z.object({
  unread_only: z.string().transform(v => v === 'true').default('false'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

// ==================== TYPE EXPORTS ====================

export type NotificationIdParamInput = z.infer<typeof notificationIdParamSchema>;
export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
