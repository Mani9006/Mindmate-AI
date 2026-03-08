// User Management Table Component

'use client';

import { useState, useCallback } from 'react';
import { User } from '@/types';
import { useTable } from '@/hooks/useFilter';
import { formatDate, formatNumber, getInitials, truncateText } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal, ConfirmModal } from './ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from './ui/Table';
import { Card, CardHeader } from './ui/Card';

interface UserManagementTableProps {
  users: User[];
  onUserUpdate?: (user: User) => void;
  onUserDelete?: (userId: string) => void;
}

export function UserManagementTable({ users, onUserUpdate, onUserDelete }: UserManagementTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});

  const {
    filters,
    filteredData,
    paginatedData,
    setSearch,
    setFilter,
    handleSort,
    clearFilters,
    sortConfig,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex
  } = useTable({
    data: users,
    searchFields: ['name', 'email'],
    filterFields: {
      role: (user, value) => user.role === value,
      status: (user, value) => user.status === value,
      subscriptionTier: (user, value) => user.subscriptionTier === value
    },
    itemsPerPage: 10
  });

  const handleViewDetails = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  }, []);

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setEditedUser(user);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedUser && onUserDelete) {
      onUserDelete(selectedUser.id);
    }
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  }, [selectedUser, onUserDelete]);

  const saveEdit = useCallback(() => {
    if (selectedUser && onUserUpdate) {
      onUserUpdate({ ...selectedUser, ...editedUser } as User);
    }
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setEditedUser({});
  }, [selectedUser, editedUser, onUserUpdate]);

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'user', label: 'User' },
    { value: 'therapist', label: 'Therapist' },
    { value: 'admin', label: 'Admin' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const subscriptionOptions = [
    { value: 'all', label: 'All Tiers' },
    { value: 'free', label: 'Free' },
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' }
  ];

  return (
    <Card>
      <CardHeader
        title="User Management"
        subtitle={`${filteredData.length} total users`}
        action={
          <Button variant="primary" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            value={filters.role}
            onChange={(e) => setFilter('role', e.target.value)}
            options={roleOptions}
          />
        </div>
        <div className="w-40">
          <Select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            options={statusOptions}
          />
        </div>
        <div className="w-40">
          <Select
            value={filters.subscriptionTier || 'all'}
            onChange={(e) => setFilter('subscriptionTier', e.target.value)}
            options={subscriptionOptions}
          />
        </div>
        <Button variant="ghost" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader sortable sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null} onSort={() => handleSort('name')}>
              User
            </TableHeader>
            <TableHeader sortable sortDirection={sortConfig.key === 'role' ? sortConfig.direction : null} onSort={() => handleSort('role')}>
              Role
            </TableHeader>
            <TableHeader sortable sortDirection={sortConfig.key === 'status' ? sortConfig.direction : null} onSort={() => handleSort('status')}>
              Status
            </TableHeader>
            <TableHeader sortable sortDirection={sortConfig.key === 'subscriptionTier' ? sortConfig.direction : null} onSort={() => handleSort('subscriptionTier')}>
              Subscription
            </TableHeader>
            <TableHeader sortable sortDirection={sortConfig.key === 'sessionCount' ? sortConfig.direction : null} onSort={() => handleSort('sessionCount')}>
              Sessions
            </TableHeader>
            <TableHeader sortable sortDirection={sortConfig.key === 'lastActive' ? sortConfig.direction : null} onSort={() => handleSort('lastActive')}>
              Last Active
            </TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.map((user) => (
            <TableRow key={user.id} isClickable onClick={() => handleViewDetails(user)}>
              <TableCell>
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    {user.profileImage ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.profileImage}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {getInitials(user.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-gray-500">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.role}>{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.status}>{user.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.subscriptionTier}>{user.subscriptionTier}</Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium">{formatNumber(user.sessionCount)}</span>
                {user.crisisFlags > 0 && (
                  <span className="ml-2 text-red-600 text-xs">
                    ({user.crisisFlags} flags)
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-gray-500">{formatDate(user.lastActive)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(user);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(user);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(user);
                    }}
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        totalItems={filteredData.length}
        startIndex={startIndex}
        endIndex={endIndex}
      />

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="User Details"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => {
              setIsDetailsModalOpen(false);
              if (selectedUser) handleEdit(selectedUser);
            }}>
              Edit User
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-medium text-blue-600">
                  {getInitials(selectedUser.name)}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-semibold">{selectedUser.name}</h4>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="font-medium"><Badge variant={selectedUser.role}>{selectedUser.role}</Badge></p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="font-medium"><Badge variant={selectedUser.status}>{selectedUser.status}</Badge></p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Subscription</label>
                <p className="font-medium"><Badge variant={selectedUser.subscriptionTier}>{selectedUser.subscriptionTier}</Badge></p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Age</label>
                <p className="font-medium">{selectedUser.age || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Sessions</label>
                <p className="font-medium">{formatNumber(selectedUser.sessionCount)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Crisis Flags</label>
                <p className={`font-medium ${selectedUser.crisisFlags > 0 ? 'text-red-600' : ''}`}>
                  {selectedUser.crisisFlags}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Member Since</label>
                <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditedUser({});
        }}
        title="Edit User"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setIsEditModalOpen(false);
              setEditedUser({});
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={editedUser.name || selectedUser.name}
              onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={editedUser.email || selectedUser.email}
              onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
            />
            <Select
              label="Role"
              value={editedUser.role || selectedUser.role}
              onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as User['role'] })}
              options={roleOptions.filter(o => o.value !== 'all')}
            />
            <Select
              label="Status"
              value={editedUser.status || selectedUser.status}
              onChange={(e) => setEditedUser({ ...editedUser, status: e.target.value as User['status'] })}
              options={statusOptions.filter(o => o.value !== 'all')}
            />
            <Select
              label="Subscription Tier"
              value={editedUser.subscriptionTier || selectedUser.subscriptionTier}
              onChange={(e) => setEditedUser({ ...editedUser, subscriptionTier: e.target.value as User['subscriptionTier'] })}
              options={subscriptionOptions.filter(o => o.value !== 'all')}
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="danger"
      />
    </Card>
  );
}
