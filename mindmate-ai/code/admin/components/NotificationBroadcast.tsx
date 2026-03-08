// Notification Broadcast Tool Component

'use client';

import { useState, useCallback } from 'react';
import { NotificationBroadcast } from '@/types';
import { formatDate, formatRelativeTime, truncateText } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal, ConfirmModal } from './ui/Modal';
import { Card, CardHeader, StatCard } from './ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './ui/Table';

interface NotificationBroadcastProps {
  notifications: NotificationBroadcast[];
  onCreateBroadcast?: (broadcast: Omit<NotificationBroadcast, 'id' | 'createdAt' | 'sentAt' | 'status' | 'sentCount' | 'failedCount'>) => void;
  onSendBroadcast?: (id: string) => void;
  onCancelBroadcast?: (id: string) => void;
}

export function NotificationBroadcastTool({
  notifications,
  onCreateBroadcast,
  onSendBroadcast,
  onCancelBroadcast
}: NotificationBroadcastProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationBroadcast | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as NotificationBroadcast['type'],
    targetAudience: 'all' as NotificationBroadcast['targetAudience'],
    scheduledAt: ''
  });

  const handleCreate = useCallback(() => {
    if (onCreateBroadcast) {
      onCreateBroadcast({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetAudience: formData.targetAudience,
        scheduledAt: formData.scheduledAt || undefined
      });
    }
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      scheduledAt: ''
    });
    setIsCreateModalOpen(false);
  }, [formData, onCreateBroadcast]);

  const handleSendNow = useCallback((notification: NotificationBroadcast) => {
    if (onSendBroadcast) {
      onSendBroadcast(notification.id);
    }
  }, [onSendBroadcast]);

  const handleCancel = useCallback((notification: NotificationBroadcast) => {
    if (onCancelBroadcast) {
      onCancelBroadcast(notification.id);
    }
  }, [onCancelBroadcast]);

  const filteredNotifications = notifications.filter(n => {
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    return true;
  });

  const getTypeIcon = (type: NotificationBroadcast['type']) => {
    switch (type) {
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const typeOptions = [
    { value: 'info', label: 'Information' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const targetOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'users', label: 'Users Only' },
    { value: 'therapists', label: 'Therapists Only' },
    { value: 'admins', label: 'Admins Only' },
    { value: 'custom', label: 'Custom Filter' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sending', label: 'Sending' },
    { value: 'sent', label: 'Sent' },
    { value: 'failed', label: 'Failed' }
  ];

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
    draft: notifications.filter(n => n.status === 'draft').length,
    totalSent: notifications.reduce((sum, n) => sum + n.sentCount, 0),
    totalFailed: notifications.reduce((sum, n) => sum + n.failedCount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Broadcasts"
          value={stats.total}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
        />
        <StatCard
          title="Messages Sent"
          value={stats.totalSent.toLocaleString()}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Failed"
          value={stats.totalFailed}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader
          title="Notification Broadcasts"
          subtitle="Manage and send notifications to users"
          action={
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Broadcast
            </Button>
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
        </div>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Notification</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Target</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Delivery</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNotifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
                    <div>
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-500">{truncateText(notification.message, 60)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={notification.type}>{notification.type}</Badge>
                </TableCell>
                <TableCell>
                  <span className="capitalize">{notification.targetAudience.replace('_', ' ')}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={notification.status}>{notification.status}</Badge>
                </TableCell>
                <TableCell>
                  {notification.status === 'sent' ? (
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">{notification.sentCount.toLocaleString()}</span>
                      <span className="text-gray-400"> sent</span>
                      {notification.failedCount > 0 && (
                        <span className="text-red-600 ml-2">({notification.failedCount} failed)</span>
                      )}
                    </div>
                  ) : notification.scheduledAt ? (
                    <span className="text-sm text-gray-500">
                      Scheduled for {formatDate(notification.scheduledAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-gray-500">{formatRelativeTime(notification.createdAt)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedNotification(notification);
                        setIsPreviewModalOpen(true);
                      }}
                    >
                      Preview
                    </Button>
                    {notification.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendNow(notification)}
                      >
                        Send Now
                      </Button>
                    )}
                    {notification.status === 'scheduled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(notification)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Broadcast"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Save as Draft
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Send Now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter notification title..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
              placeholder="Enter your message..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.message.length} characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Notification Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationBroadcast['type'] })}
              options={typeOptions}
            />
            <Select
              label="Target Audience"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as NotificationBroadcast['targetAudience'] })}
              options={targetOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to send immediately
            </p>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon(formData.type)}
                <span className="font-medium">{formData.title || 'Notification Title'}</span>
              </div>
              <p className="text-gray-600">{formData.message || 'Your notification message will appear here...'}</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Notification Preview"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </Button>
            {selectedNotification?.status === 'draft' && (
              <Button variant="primary" onClick={() => selectedNotification && handleSendNow(selectedNotification)}>
                Send Now
              </Button>
            )}
          </>
        }
      >
        {selectedNotification && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                {getTypeIcon(selectedNotification.type)}
                <div>
                  <h4 className="font-semibold text-lg">{selectedNotification.title}</h4>
                  <Badge variant={selectedNotification.type}>{selectedNotification.type}</Badge>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Target Audience</label>
                <p className="font-medium capitalize">{selectedNotification.targetAudience.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="font-medium"><Badge variant={selectedNotification.status}>{selectedNotification.status}</Badge></p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Created By</label>
                <p className="font-medium">{selectedNotification.createdBy}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Created At</label>
                <p className="font-medium">{formatDate(selectedNotification.createdAt)}</p>
              </div>
              {selectedNotification.scheduledAt && (
                <div>
                  <label className="text-sm text-gray-500">Scheduled For</label>
                  <p className="font-medium">{formatDate(selectedNotification.scheduledAt)}</p>
                </div>
              )}
              {selectedNotification.sentAt && (
                <div>
                  <label className="text-sm text-gray-500">Sent At</label>
                  <p className="font-medium">{formatDate(selectedNotification.sentAt)}</p>
                </div>
              )}
              {selectedNotification.status === 'sent' && (
                <>
                  <div>
                    <label className="text-sm text-gray-500">Successfully Sent</label>
                    <p className="font-medium text-green-600">{selectedNotification.sentCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Failed</label>
                    <p className={`font-medium ${selectedNotification.failedCount > 0 ? 'text-red-600' : ''}`}>
                      {selectedNotification.failedCount.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
