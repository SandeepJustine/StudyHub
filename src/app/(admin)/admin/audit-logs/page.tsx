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
  Calendar,
  Shield,
  User,
  Clock,
  Eye,
  FileText,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/formatters';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, entityFilter, actionFilter, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();

      const formattedLogs = data.data.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));

      setLogs(formattedLogs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setToast({ message: 'Failed to fetch audit logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('UPDATE') || action.includes('EDIT')) return <Badge variant="info">{action}</Badge>;
    if (action.includes('DELETE') || action.includes('LOCK') || action.includes('CANCEL')) return <Badge variant="error">{action}</Badge>;
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('PROCESS')) return <Badge variant="success">{action}</Badge>;
    return <Badge>{action}</Badge>;
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Time',
      accessor: (log: any) => (
        <div className="text-sm">
          <p>{formatRelativeTime(log.timestamp)}</p>
          <p className="text-xs text-grey-medium">{formatDate(log.timestamp)}</p>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
      accessor: (log: any) => (
        <div>
          <p className="font-medium text-navy">{log.admin}</p>
          <p className="text-xs text-grey-medium">{log.adminEmail}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (log: any) => getActionBadge(log.action),
    },
    {
      key: 'entity',
      header: 'Entity',
      accessor: (log: any) => (
        <div className="text-sm">
          <p className="font-medium">{log.entity}</p>
          <p className="text-xs text-grey-medium">ID: {log.entityId}</p>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      accessor: (log: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSelectedLog(log); setShowDetails(true); }}
        >
          <Eye size={14} className="mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Audit Logs</h1>
          <p className="text-grey-dark mt-1">Track all administrative actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download size={16} />}>
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="">All Entities</option>
            <option value="USER">User</option>
            <option value="COURSE">Course</option>
            <option value="SUBSCRIPTION">Subscription</option>
            <option value="PAYOUT">Payout</option>
            <option value="PRICING">Pricing</option>
            <option value="CERTIFICATE">Certificate</option>
          </select>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
          </select>
          <Button variant="outline" leftIcon={<Calendar size={16} />}>
            Date Range
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={logs}
            columns={columns}
            isLoading={loading}
            emptyMessage="No audit logs found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-grey-medium">
          Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
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

      {/* Log Detail Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Audit Log Detail"
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Admin</p>
                <p className="font-medium">{selectedLog.admin}</p>
                <p className="text-xs text-grey-medium">{selectedLog.adminEmail}</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Timestamp</p>
                <p className="font-medium">{selectedLog.timestamp.toLocaleString()}</p>
                <p className="text-xs text-grey-medium">IP: {selectedLog.ipAddress}</p>
              </div>
            </div>

            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm font-medium text-navy mb-2">Action: {selectedLog.action}</p>
              <p className="text-sm text-grey-dark">
                Entity: {selectedLog.entity} (ID: {selectedLog.entityId})
              </p>
            </div>

            {selectedLog.changes && (
              <div>
                <h4 className="font-semibold text-navy mb-2">Changes Made</h4>
                <pre className="bg-grey-light p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            )}
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