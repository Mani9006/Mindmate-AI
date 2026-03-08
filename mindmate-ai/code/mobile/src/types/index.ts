// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  subscription: SubscriptionInfo;
  stats: UserStats;
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

export interface SubscriptionInfo {
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate?: string;
  endDate?: string;
  autoRenew: boolean;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  streakDays: number;
  lastSessionDate?: string;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  type: 'chat' | 'voice' | 'video';
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  duration?: number;
  messages: Message[];
  summary?: string;
  moodBefore?: MoodEntry;
  moodAfter?: MoodEntry;
}

export interface Message {
  id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio';
  metadata?: Record<string, unknown>;
}

export interface MoodEntry {
  id: string;
  userId: string;
  value: number; // 1-10
  label: string;
  note?: string;
  timestamp: string;
}

// Notification Types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: string;
  read: boolean;
  type: 'session' | 'reminder' | 'system' | 'promotion';
}

// Navigation Types
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Home: undefined;
  Sessions: undefined;
  Explore: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Session: { sessionId?: string; type?: 'chat' | 'voice' | 'video' };
  SessionHistory: undefined;
  MoodTracker: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Subscription: undefined;
  Notifications: undefined;
  Help: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// API Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Permission Types
export interface PermissionStatus {
  camera: 'granted' | 'denied' | 'undetermined';
  microphone: 'granted' | 'denied' | 'undetermined';
  photos: 'granted' | 'denied' | 'undetermined';
  notifications: 'granted' | 'denied' | 'undetermined';
}

// Onboarding Types
export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
  backgroundColor: string;
}
