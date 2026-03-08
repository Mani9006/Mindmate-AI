// Custom hooks for real-time functionality

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CrisisAlert, SessionFlag, SystemHealth } from '@/types';

// WebSocket simulation for real-time updates
interface WebSocketMessage {
  type: 'crisis_alert' | 'session_flag' | 'system_health' | 'user_activity';
  data: unknown;
}

export function useRealtimeCrisisAlerts(initialAlerts: CrisisAlert[] = []) {
  const [alerts, setAlerts] = useState<CrisisAlert[]>(initialAlerts);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Simulate WebSocket connection
    setIsConnected(true);
    
    // In production, replace with actual WebSocket connection:
    // wsRef.current = new WebSocket('wss://api.mindmate.ai/admin/realtime');
    
    // Simulated real-time updates
    const interval = setInterval(() => {
      // Randomly simulate new alerts (5% chance every 10 seconds)
      if (Math.random() < 0.05) {
        const newAlert: CrisisAlert = {
          id: `alert_${Date.now()}`,
          userId: `usr_${Math.floor(Math.random() * 100)}`,
          userName: 'New User Alert',
          userEmail: 'user@example.com',
          severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'high' : 'medium',
          type: 'self_harm',
          message: 'New crisis alert detected by AI monitoring system.',
          timestamp: new Date().toISOString(),
          status: 'new',
          sessionId: `sess_${Date.now()}`
        };
        
        setAlerts(prev => [newAlert, ...prev]);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, []);

  const acknowledgeAlert = useCallback((alertId: string, notes?: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'acknowledged', 
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: 'Current User',
              notes 
            }
          : alert
      )
    );
  }, []);

  const escalateAlert = useCallback((alertId: string, notes?: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'escalated',
              notes: notes || alert.notes
            }
          : alert
      )
    );
  }, []);

  const resolveAlert = useCallback((alertId: string, resolution: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'resolved',
              notes: resolution
            }
          : alert
      )
    );
  }, []);

  return {
    alerts,
    isConnected,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
    newAlertsCount: alerts.filter(a => a.status === 'new').length,
    criticalAlertsCount: alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length
  };
}

export function useRealtimeSystemHealth(initialHealth: SystemHealth) {
  const [health, setHealth] = useState<SystemHealth>(initialHealth);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);
    
    // Simulate health metric updates
    const interval = setInterval(() => {
      setHealth(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        responseTime: Math.max(50, Math.min(500, prev.responseTime + (Math.random() - 0.5) * 50)),
        services: prev.services.map(service => ({
          ...service,
          responseTime: Math.max(10, Math.min(1000, service.responseTime + (Math.random() - 0.5) * 30)),
          errorRate: Math.max(0, Math.min(5, service.errorRate + (Math.random() - 0.5) * 0.1)),
          lastChecked: new Date().toISOString()
        }))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    health,
    isConnected
  };
}

export function useSessionFlags(initialFlags: SessionFlag[] = []) {
  const [flags, setFlags] = useState<SessionFlag[]>(initialFlags);

  const reviewFlag = useCallback((flagId: string, resolution: string) => {
    setFlags(prev => 
      prev.map(flag => 
        flag.id === flagId 
          ? { 
              ...flag, 
              status: 'under_review',
              reviewedBy: 'Current User',
              reviewedAt: new Date().toISOString()
            }
          : flag
      )
    );
  }, []);

  const resolveFlag = useCallback((flagId: string, resolution: string) => {
    setFlags(prev => 
      prev.map(flag => 
        flag.id === flagId 
          ? { 
              ...flag, 
              status: 'resolved',
              reviewedBy: 'Current User',
              reviewedAt: new Date().toISOString(),
              resolution
            }
          : flag
      )
    );
  }, []);

  const dismissFlag = useCallback((flagId: string, reason: string) => {
    setFlags(prev => 
      prev.map(flag => 
        flag.id === flagId 
          ? { 
              ...flag, 
              status: 'dismissed',
              reviewedBy: 'Current User',
              reviewedAt: new Date().toISOString(),
              resolution: reason
            }
          : flag
      )
    );
  }, []);

  return {
    flags,
    reviewFlag,
    resolveFlag,
    dismissFlag,
    openFlagsCount: flags.filter(f => f.status === 'open').length,
    underReviewCount: flags.filter(f => f.status === 'under_review').length
  };
}

// Hook for auto-refresh functionality
export function useAutoRefresh(callback: () => void, intervalMs: number = 30000, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(callback, intervalMs);
    return () => clearInterval(interval);
  }, [callback, intervalMs, enabled]);
}

// Hook for notification sound
export function useNotificationSound() {
  const playSound = useCallback((type: 'alert' | 'notification' | 'success' = 'notification') => {
    // In production, use actual audio files
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'alert':
        oscillator.frequency.value = 880; // A5
        gainNode.gain.value = 0.3;
        break;
      case 'success':
        oscillator.frequency.value = 523.25; // C5
        gainNode.gain.value = 0.2;
        break;
      default:
        oscillator.frequency.value = 659.25; // E5
        gainNode.gain.value = 0.15;
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  return { playSound };
}
