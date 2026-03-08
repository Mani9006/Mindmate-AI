// MindMate AI Admin Dashboard Types

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'therapist' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastActive: string;
  sessionCount: number;
  crisisFlags: number;
  profileImage?: string;
  phone?: string;
  age?: number;
  subscriptionTier: 'free' | 'basic' | 'premium';
}

export interface CrisisAlert {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'self_harm' | 'suicide_ideation' | 'violence' | 'substance_abuse' | 'other';
  message: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notes?: string;
  sessionId: string;
}

export interface SessionFlag {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  therapistId?: string;
  therapistName?: string;
  flagType: 'concerning_behavior' | 'crisis_indicator' | 'quality_issue' | 'boundary_violation' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  createdAt: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  aiConfidence?: number;
}

export interface UsageMetrics {
  date: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  messages: number;
  avgSessionDuration: number;
  crisisAlerts: number;
}

export interface SystemHealth {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'critical';
  services: ServiceHealth[];
  overallUptime: number;
  responseTime: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  lastChecked: string;
  errorRate: number;
}

export interface NotificationBroadcast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'maintenance';
  targetAudience: 'all' | 'users' | 'therapists' | 'admins' | 'custom';
  customFilters?: {
    subscriptionTier?: string[];
    lastActiveDays?: number;
    specificUsers?: string[];
  };
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  totalSessions: number;
  openCrisisAlerts: number;
  pendingSessionFlags: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  avgResponseTime: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface FilterState {
  search: string;
  role: string;
  status: string;
  dateRange: { from?: string; to?: string };
  severity?: string;
}
