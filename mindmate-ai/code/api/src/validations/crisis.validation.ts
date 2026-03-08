/**
 * Crisis Validation Schemas
 * Zod schemas for crisis support endpoints
 */

import { z } from 'zod';

// ==================== CRISIS SCHEMAS ====================

// Crisis resources query
export const crisisResourcesQuerySchema = z.object({
  country: z.string().length(2).default('US'),
  type: z.enum(['all', 'suicide', 'abuse', 'substance', 'general']).default('all'),
});

// Crisis alert request
export const crisisAlertSchema = z.object({
  type: z.enum(['emergency_contact', 'crisis_line', 'location_share']),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation must be true to send crisis alert' }),
  }),
  message: z.string().max(500).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

// Emergency contact ID param
export const emergencyContactIdParamSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID format'),
});

// Emergency contact request
export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  is_primary: z.boolean().optional(),
  notify_on_crisis: z.boolean().default(true),
  notify_on_check_in: z.boolean().default(false),
});

// Crisis check-in request
export const crisisCheckInSchema = z.object({
  responses: z.array(z.object({
    question_id: z.string(),
    answer: z.string(),
  })).min(1, 'At least one response is required'),
});

// ==================== TYPE EXPORTS ====================

export type CrisisResourcesQueryInput = z.infer<typeof crisisResourcesQuerySchema>;
export type CrisisAlertInput = z.infer<typeof crisisAlertSchema>;
export type EmergencyContactIdParamInput = z.infer<typeof emergencyContactIdParamSchema>;
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
export type CrisisCheckInInput = z.infer<typeof crisisCheckInSchema>;
