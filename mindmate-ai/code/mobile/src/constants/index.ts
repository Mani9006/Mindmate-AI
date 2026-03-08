import { OnboardingSlide } from '@types';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.mindmate.ai/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PUSH_TOKEN: 'push_token',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'MindMate AI',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@mindmate.ai',
  PRIVACY_POLICY_URL: 'https://mindmate.ai/privacy',
  TERMS_OF_SERVICE_URL: 'https://mindmate.ai/terms',
  WEBSITE_URL: 'https://mindmate.ai',
};

// Session Configuration
export const SESSION_CONFIG = {
  MAX_MESSAGE_LENGTH: 2000,
  TYPING_INDICATOR_DELAY: 500,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUTO_SAVE_INTERVAL: 5000, // 5 seconds
};

// Mood Scale
export const MOOD_SCALE = [
  { value: 1, label: 'Very Low', emoji: '😢', color: '#ef4444' },
  { value: 2, label: 'Low', emoji: '😔', color: '#f97316' },
  { value: 3, label: 'Below Average', emoji: '😕', color: '#f59e0b' },
  { value: 4, label: 'Slightly Low', emoji: '😐', color: '#eab308' },
  { value: 5, label: 'Neutral', emoji: '😶', color: '#84cc16' },
  { value: 6, label: 'Okay', emoji: '🙂', color: '#22c55e' },
  { value: 7, label: 'Good', emoji: '😊', color: '#10b981' },
  { value: 8, label: 'Very Good', emoji: '😃', color: '#14b8a6' },
  { value: 9, label: 'Excellent', emoji: '😄', color: '#06b6d4' },
  { value: 10, label: 'Amazing', emoji: '🤩', color: '#8b5cf6' },
];

// Onboarding Slides
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to MindMate AI',
    description: 'Your personal AI companion for mental wellness. Get support, track your mood, and improve your wellbeing.',
    image: require('@assets/images/onboarding-1.png'),
    backgroundColor: '#6366f1',
  },
  {
    id: '2',
    title: '24/7 Support',
    description: 'Talk to our AI anytime, anywhere. Whether you need to vent, get advice, or just have a conversation.',
    image: require('@assets/images/onboarding-2.png'),
    backgroundColor: '#8b5cf6',
  },
  {
    id: '3',
    title: 'Track Your Progress',
    description: 'Monitor your mood over time, track your sessions, and see your personal growth journey.',
    image: require('@assets/images/onboarding-3.png'),
    backgroundColor: '#ec4899',
  },
  {
    id: '4',
    title: 'Private & Secure',
    description: 'Your conversations are encrypted and private. We prioritize your confidentiality and security.',
    image: require('@assets/images/onboarding-4.png'),
    backgroundColor: '#10b981',
  },
];

// Colors
export const COLORS = {
  // Primary
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Secondary
  secondary: '#8b5cf6',
  secondaryLight: '#a78bfa',
  secondaryDark: '#7c3aed',
  
  // Accent
  accent: '#ec4899',
  accentLight: '#f472b6',
  accentDark: '#db2777',
  
  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Grayscale
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',
  
  // Dark Theme
  darkBackground: '#0f0f1a',
  darkSurface: '#1a1a2e',
  darkCard: '#252542',
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
};

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};
