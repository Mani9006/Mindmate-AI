// Mock Data for MindMate AI Admin Dashboard

import { User, CrisisAlert, SessionFlag, UsageMetrics, SystemHealth, NotificationBroadcast, DashboardStats } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'usr_001',
    email: 'sarah.johnson@email.com',
    name: 'Sarah Johnson',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    lastActive: '2024-12-19T14:22:00Z',
    sessionCount: 47,
    crisisFlags: 2,
    age: 28,
    subscriptionTier: 'premium',
    phone: '+1-555-0123'
  },
  {
    id: 'usr_002',
    email: 'michael.chen@email.com',
    name: 'Michael Chen',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-20T08:15:00Z',
    lastActive: '2024-12-19T16:45:00Z',
    sessionCount: 23,
    crisisFlags: 0,
    age: 34,
    subscriptionTier: 'basic',
    phone: '+1-555-0124'
  },
  {
    id: 'usr_003',
    email: 'dr.emily.rodriguez@mindmate.com',
    name: 'Dr. Emily Rodriguez',
    role: 'therapist',
    status: 'active',
    createdAt: '2023-11-05T09:00:00Z',
    lastActive: '2024-12-19T18:30:00Z',
    sessionCount: 312,
    crisisFlags: 0,
    subscriptionTier: 'premium',
    phone: '+1-555-0125'
  },
  {
    id: 'usr_004',
    email: 'james.wilson@email.com',
    name: 'James Wilson',
    role: 'user',
    status: 'suspended',
    createdAt: '2024-03-10T14:20:00Z',
    lastActive: '2024-11-28T11:15:00Z',
    sessionCount: 8,
    crisisFlags: 5,
    age: 22,
    subscriptionTier: 'free',
    phone: '+1-555-0126'
  },
  {
    id: 'usr_005',
    email: 'admin@mindmate.com',
    name: 'System Administrator',
    role: 'admin',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    lastActive: '2024-12-19T20:00:00Z',
    sessionCount: 0,
    crisisFlags: 0,
    subscriptionTier: 'premium'
  },
  {
    id: 'usr_006',
    email: 'amanda.peters@email.com',
    name: 'Amanda Peters',
    role: 'user',
    status: 'active',
    createdAt: '2024-04-05T16:45:00Z',
    lastActive: '2024-12-18T22:10:00Z',
    sessionCount: 31,
    crisisFlags: 1,
    age: 29,
    subscriptionTier: 'premium',
    phone: '+1-555-0127'
  },
  {
    id: 'usr_007',
    email: 'david.kim@email.com',
    name: 'David Kim',
    role: 'user',
    status: 'inactive',
    createdAt: '2024-05-12T11:30:00Z',
    lastActive: '2024-10-15T09:20:00Z',
    sessionCount: 5,
    crisisFlags: 0,
    age: 41,
    subscriptionTier: 'basic',
    phone: '+1-555-0128'
  },
  {
    id: 'usr_008',
    email: 'dr.sarah.thompson@mindmate.com',
    name: 'Dr. Sarah Thompson',
    role: 'therapist',
    status: 'active',
    createdAt: '2023-09-20T10:00:00Z',
    lastActive: '2024-12-19T17:15:00Z',
    sessionCount: 289,
    crisisFlags: 0,
    subscriptionTier: 'premium',
    phone: '+1-555-0129'
  },
  {
    id: 'usr_009',
    email: 'robert.martinez@email.com',
    name: 'Robert Martinez',
    role: 'user',
    status: 'active',
    createdAt: '2024-06-01T13:20:00Z',
    lastActive: '2024-12-19T12:30:00Z',
    sessionCount: 15,
    crisisFlags: 0,
    age: 36,
    subscriptionTier: 'free',
    phone: '+1-555-0130'
  },
  {
    id: 'usr_010',
    email: 'lisa.anderson@email.com',
    name: 'Lisa Anderson',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-28T09:45:00Z',
    lastActive: '2024-12-19T19:00:00Z',
    sessionCount: 52,
    crisisFlags: 3,
    age: 31,
    subscriptionTier: 'premium',
    phone: '+1-555-0131'
  }
];

