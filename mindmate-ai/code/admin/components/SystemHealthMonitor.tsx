// System Health Monitor Component

'use client';

import { useState, useEffect } from 'react';
import { SystemHealth, ServiceHealth } from '@/types';
import { useRealtimeSystemHealth } from '@/hooks/useRealtime';
import { formatDate, formatNumber } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardHeader, StatCard } from './ui/Card';
import { Modal } from './ui/Modal';

interface SystemHealthMonitorProps {
  initialHealth: SystemHealth;
}

export function SystemHealthMonitor({ initialHealth }: SystemHealthMonitorProps) {
  const { health, isConnected } = useRealtimeSystemHealth(initialHealth);
  const [selectedService, setSelectedService] = useState<ServiceHealth | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getOverallStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms < 100) return 'text-green-600';
    if (ms < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 0.1) return 'text-green-600';
    if (rate < 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const healthyServices = health.services.filter(s => s.status === 'healthy').length;
  const degradedServices = health.services.filter(s => s.status === 'degraded').length;
  const downServices = health.services.filter(s => s.status === 'down').length;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={`border-l-4 ${health.status === 'healthy' ? 'border-l-green-500' : health.status === 'degraded' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getOverallStatusColor(health.status)} bg-opacity-20`}>
              {health.status === 'healthy' ? (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : health.status === 'degraded' ? (
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                System {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
              </h2>
              <p className="text-gray-500">
                Last updated: {formatDate(health.timestamp, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-500">{isConnected ? 'Monitoring Active' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Overall Uptime</p>
            <p className="text-3xl font-bold text-gray-900">{health.overallUptime.toFixed(2)}%</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Healthy Services"
          value={healthyServices}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend="up"
        />
        <StatCard
          title="Degraded Services"
          value={degradedServices}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          trend={degradedServices > 0 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Down Services"
          value={downServices}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={downServices > 0 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Avg Response Time"
          value={`${Math.round(health.responseTime)}ms`}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Services Grid */}
      <Card>
        <CardHeader
          title="Service Status"
          subtitle="Real-time health of all system services"
          action={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">Down</span>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.services.map((service) => (
            <div
              key={service.name}
              onClick={() => {
                setSelectedService(service);
                setIsServiceModalOpen(true);
              }}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    <Badge variant={service.status}>{service.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uptime</span>
                  <span className="font-medium">{service.uptime.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Response Time</span>
                  <span className={`font-medium ${getResponseTimeColor(service.responseTime)}`}>
                    {Math.round(service.responseTime)}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Error Rate</span>
                  <span className={`font-medium ${getErrorRateColor(service.errorRate)}`}>
                    {service.errorRate.toFixed(3)}%
                  </span>
                </div>
              </div>

              {/* Mini status bar */}
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${service.uptime}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Response Time Chart */}
      <Card>
        <CardHeader
          title="Response Time Trends"
          subtitle="Average response times across all services"
        />
        
        <div className="h-64 flex items-end justify-between gap-2 px-4">
          {health.services.map((service) => {
            const maxResponse = Math.max(...health.services.map(s => s.responseTime));
            const heightPercent = (service.responseTime / maxResponse) * 100;
            
            return (
              <div key={service.name} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full max-w-[60px] rounded-t-lg transition-all duration-500 ${
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ height: `${Math.max(heightPercent, 10)}%` }}
                />
                <span className="text-xs text-gray-500 mt-2 text-center truncate w-full">
                  {service.name}
                </span>
                <span className={`text-xs font-medium ${getResponseTimeColor(service.responseTime)}`}>
                  {Math.round(service.responseTime)}ms
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Service Details Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={selectedService?.name || 'Service Details'}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setIsServiceModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedService && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(selectedService.status)}
              <div>
                <h3 className="text-xl font-semibold">{selectedService.name}</h3>
                <Badge variant={selectedService.status}>{selectedService.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-500">Uptime</label>
                <p className="text-2xl font-bold">{selectedService.uptime.toFixed(2)}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-500">Response Time</label>
                <p className={`text-2xl font-bold ${getResponseTimeColor(selectedService.responseTime)}`}>
                  {Math.round(selectedService.responseTime)}ms
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-500">Error Rate</label>
                <p className={`text-2xl font-bold ${getErrorRateColor(selectedService.errorRate)}`}>
                  {selectedService.errorRate.toFixed(3)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-500">Last Checked</label>
                <p className="text-lg font-medium">
                  {formatDate(selectedService.lastChecked, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Status History (simulated) */}
            <div>
              <label className="text-sm text-gray-500 mb-2 block">24-Hour Status History</label>
              <div className="flex gap-1">
                {Array.from({ length: 24 }).map((_, i) => {
                  const isHealthy = Math.random() > 0.2;
                  const isDegraded = !isHealthy && Math.random() > 0.5;
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded ${
                        isHealthy ? 'bg-green-500' : isDegraded ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      title={`Hour ${i}: ${isHealthy ? 'Healthy' : isDegraded ? 'Degraded' : 'Down'}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>24h ago</span>
                <span>12h ago</span>
                <span>Now</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restart Service
              </Button>
              <Button variant="ghost">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Logs
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
