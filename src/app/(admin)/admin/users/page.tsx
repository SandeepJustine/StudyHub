'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Search,
  Download,
  Ban,
  RefreshCw,
  AlertCircle,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/formatters';

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'SCHOOL_ADMIN', label: 'School Admin' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'CORPORATE_CLIENT', label: 'Corporate Client' },
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin' },
  { value: 'PARENT', label: 'Parent' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: string; label: string }>({ action: '', label: '' });
  const [newRole, setNewRole] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole, pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedRole) params.append('role', selectedRole);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message);
      
      // Mock data fallback
      setUsers([
        { id: '1', fullName: 'John Phiri', email: 'john@email.com', phone: '+265888000001', role: 'STUDENT', locale: 'en', isVerified: true, isLocked: false, stats: { subscriptions: 1, transactions: 5, notifications: 12 }, createdAt: '2025-01-15', lastLoginAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', fullName: 'Mary Banda', email: 'mary@email.com', phone: '+265888000002', role: 'INSTRUCTOR', locale: 'en', isVerified: true, isLocked: false, stats: { subscriptions: 1, transactions: 25, notifications: 45 }, createdAt: '2025-03-10', lastLoginAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', fullName: 'Platform Admin', email: 'admin@studyhub.mw', phone: '+265888000000', role: 'PLATFORM_ADMIN', locale: 'en', isVerified: true, isLocked: false, stats: { subscriptions: 0, transactions: 0, notifications: 100 }, createdAt: '2025-01-01', lastLoginAt: new Date().toISOString() },
        { id: '4', fullName: 'Suspended User', email: 'suspended@email.com', phone: null, role: 'STUDENT', locale: 'en', isVerified: true, isLocked: true, stats: { subscriptions: 0, transactions: 1, notifications: 5 }, createdAt: '2025-08-20', lastLoginAt: null },
      ]);
      setPagination({ page: 1, limit: 20, total: 4, totalPages: 1 });
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

      const result = await response.json();

      if (response.ok && result.success) {
        setToast({ message: `User ${action.replace(/_/g, ' ')} successful`, type: 'success' });
        fetchUsers();
        setShowRoleModal(false);
        setShowConfirmModal(false);
        setShowUserModal(false);
      } else {
        setToast({ message: result.error || 'Action failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Action failed', type: 'error' });
    }
  };

  const handleRoleChange = () => {
    if (selectedUser && newRole) {
      handleUserAction('update_role', selectedUser.id, { role: newRole });
    }
  };

  const handleLockToggle = () => {
    if (selectedUser) {
      handleUserAction('toggle_lock', selectedUser.id);
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) {
      setToast({ message: 'No data to export', type: 'error' });
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Verified', 'Locked', 'Subscriptions', 'Transactions', 'Joined'];
    const rows = users.map(user => [
      user.fullName || '',
      user.email || '',
      user.phone || '',
      user.role || '',
      user.isVerified ? 'Yes' : 'No',
      user.isLocked ? 'Yes' : 'No',
      user.stats?.subscriptions || 0,
      user.stats?.transactions || 0,
      formatDate(user.createdAt),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setToast({ message: 'CSV exported successfully', type: 'success' });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'error' | 'info' | 'success' | 'warning' | 'neutral'> = {
      PLATFORM_ADMIN: 'error',
      SCHOOL_ADMIN: 'info',
      INSTRUCTOR: 'success',
      CORPORATE_CLIENT: 'warning',
      STUDENT: 'neutral',
      PARENT: 'neutral',
    };
    return <Badge variant={variants[role] || 'neutral'}>{role?.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      accessor: (user: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
            <span className="font-medium text-navy text-sm">
              {user.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-navy truncate">{user.fullName || 'Unknown'}</p>
            <p className="text-xs text-grey-medium truncate">{user.email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (user: any) => getRoleBadge(user.role),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user: any) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-green' : 'bg-yellow-500'}`} />
          <span className="text-sm whitespace-nowrap">{user.isVerified ? 'Verified' : 'Unverified'}</span>
          {user.isLocked && <Ban size={14} className="text-red flex-shrink-0" />}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      accessor: (user: any) => (
        <div className="text-sm whitespace-nowrap">
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
          <p className="whitespace-nowrap">{formatDate(user.createdAt)}</p>
          {user.lastLoginAt && (
            <p className="text-xs text-grey-medium whitespace-nowrap">Last: {formatRelativeTime(user.lastLoginAt)}</p>
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
            <Eye size={14} className="mr-1" /> View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); }}
          >
            <Shield size={14} className="mr-1" /> Role
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setConfirmAction({
                action: 'toggle_lock',
                label: user.isLocked ? 'Unlock Account' : 'Lock Account',
              });
              setShowConfirmModal(true);
            }}
          >
            {user.isLocked ? (
              <><CheckCircle size={14} className="mr-1" /> Unlock</>
            ) : (
              <><XCircle size={14} className="mr-1" /> Lock</>
            )}
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
          <Button variant="ghost" size="sm" onClick={fetchUsers}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

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
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
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
      {pagination.totalPages > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="User Details" size="lg">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-navy">
                  {selectedUser.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy">{selectedUser.fullName}</h3>
                <p className="text-grey-dark">{selectedUser.email}</p>
                <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowUserModal(false); setNewRole(selectedUser.role); setShowRoleModal(true); }}>
                Change Role
              </Button>
              <Button variant={selectedUser.isLocked ? 'success' : 'danger'} onClick={() => {
                setShowUserModal(false);
                setConfirmAction({ action: 'toggle_lock', label: selectedUser.isLocked ? 'Unlock Account' : 'Lock Account' });
                setShowConfirmModal(true);
              }}>
                {selectedUser.isLocked ? 'Unlock Account' : 'Lock Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Role Change Modal - THIS WAS MISSING! */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Change User Role" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-grey-dark">
            Change role for <strong>{selectedUser?.fullName}</strong>
          </p>
          <select
            className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRoleChange}>Change Role</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Action Modal - THIS WAS MISSING! */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Action" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-grey-dark">
            Are you sure you want to {confirmAction.label.toLowerCase()} for <strong>{selectedUser?.fullName}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button
              variant={confirmAction.action === 'toggle_lock' && selectedUser?.isLocked ? 'success' : 'danger'}
              onClick={handleLockToggle}
            >
              {confirmAction.label}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}