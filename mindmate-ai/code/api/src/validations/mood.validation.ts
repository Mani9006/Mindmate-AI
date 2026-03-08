/**
 * Mood Validation Schemas
 * Zod schemas for mood tracking endpoints
 */

import { z } from 'zod';

// ==================== MOOD SCHEMAS ====================

// Mood ID param
export const moodIdParamSchema = z.object({
  entry_id: z.string().uuid('Invalid mood entry ID format'),
});

// List mood entries query
export const listMoodQuerySchema = z.object({
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('30'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

// Log mood request
export const logMoodSchema = z.object({
  mood_score: z.number().int().min(1).max(10),
  emotions: z.array(z.enum([
    'happy', 'sad', 'anxious', 'angry', 'calm', 'excited', 
    'tired', 'stressed', 'grateful', 'frustrated', 'hopeful', 'lonely'
  ])).optional(),
  notes: z.string().max(2000).optional(),
  triggers: z.array(z.string()).optional(),
  activities: z.array(z.enum([
    'work', 'exercise', 'social', 'sleep', 'eating', 
    'meditation', 'hobby', 'family', 'outdoors', 'screen_time'
  ])).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
});

// Update mood request
export const updateMoodSchema = z.object({
  mood_score: z.number().int().min(1).max(10).optional(),
  emotions: z.array(z.enum([
    'happy', 'sad', 'anxious', 'angry', 'calm', 'excited', 
    'tired', 'stressed', 'grateful', 'frustrated', 'hopeful', 'lonely'
  ])).optional(),
  notes: z.string().max(2000).optional(),
  triggers: z.array(z.string()).optional(),
  activities: z.array(z.enum([
    'work', 'exercise', 'social', 'sleep', 'eating', 
    'meditation', 'hobby', 'family', 'outdoors', 'screen_time'
  ])).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
});

// Mood analytics query
export const moodAnalyticsQuerySchema = z.object({
  period: z.enum(['week', 'month', '3months', '6months', 'year']).default('month'),
});

// ==================== TYPE EXPORTS ====================

export type MoodIdParamInput = z.infer<typeof moodIdParamSchema>;
export type ListMoodQueryInput = z.infer<typeof listMoodQuerySchema>;
export type LogMoodInput = z.infer<typeof logMoodSchema>;
export type UpdateMoodInput = z.infer<typeof updateMoodSchema>;
export type MoodAnalyticsQueryInput = z.infer<typeof moodAnalyticsQuerySchema>;
