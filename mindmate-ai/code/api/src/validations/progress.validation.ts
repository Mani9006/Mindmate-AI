/**
 * Progress Validation Schemas
 * Zod schemas for progress endpoints
 */

import { z } from 'zod';

// ==================== PROGRESS SCHEMAS ====================

// Progress stats query
export const progressStatsQuerySchema = z.object({
  period: z.enum(['week', 'month', '3months', '6months', 'year', 'all']).default('month'),
});

// Achievement ID param
export const achievementIdParamSchema = z.object({
  achievement_id: z.string().uuid('Invalid achievement ID format'),
});

// List achievements query
export const listAchievementsQuerySchema = z.object({
  earned_only: z.string().transform(v => v === 'true').default('false'),
});

// Insights query
export const insightsQuerySchema = z.object({
  period: z.enum(['week', 'month']).default('week'),
});

// Weekly report query
export const weeklyReportQuerySchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ==================== TYPE EXPORTS ====================

export type ProgressStatsQueryInput = z.infer<typeof progressStatsQuerySchema>;
export type AchievementIdParamInput = z.infer<typeof achievementIdParamSchema>;
export type ListAchievementsQueryInput = z.infer<typeof listAchievementsQuerySchema>;
export type InsightsQueryInput = z.infer<typeof insightsQuerySchema>;
export type WeeklyReportQueryInput = z.infer<typeof weeklyReportQuerySchema>;
