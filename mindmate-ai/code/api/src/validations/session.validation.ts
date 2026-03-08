/**
 * Session Validation Schemas
 * Zod schemas for session endpoints
 */

import { z } from 'zod';

// ==================== SESSION SCHEMAS ====================

// UUID schema for path parameters
export const uuidParamSchema = z.object({
  session_id: z.string().uuid('Invalid session ID format'),
});

// List sessions query
export const listSessionsQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20').refine(n => n <= 100, 'Limit cannot exceed 100'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Create session request
export const createSessionSchema = z.object({
  title: z.string().max(200).optional(),
  session_type: z.enum(['general', 'guided', 'crisis', 'check_in']).default('general'),
  initial_context: z.string().max(1000).optional(),
});

// Update session request
export const updateSessionSchema = z.object({
  title: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

// Session export query
export const exportSessionQuerySchema = z.object({
  format: z.enum(['pdf', 'txt', 'json']).default('pdf'),
});

// ==================== MESSAGE SCHEMAS ====================

// Message ID param
export const messageIdParamSchema = z.object({
  session_id: z.string().uuid('Invalid session ID format'),
  message_id: z.string().uuid('Invalid message ID format'),
});

// List messages query
export const listMessagesQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default('50').refine(n => n <= 200, 'Limit cannot exceed 200'),
  before: z.string().uuid().optional(),
  after: z.string().uuid().optional(),
});

// Send message request
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4000),
  content_type: z.enum(['text', 'image', 'audio']).default('text'),
  attachments: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    name: z.string(),
  })).optional(),
});

// Message feedback request
export const messageFeedbackSchema = z.object({
  rating: z.enum(['helpful', 'not_helpful']),
  comment: z.string().max(500).optional(),
});

// ==================== TYPE EXPORTS ====================

export type UUIDParamInput = z.infer<typeof uuidParamSchema>;
export type ListSessionsQueryInput = z.infer<typeof listSessionsQuerySchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type ExportSessionQueryInput = z.infer<typeof exportSessionQuerySchema>;
export type MessageIdParamInput = z.infer<typeof messageIdParamSchema>;
export type ListMessagesQueryInput = z.infer<typeof listMessagesQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageFeedbackInput = z.infer<typeof messageFeedbackSchema>;
