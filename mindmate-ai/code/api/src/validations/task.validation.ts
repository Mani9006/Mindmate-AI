/**
 * Task Validation Schemas
 * Zod schemas for task endpoints
 */

import { z } from 'zod';

// ==================== TASK SCHEMAS ====================

// Task ID param
export const taskIdParamSchema = z.object({
  task_id: z.string().uuid('Invalid task ID format'),
});

// List tasks query
export const listTasksQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'archived']).optional(),
  category: z.enum(['mindfulness', 'exercise', 'journaling', 'social', 'sleep', 'nutrition', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_before: z.string().datetime().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

// Create task request
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['mindfulness', 'exercise', 'journaling', 'social', 'sleep', 'nutrition', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime().optional(),
  reminder_at: z.string().datetime().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  estimated_minutes: z.number().int().positive().optional(),
});

// Update task request
export const updateTaskSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(['mindfulness', 'exercise', 'journaling', 'social', 'sleep', 'nutrition', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime().optional(),
  reminder_at: z.string().datetime().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  estimated_minutes: z.number().int().positive().optional(),
});

// Complete task request
export const completeTaskSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// ==================== TYPE EXPORTS ====================

export type TaskIdParamInput = z.infer<typeof taskIdParamSchema>;
export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