export const mockCrisisAlerts: CrisisAlert[] = [
  {
    id: 'alert_001',
    userId: 'usr_004',
    userName: 'James Wilson',
    userEmail: 'james.wilson@email.com',
    severity: 'critical',
    type: 'suicide_ideation',
    message: 'User expressed thoughts of self-harm during session. AI detected concerning language patterns.',
    timestamp: '2024-12-19T19:45:00Z',
    status: 'new',
    sessionId: 'sess_1234'
  },
  {
    id: 'alert_002',
    userId: 'usr_001',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.johnson@email.com',
    severity: 'medium',
    type: 'self_harm',
    message: 'User mentioned previous self-harm incidents. Monitoring recommended.',
    timestamp: '2024-12-19T14:20:00Z',
    status: 'acknowledged',
    acknowledgedBy: 'Dr. Emily Rodriguez',
    acknowledgedAt: '2024-12-19T14:35:00Z',
    notes: 'User has history of self-harm. Therapist notified and will follow up within 24 hours.',
    sessionId: 'sess_1235'
  },
  {
    id: 'alert_003',
    userId: 'usr_010',
    userName: 'Lisa Anderson',
    userEmail: 'lisa.anderson@email.com',
    severity: 'high',
    type: 'substance_abuse',
    message: 'User discussed increasing alcohol consumption and difficulty controlling intake.',
    timestamp: '2024-12-19T10:15:00Z',
    status: 'in_progress',
    acknowledgedBy: 'Dr. Sarah Thompson',
    acknowledgedAt: '2024-12-19T10:30:00Z',
    notes: 'Scheduled emergency session for tomorrow morning.',
    sessionId: 'sess_1236'
  },
  {
    id: 'alert_004',
    userId: 'usr_006',
    userName: 'Amanda Peters',
    userEmail: 'amanda.peters@email.com',
    severity: 'low',
    type: 'other',
    message: 'User expressed feelings of isolation and loneliness.',
    timestamp: '2024-12-18T22:05:00Z',
    status: 'resolved',
    acknowledgedBy: 'Dr. Emily Rodriguez',
    acknowledgedAt: '2024-12-18T22:15:00Z',
    notes: 'Provided resources for support groups. User responded positively.',
    sessionId: 'sess_1237'
  },
  {
    id: 'alert_005',
    userId: 'usr_002',
    userName: 'Michael Chen',
    userEmail: 'michael.chen@email.com',
    severity: 'medium',
    type: 'violence',
    message: 'User expressed anger management issues and aggressive thoughts.',
    timestamp: '2024-12-19T16:30:00Z',
    status: 'acknowledged',
    acknowledgedBy: 'System Administrator',
    acknowledgedAt: '2024-12-19T16:45:00Z',
    notes: 'Flagged for therapist review.',
    sessionId: 'sess_1238'
  }
];

