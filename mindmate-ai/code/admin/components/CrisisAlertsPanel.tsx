// Crisis Alerts Panel Component

'use client';

import { useState, useCallback } from 'react';
import { CrisisAlert } from '@/types';
import { useRealtimeCrisisAlerts } from '@/hooks/useRealtime';
import { formatRelativeTime, formatDate, getSeverityColor, getSeverityBgColor, truncateText } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, StatCard } from './ui/Card';

interface CrisisAlertsPanelProps {
  initialAlerts: CrisisAlert[];
}

export function CrisisAlertsPanel({ initialAlerts }: CrisisAlertsPanelProps) {
  const {
    alerts,
    isConnected,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
    newAlertsCount,
    criticalAlertsCount
  } = useRealtimeCrisisAlerts(initialAlerts);

  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'acknowledge' | 'escalate' | 'resolve'>('acknowledge');
  const [actionNotes, setActionNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const handleAction = useCallback((alert: CrisisAlert, action: 'acknowledge' | 'escalate' | 'resolve') => {
    setSelectedAlert(alert);
    setActionType(action);
    setActionNotes('');
    setIsActionModalOpen(true);
  }, []);

  const confirmAction = useCallback(() => {
    if (!selectedAlert) return;

    switch (actionType) {
      case 'acknowledge':
        acknowledgeAlert(selectedAlert.id, actionNotes);
        break;
      case 'escalate':
        escalateAlert(selectedAlert.id, actionNotes);
        break;
      case 'resolve':
        resolveAlert(selectedAlert.id, actionNotes);
        break;
    }

    setIsActionModalOpen(false);
    setSelectedAlert(null);
    setActionNotes('');
  }, [selectedAlert, actionType, actionNotes, acknowledgeAlert, escalateAlert, resolveAlert]);

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    return true;
  });

  const getAlertTypeLabel = (type: CrisisAlert['type']) => {
    const labels: Record<string, string> = {
      self_harm: 'Self-Harm',
      suicide_ideation: 'Suicide Ideation',
      violence: 'Violence',
      substance_abuse: 'Substance Abuse',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'escalated', label: 'Escalated' }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="New Alerts"
          value={newAlertsCount}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          trend={newAlertsCount > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalAlertsCount}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          trend={criticalAlertsCount > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Total Open"
          value={alerts.filter(a => a.status !== 'resolved').length}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Connection Status"
          value={isConnected ? 'Live' : 'Disconnected'}
          icon={
            <svg className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          trend={isConnected ? 'up' : 'down'}
        />
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader
          title="Crisis Alerts"
          subtitle="Real-time monitoring and response"
          action={
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-40">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={statusOptions}
            />
          </div>
          <div className="w-40">
            <Select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              options={severityOptions}
            />
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No alerts matching your filters</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  alert.status === 'new' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityBgColor(alert.severity)}`} />
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                      <Badge variant={alert.type}>{getAlertTypeLabel(alert.type)}</Badge>
                      <Badge variant={alert.status}>{alert.status}</Badge>
                      {alert.status === 'new' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-medium">{alert.userName}</span>
                      <span>•</span>
                      <span>{alert.userEmail}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(alert.timestamp)}</span>
                    </div>
                    
                    <p className="text-gray-800">{alert.message}</p>
                    
                    {alert.notes && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {alert.notes}
                      </div>
                    )}
                    
                    {alert.acknowledgedBy && (
                      <div className="mt-2 text-sm text-gray-500">
                        Acknowledged by {alert.acknowledgedBy} {alert.acknowledgedAt && formatRelativeTime(alert.acknowledgedAt)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {alert.status === 'new' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(alert, 'acknowledge')}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.status !== 'resolved' && alert.status !== 'escalated' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAction(alert, 'escalate')}
                        >
                          Escalate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(alert, 'resolve')}
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Alert Details"
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedAlert && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={selectedAlert.severity}>{selectedAlert.severity}</Badge>
              <Badge variant={selectedAlert.type}>{getAlertTypeLabel(selectedAlert.type)}</Badge>
              <Badge variant={selectedAlert.status}>{selectedAlert.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">User</label>
                <p className="font-medium">{selectedAlert.userName}</p>
                <p className="text-sm text-gray-500">{selectedAlert.userEmail}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Timestamp</label>
                <p className="font-medium">{formatDate(selectedAlert.timestamp)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Session ID</label>
                <p className="font-medium font-mono text-sm">{selectedAlert.sessionId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Alert ID</label>
                <p className="font-medium font-mono text-sm">{selectedAlert.id}</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Message</label>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedAlert.message}</p>
            </div>

            {selectedAlert.notes && (
              <div>
                <label className="text-sm text-gray-500">Notes</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedAlert.notes}</p>
              </div>
            )}

            {selectedAlert.acknowledgedBy && (
              <div>
                <label className="text-sm text-gray-500">Acknowledged</label>
                <p className="font-medium">
                  By {selectedAlert.acknowledgedBy} on {selectedAlert.acknowledgedAt && formatDate(selectedAlert.acknowledgedAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setActionNotes('');
        }}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Alert`}
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setIsActionModalOpen(false);
              setActionNotes('');
            }}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'escalate' ? 'danger' : 'primary'}
              onClick={confirmAction}
            >
              Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to {actionType} this alert for <strong>{selectedAlert?.userName}</strong>.
          </p>
          <Input
            label="Notes (optional)"
            placeholder={`Add notes about why you're ${actionType}ing this alert...`}
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
