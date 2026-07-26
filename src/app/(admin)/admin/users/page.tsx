'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Clock,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { UserRole } from '@/types/common';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole, pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedRole) params.append('role', selectedRole);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToast({ message: 'Failed to fetch users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string, extraData?: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, data: extraData }),
      });

      if (response.ok) {
        setToast({ message: `User ${action.replace(/_/g, ' ')} successful`, type: 'success' });
        fetchUsers();
        setShowActionModal(false);
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Action failed', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Action failed', type: 'error' });
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      accessor: (user: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
            <span className="font-medium text-navy">
              {user.fullName?.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-navy">{user.fullName}</p>
            <p className="text-xs text-grey-medium">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (user: any) => (
        <Badge variant={
          user.role === 'PLATFORM_ADMIN' ? 'error' :
          user.role === 'SCHOOL_ADMIN' ? 'info' :
          user.role === 'INSTRUCTOR' ? 'success' :
          'neutral'
        }>
          {user.role?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user: any) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-green' : 'bg-yellow-500'}`} />
          <span className="text-sm">{user.isVerified ? 'Verified' : 'Unverified'}</span>
          {user.isLocked && <Ban size={14} className="text-red" />}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      accessor: (user: any) => (
        <div className="text-sm">
          <p>{user.stats?.subscriptions || 0} subs</p>
          <p className="text-xs text-grey-medium">{user.stats?.transactions || 0} txns</p>
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      accessor: (user: any) => (
        <div className="text-sm">
          <p>{formatDate(user.createdAt)}</p>
          {user.lastLoginAt && (
            <p className="text-xs text-grey-medium">Last: {formatRelativeTime(user.lastLoginAt)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (user: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedUser(user); setActionType('role'); setShowActionModal(true); }}
          >
            Role
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setActionType(user.isLocked ? 'unlock' : 'lock');
              setShowActionModal(true);
            }}
          >
            {user.isLocked ? 'Unlock' : 'Lock'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">User Management</h1>
          <p className="text-grey-dark mt-1">Manage all platform users</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Download size={16} />}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="SCHOOL_ADMIN">School Admin</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="CORPORATE_CLIENT">Corporate Client</option>
            <option value="PLATFORM_ADMIN">Platform Admin</option>
            <option value="PARENT">Parent</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={users}
            columns={columns}
            isLoading={loading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-grey-medium">
          Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>

      {/* User Detail Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-navy">
                  {selectedUser.fullName?.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy">{selectedUser.fullName}</h3>
                <p className="text-grey-dark">{selectedUser.email}</p>
                <Badge className="mt-1">{selectedUser.role?.replace(/_/g, ' ')}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Phone</p>
                <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Locale</p>
                <p className="font-medium">{selectedUser.locale || 'en'}</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Verified</p>
                <Badge variant={selectedUser.isVerified ? 'success' : 'warning'}>
                  {selectedUser.isVerified ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Locked</p>
                <Badge variant={selectedUser.isLocked ? 'error' : 'success'}>
                  {selectedUser.isLocked ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-navy mb-2">Account Stats</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-navy/5 rounded-lg text-center">
                  <p className="text-2xl font-bold text-navy">{selectedUser.stats?.subscriptions || 0}</p>
                  <p className="text-xs text-grey-medium">Subscriptions</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green">{selectedUser.stats?.transactions || 0}</p>
                  <p className="text-xs text-grey-medium">Transactions</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedUser.stats?.notifications || 0}</p>
                  <p className="text-xs text-grey-medium">Notifications</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
                setShowUserModal(false);
                setActionType('role');
                setShowActionModal(true);
              }}>
                Change Role
              </Button>
              <Button
                variant={selectedUser.isLocked ? 'success' : 'danger'}
                onClick={() => handleUserAction(
                  selectedUser.isLocked ? 'toggle_lock' : 'toggle_lock',
                  selectedUser.id
                )}
              >
                {selectedUser.isLocked ? 'Unlock Account' : 'Lock Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}