export const mockSessionFlags: SessionFlag[] = [
  {
    id: 'flag_001',
    sessionId: 'sess_1234',
    userId: 'usr_004',
    userName: 'James Wilson',
    therapistId: 'usr_003',
    therapistName: 'Dr. Emily Rodriguez',
    flagType: 'crisis_indicator',
    severity: 'high',
    description: 'AI detected multiple crisis indicators including hopelessness and isolation language.',
    createdAt: '2024-12-19T19:50:00Z',
    status: 'open',
    aiConfidence: 0.94
  },
  {
    id: 'flag_002',
    sessionId: 'sess_1239',
    userId: 'usr_001',
    userName: 'Sarah Johnson',
    therapistId: 'usr_008',
    therapistName: 'Dr. Sarah Thompson',
    flagType: 'concerning_behavior',
    severity: 'medium',
    description: 'User exhibited avoidance behavior when discussing family relationships.',
    createdAt: '2024-12-18T15:30:00Z',
    status: 'under_review',
    reviewedBy: 'Dr. Sarah Thompson',
    reviewedAt: '2024-12-19T09:00:00Z',
    aiConfidence: 0.78
  },
  {
    id: 'flag_003',
    sessionId: 'sess_1240',
    userId: 'usr_009',
    userName: 'Robert Martinez',
    flagType: 'quality_issue',
    severity: 'low',
    description: 'Session quality degraded due to connection issues. User frustration detected.',
    createdAt: '2024-12-17T11:20:00Z',
    status: 'resolved',
    reviewedBy: 'System Administrator',
    reviewedAt: '2024-12-18T10:00:00Z',
    resolution: 'Technical team resolved connection issues. User notified.',
    aiConfidence: 0.65
  },
  {
    id: 'flag_004',
    sessionId: 'sess_1241',
    userId: 'usr_010',
    userName: 'Lisa Anderson',
    therapistId: 'usr_003',
    therapistName: 'Dr. Emily Rodriguez',
    flagType: 'boundary_violation',
    severity: 'medium',
    description: 'User attempted to establish contact outside platform boundaries.',
    createdAt: '2024-12-16T14:00:00Z',
    status: 'dismissed',
    reviewedBy: 'Dr. Emily Rodriguez',
    reviewedAt: '2024-12-17T10:30:00Z',
    resolution: 'User educated on platform boundaries. No further action required.',
    aiConfidence: 0.82
  },
  {
    id: 'flag_005',
    sessionId: 'sess_1242',
    userId: 'usr_007',
    userName: 'David Kim',
    flagType: 'other',
    severity: 'low',
    description: 'User requested information about switching therapists.',
    createdAt: '2024-12-15T09:45:00Z',
    status: 'resolved',
    reviewedBy: 'System Administrator',
    reviewedAt: '2024-12-15T14:00:00Z',
    resolution: 'Provided therapist matching resources to user.',
    aiConfidence: 0.71
  }
];

export const mockUsageMetrics: UsageMetrics[] = [
  { date: '2024-12-13', activeUsers: 245, newUsers: 12, sessions: 189, messages: 3240, avgSessionDuration: 28, crisisAlerts: 2 },
  { date: '2024-12-14', activeUsers: 267, newUsers: 15, sessions: 201, messages: 3560, avgSessionDuration: 31, crisisAlerts: 1 },
  { date: '2024-12-15', activeUsers: 289, newUsers: 18, sessions: 234, messages: 4120, avgSessionDuration: 29, crisisAlerts: 3 },
  { date: '2024-12-16', activeUsers: 312, newUsers: 22, sessions: 267, messages: 4890, avgSessionDuration: 33, crisisAlerts: 2 },
  { date: '2024-12-17', activeUsers: 298, newUsers: 14, sessions: 245, messages: 4230, avgSessionDuration: 30, crisisAlerts: 1 },
  { date: '2024-12-18', activeUsers: 334, newUsers: 25, sessions: 289, messages: 5120, avgSessionDuration: 32, crisisAlerts: 4 },
  { date: '2024-12-19', activeUsers: 356, newUsers: 19, sessions: 312, messages: 5670, avgSessionDuration: 35, crisisAlerts: 2 }
];

