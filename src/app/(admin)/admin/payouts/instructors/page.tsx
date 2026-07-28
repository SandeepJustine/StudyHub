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
  RefreshCw,
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function InstructorEarningsPage() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [totals, setTotals] = useState({ totalInstructors: 0, totalEarnings: 0, totalPending: 0 });

  useEffect(() => {
    fetchInstructors();
  }, [searchQuery, pagination.page]);

  const fetchInstructors = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/payouts/instructors?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch instructors');

      const data = await response.json();
      
      if (data.success) {
        setInstructors(data.data || []);
        setTotals(data.totals || { totalInstructors: 0, totalEarnings: 0, totalPending: 0 });
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err: any) {
      console.error('Failed to fetch instructors:', err);
      setError(err.message);
      
      // Mock data fallback
      setInstructors([
        { id: '1', name: 'Prof. Michael', email: 'michael@email.com', revenueShare: 70, totalEarnings: 1250000, pendingEarnings: 250000, coursesCount: 12, totalPayouts: 8, pendingPayoutAmount: 180000, pendingPayoutCount: 2, lastPayout: { amount: 150000, date: new Date('2026-06-15'), period: '2026-06' } },
        { id: '2', name: 'Dr. Sarah', email: 'sarah@email.com', revenueShare: 80, totalEarnings: 980000, pendingEarnings: 120000, coursesCount: 8, totalPayouts: 5, pendingPayoutAmount: 120000, pendingPayoutCount: 1, lastPayout: { amount: 200000, date: new Date('2026-06-20'), period: '2026-06' } },
        { id: '3', name: 'John Teacher', email: 'john@email.com', revenueShare: 70, totalEarnings: 450000, pendingEarnings: 80000, coursesCount: 5, totalPayouts: 3, pendingPayoutAmount: 80000, pendingPayoutCount: 1, lastPayout: null },
      ]);
      setTotals({ totalInstructors: 3, totalEarnings: 2680000, totalPending: 450000 });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'instructor',
      header: 'Instructor',
      accessor: (inst: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
            <span className="font-medium text-navy">
              {inst.name?.split(' ').map((n: string) => n[0]).join('') || 'I'}
            </span>
          </div>
          <div>
            <p className="font-medium text-navy">{inst.name}</p>
            <p className="text-xs text-grey-medium">{inst.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'share',
      header: 'Revenue Share',
      accessor: (inst: any) => (
        <Badge variant={inst.revenueShare >= 80 ? 'success' : 'info'}>
          {inst.revenueShare}%
        </Badge>
      ),
    },
    {
      key: 'earnings',
      header: 'Total Earnings',
      accessor: (inst: any) => (
        <div>
          <p className="font-semibold text-green">{formatCurrency(inst.totalEarnings)}</p>
          {inst.pendingEarnings > 0 && (
            <p className="text-xs text-yellow-600">{formatCurrency(inst.pendingEarnings)} pending</p>
          )}
        </div>
      ),
    },
    {
      key: 'courses',
      header: 'Courses',
      accessor: (inst: any) => (
        <div className="text-sm">
          <p className="font-medium">{inst.coursesCount}</p>
          <p className="text-xs text-grey-medium">{inst.totalPayouts} payouts</p>
        </div>
      ),
    },
    {
      key: 'lastPayout',
      header: 'Last Payout',
      accessor: (inst: any) => (
        <div className="text-sm">
          {inst.lastPayout ? (
            <>
              <p className="font-medium">{formatCurrency(inst.lastPayout.amount)}</p>
              <p className="text-xs text-grey-medium">{formatDate(inst.lastPayout.date)}</p>
            </>
          ) : (
            <span className="text-grey-medium">No payouts yet</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (inst: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSelectedInstructor(inst); setShowDetail(true); }}
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
          <h1 className="text-2xl font-bold text-navy">Instructor Earnings</h1>
          <p className="text-grey-dark mt-1">Overview of all instructor revenue and payouts</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchInstructors}>
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Instructors</p>
                <p className="text-xl font-bold text-navy">{totals.totalInstructors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign size={20} className="text-green" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Earnings</p>
                <p className="text-xl font-bold text-green">{formatCurrency(totals.totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Pending</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(totals.totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Search instructors by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} className="text-grey-medium" />}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={instructors}
            columns={columns}
            isLoading={loading}
            emptyMessage="No instructors found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      {/* Instructor Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={selectedInstructor?.name || 'Instructor Details'}
        size="md"
      >
        {selectedInstructor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Revenue Share</p>
                <p className="text-xl font-bold text-navy">{selectedInstructor.revenueShare}%</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Courses</p>
                <p className="text-xl font-bold text-navy">{selectedInstructor.coursesCount}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-grey-medium">Total Earnings</p>
                <p className="text-xl font-bold text-green">{formatCurrency(selectedInstructor.totalEarnings)}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-grey-medium">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(selectedInstructor.pendingEarnings)}</p>
              </div>
            </div>
            <div className="p-3 bg-grey-light/50 rounded-lg">
              <p className="text-xs text-grey-medium">Email</p>
              <p className="font-medium">{selectedInstructor.email}</p>
            </div>
            <Button variant="primary" fullWidth onClick={() => {
              setShowDetail(false);
              window.location.href = `/admin/payouts?instructorId=${selectedInstructor.id}`;
            }}>
              View All Payouts
            </Button>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}