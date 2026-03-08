/**
 * Authentication Validation Schemas
 * Zod schemas for authentication endpoints
 */

import { z } from 'zod';

// ==================== AUTHENTICATION SCHEMAS ====================

// Register request
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  timezone: z.string().default('UTC'),
  referral_code: z.string().optional(),
  marketing_consent: z.boolean().default(false),
});

// Login request
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  device_info: z.object({
    device_id: z.string().optional(),
    platform: z.enum(['ios', 'android', 'web']).optional(),
    app_version: z.string().optional(),
  }).optional(),
});

// Logout request
export const logoutSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// Refresh token request
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// Forgot password request
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Reset password request
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Verify email request
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// OAuth login request
export const oauthLoginSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  id_token: z.string().optional(),
});

// OAuth provider param
export const oauthProviderSchema = z.object({
  provider: z.enum(['google', 'apple', 'facebook']),
});

// MFA setup response (no validation needed for GET)
// MFA verify request
export const mfaVerifySchema = z.object({
  temp_token: z.string().min(1, 'Temporary token is required'),
  code: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
});

// ==================== USER PROFILE SCHEMAS ====================

// Update user profile
export const updateUserSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timezone: z.string().optional(),
});

// Change password
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

// User preferences
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.string().default('en'),
  ai_personality: z.enum(['empathetic', 'professional', 'friendly', 'motivational']).default('empathetic'),
  session_reminders: z.boolean().default(true),
  mood_reminders: z.boolean().default(true),
  task_reminders: z.boolean().default(true),
  reminder_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
  privacy_settings: z.object({
    share_analytics: z.boolean().default(true),
    allow_ai_training: z.boolean().default(false),
  }).optional(),
  notification_settings: z.object({
    push_enabled: z.boolean().default(true),
    email_enabled: z.boolean().default(true),
    sms_enabled: z.boolean().default(false),
  }).optional(),
});

// Delete account
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE'),
});

// ==================== NOTIFICATION PREFERENCES SCHEMAS ====================

export const notificationPreferencesSchema = z.object({
  push_enabled: z.boolean().default(true),
  email_enabled: z.boolean().default(true),
  sms_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quiet_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  types: z.object({
    session_reminder: z.boolean().default(true),
    mood_reminder: z.boolean().default(true),
    task_reminder: z.boolean().default(true),
    achievement: z.boolean().default(true),
    insight: z.boolean().default(true),
    system: z.boolean().default(true),
  }).optional(),
});

// Push token registration
export const pushTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required'),
  platform: z.enum(['ios', 'android', 'web']),
  device_id: z.string().optional(),
});

// ==================== TYPE EXPORTS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type OAuthLoginInput = z.infer<typeof oauthLoginSchema>;
export type OAuthProviderInput = z.infer<typeof oauthProviderSchema>;
export type MFAVerifyInput = z.infer<typeof mfaVerifySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type PushTokenInput = z.infer<typeof pushTokenSchema>;
