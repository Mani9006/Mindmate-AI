// Session Flags Review Component

'use client';

import { useState, useCallback } from 'react';
import { SessionFlag } from '@/types';
import { useSessionFlags } from '@/hooks/useRealtime';
import { formatRelativeTime, formatDate, getSeverityColor, truncateText } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal, ConfirmModal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, StatCard } from './ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './ui/Table';

interface SessionFlagsReviewProps {
  initialFlags: SessionFlag[];
}

export function SessionFlagsReview({ initialFlags }: SessionFlagsReviewProps) {
  const {
    flags,
    reviewFlag,
    resolveFlag,
    dismissFlag,
    openFlagsCount,
    underReviewCount
  } = useSessionFlags(initialFlags);

  const [selectedFlag, setSelectedFlag] = useState<SessionFlag | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'review' | 'resolve' | 'dismiss'>('review');
  const [actionNotes, setActionNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const handleAction = useCallback((flag: SessionFlag, action: 'review' | 'resolve' | 'dismiss') => {
    setSelectedFlag(flag);
    setActionType(action);
    setActionNotes('');
    setIsActionModalOpen(true);
  }, []);

  const confirmAction = useCallback(() => {
    if (!selectedFlag) return;

    switch (actionType) {
      case 'review':
        reviewFlag(selectedFlag.id, actionNotes);
        break;
      case 'resolve':
        resolveFlag(selectedFlag.id, actionNotes);
        break;
      case 'dismiss':
        dismissFlag(selectedFlag.id, actionNotes);
        break;
    }

    setIsActionModalOpen(false);
    setSelectedFlag(null);
    setActionNotes('');
  }, [selectedFlag, actionType, actionNotes, reviewFlag, resolveFlag, dismissFlag]);

  const filteredFlags = flags.filter(flag => {
    if (filterStatus !== 'all' && flag.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && flag.severity !== filterSeverity) return false;
    if (filterType !== 'all' && flag.flagType !== filterType) return false;
    return true;
  });

  const getFlagTypeLabel = (type: SessionFlag['flagType']) => {
    const labels: Record<string, string> = {
      concerning_behavior: 'Concerning Behavior',
      crisis_indicator: 'Crisis Indicator',
      quality_issue: 'Quality Issue',
      boundary_violation: 'Boundary Violation',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'concerning_behavior', label: 'Concerning Behavior' },
    { value: 'crisis_indicator', label: 'Crisis Indicator' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'boundary_violation', label: 'Boundary Violation' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Open Flags"
          value={openFlagsCount}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 21h18M5 21v-8a2 2 0 012-2h14a2 2 0 012 2v8" />
            </svg>
          }
          trend={openFlagsCount > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Under Review"
          value={underReviewCount}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          title="Total Flags"
          value={flags.length}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        <StatCard
          title="AI Detection Rate"
          value={`${Math.round(flags.filter(f => f.aiConfidence && f.aiConfidence > 0.8).length / flags.length * 100)}%`}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
      </div>

      {/* Flags List */}
      <Card>
        <CardHeader
          title="Session Flags Review"
          subtitle="AI-detected session anomalies and concerns"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
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
          <div className="w-48">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={typeOptions}
            />
          </div>
        </div>

        {/* Content */}
        {filteredFlags.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No flags matching your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="space-y-4">
            {filteredFlags.map((flag) => (
              <div
                key={flag.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  flag.status === 'open' ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={flag.severity}>{flag.severity}</Badge>
                      <Badge variant={flag.flagType}>{getFlagTypeLabel(flag.flagType)}</Badge>
                      <Badge variant={flag.status}>{flag.status.replace('_', ' ')}</Badge>
                      {flag.aiConfidence && (
                        <span className={`text-xs font-medium ${flag.aiConfidence > 0.8 ? 'text-green-600' : flag.aiConfidence > 0.6 ? 'text-yellow-600' : 'text-orange-600'}`}>
                          AI: {Math.round(flag.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-medium">{flag.userName}</span>
                      {flag.therapistName && (
                        <>
                          <span>•</span>
                          <span>Therapist: {flag.therapistName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatRelativeTime(flag.createdAt)}</span>
                    </div>
                    
                    <p className="text-gray-800">{flag.description}</p>
                    
                    {flag.resolution && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                        <span className="font-medium">Resolution:</span> {flag.resolution}
                      </div>
                    )}
                    
                    {flag.reviewedBy && (
                      <div className="mt-2 text-sm text-gray-500">
                        Reviewed by {flag.reviewedBy} {flag.reviewedAt && formatRelativeTime(flag.reviewedAt)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {flag.status === 'open' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(flag, 'review')}
                      >
                        Review
                      </Button>
                    )}
                    {flag.status !== 'resolved' && flag.status !== 'dismissed' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAction(flag, 'resolve')}
                        >
                          Resolve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(flag, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFlag(flag);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Flag</TableHeader>
                <TableHeader>User</TableHeader>
                <TableHeader>Severity</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>AI Confidence</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFlags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{getFlagTypeLabel(flag.flagType)}</p>
                      <p className="text-sm text-gray-500">{truncateText(flag.description, 50)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{flag.userName}</p>
                    {flag.therapistName && (
                      <p className="text-sm text-gray-500">Dr. {flag.therapistName}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={flag.severity}>{flag.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={flag.status}>{flag.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    {flag.aiConfidence ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${flag.aiConfidence > 0.8 ? 'bg-green-500' : flag.aiConfidence > 0.6 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                            style={{ width: `${flag.aiConfidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">{Math.round(flag.aiConfidence * 100)}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-500">{formatRelativeTime(flag.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFlag(flag);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                      {flag.status === 'open' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAction(flag, 'review')}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Flag Details"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
            {selectedFlag?.status === 'open' && (
              <Button variant="primary" onClick={() => {
                setIsDetailsModalOpen(false);
                if (selectedFlag) handleAction(selectedFlag, 'review');
              }}>
                Start Review
              </Button>
            )}
          </>
        }
      >
        {selectedFlag && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={selectedFlag.severity}>{selectedFlag.severity}</Badge>
              <Badge variant={selectedFlag.flagType}>{getFlagTypeLabel(selectedFlag.flagType)}</Badge>
              <Badge variant={selectedFlag.status}>{selectedFlag.status.replace('_', ' ')}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">User</label>
                <p className="font-medium">{selectedFlag.userName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Session ID</label>
                <p className="font-medium font-mono text-sm">{selectedFlag.sessionId}</p>
              </div>
              {selectedFlag.therapistName && (
                <div>
                  <label className="text-sm text-gray-500">Therapist</label>
                  <p className="font-medium">{selectedFlag.therapistName}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500">Created</label>
                <p className="font-medium">{formatDate(selectedFlag.createdAt)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Description</label>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedFlag.description}</p>
            </div>

            {selectedFlag.aiConfidence && (
              <div>
                <label className="text-sm text-gray-500">AI Confidence</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${selectedFlag.aiConfidence > 0.8 ? 'bg-green-500' : selectedFlag.aiConfidence > 0.6 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                      style={{ width: `${selectedFlag.aiConfidence * 100}%` }}
                    />
                  </div>
                  <span className="font-medium">{Math.round(selectedFlag.aiConfidence * 100)}%</span>
                </div>
              </div>
            )}

            {selectedFlag.resolution && (
              <div>
                <label className="text-sm text-gray-500">Resolution</label>
                <p className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  {selectedFlag.resolution}
                </p>
              </div>
            )}

            {selectedFlag.reviewedBy && (
              <div>
                <label className="text-sm text-gray-500">Reviewed</label>
                <p className="font-medium">
                  By {selectedFlag.reviewedBy} on {selectedFlag.reviewedAt && formatDate(selectedFlag.reviewedAt)}
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
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Flag`}
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setIsActionModalOpen(false);
              setActionNotes('');
            }}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'dismiss' ? 'ghost' : 'primary'}
              onClick={confirmAction}
            >
              Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to {actionType} this flag for <strong>{selectedFlag?.userName}</strong>.
          </p>
          <Input
            label={actionType === 'resolve' ? 'Resolution Notes' : actionType === 'dismiss' ? 'Dismissal Reason' : 'Review Notes'}
            placeholder={`Add notes about why you're ${actionType}ing this flag...`}
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