export const mockSystemHealth: SystemHealth = {
  timestamp: '2024-12-19T20:00:00Z',
  status: 'healthy',
  overallUptime: 99.97,
  responseTime: 124,
  services: [
    {
      name: 'API Gateway',
      status: 'healthy',
      uptime: 99.99,
      responseTime: 45,
      lastChecked: '2024-12-19T20:00:00Z',
      errorRate: 0.01
    },
    {
      name: 'AI Chat Service',
      status: 'healthy',
      uptime: 99.95,
      responseTime: 234,
      lastChecked: '2024-12-19T20:00:00Z',
      errorRate: 0.03
    },
    {
      name: 'User Authentication',
      status: 'healthy',
      uptime: 100,
      responseTime: 67,
      lastChecked: '2024-12-19T20:00:00Z',
      errorRate: 0
    },
    {
      name: 'Database',
      status: 'healthy',
      uptime: 99.98,
      responseTime: 12,
      lastChecked: '2024-12-19T20:00:00Z',
      errorRate: 0.001
    },
    {
      name: 'Notification Service',
      status: 'degraded',
      uptime: 98.5,
      responseTime: 456,
      lastChecked: '2024-12-19T20:00:00Z',
      errorRate: 0.5
    },
    {
      name: 'File Storage',
      status: 'healthy',
      uptime: 99.99,
      responseTime: 89,
      lastChecked: '2024-12-19T20:00:00Z',
      errorRate: 0.02
    }
  ]
};

export const mockNotifications: NotificationBroadcast[] = [
  {
    id: 'notif_001',
    title: 'Scheduled Maintenance',
    message: 'MindMate AI will undergo scheduled maintenance on Dec 22, 2024 from 2:00 AM to 4:00 AM EST. Some features may be unavailable during this time.',
    type: 'maintenance',
    targetAudience: 'all',
    scheduledAt: '2024-12-22T02:00:00Z',
    status: 'scheduled',
    sentCount: 0,
    failedCount: 0,
    createdBy: 'System Administrator',
    createdAt: '2024-12-19T10:00:00Z'
  },
  {
    id: 'notif_002',
    title: 'New Feature: Voice Sessions',
    message: 'We\'re excited to announce voice-enabled therapy sessions are now available for premium users!',
    type: 'info',
    targetAudience: 'users',
    customFilters: {
      subscriptionTier: ['premium']
    },
    sentAt: '2024-12-18T14:00:00Z',
    status: 'sent',
    sentCount: 1245,
    failedCount: 12,
    createdBy: 'System Administrator',
    createdAt: '2024-12-18T09:00:00Z'
  },
  {
    id: 'notif_003',
    title: 'Platform Security Update',
    message: 'We\'ve enhanced our security protocols. Please update your password for added protection.',
    type: 'warning',
    targetAudience: 'all',
    sentAt: '2024-12-17T10:00:00Z',
    status: 'sent',
    sentCount: 5234,
    failedCount: 45,
    createdBy: 'System Administrator',
    createdAt: '2024-12-17T08:00:00Z'
  },
  {
    id: 'notif_004',
    title: 'Holiday Support Hours',
    message: 'Our crisis support team will have extended hours during the holiday season.',
    type: 'info',
    targetAudience: 'users',
    status: 'draft',
    sentCount: 0,
    failedCount: 0,
    createdBy: 'Dr. Emily Rodriguez',
    createdAt: '2024-12-19T16:00:00Z'
  }
];

export const mockDashboardStats: DashboardStats = {
  totalUsers: 5234,
  activeUsersToday: 356,
  newUsersThisWeek: 135,
  totalSessions: 12450,
  openCrisisAlerts: 1,
  pendingSessionFlags: 2,
  systemHealth: 'healthy',
  avgResponseTime: 124
};

// Helper function to generate time-series data
export function generateTimeSeriesData(days: number): UsageMetrics[] {
  const data: UsageMetrics[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      activeUsers: Math.floor(Math.random() * 200) + 200,
      newUsers: Math.floor(Math.random() * 30) + 10,
      sessions: Math.floor(Math.random() * 150) + 150,
      messages: Math.floor(Math.random() * 3000) + 2000,
      avgSessionDuration: Math.floor(Math.random() * 20) + 20,
      crisisAlerts: Math.floor(Math.random() * 4)
    });
  }
  
  return data;
}
