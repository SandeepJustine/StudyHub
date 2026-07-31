'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Search,
  Download,
  Check,
  X,
  RefreshCw,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdminPayoutsPage() {
  const pathname = usePathname();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [actionType, setActionType] = useState<'process' | 'cancel' | 'mark_paid'>('process');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [payoutMethod, setPayoutMethod] = useState('AIRTEL_MONEY');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutOperatorRefId, setPayoutOperatorRefId] = useState('');
  const [payoutBankUuid, setPayoutBankUuid] = useState('');
  const [payoutBankAccountName, setPayoutBankAccountName] = useState('');
  const [payoutBankAccountNumber, setPayoutBankAccountNumber] = useState('');
  const [stats, setStats] = useState({ 
    pending: 0, 
    completed: 0, 
    total: 0, 
    totalAmount: 0,
    totalCount: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchPayouts();
  }, [searchQuery, statusFilter, pagination.page]);

  const fetchPayouts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/payouts?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch payouts');
      }

      const data = await response.json();

      if (data.success) {
        setPayouts(data.data || []);
        
        // Handle both API response formats
        const apiStats = data.summary || {};
        setStats({
          pending: apiStats.pending || apiStats.byStatus?.pending?.amount || 0,
          completed: apiStats.completed || apiStats.byStatus?.completed?.amount || 0,
          total: apiStats.total || 0,
          totalAmount: apiStats.totalAmount || apiStats.total || 0,
          totalCount: apiStats.totalCount || apiStats.totalPayouts || data.data?.length || 0,
        });
        
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err: any) {
      console.error('Failed to fetch payouts:', err);
      setError(err.message);
      
      // Mock data fallback
      const mockPayouts = [
        { id: '1', instructor: { user: { fullName: 'Prof. Michael', email: 'michael@email.com' } }, amount: 250000, period: '2026-07', status: 'pending', paymentMethod: 'AIRTEL_MONEY', createdAt: new Date() },
        { id: '2', instructor: { user: { fullName: 'Dr. Sarah', email: 'sarah@email.com' } }, amount: 180000, period: '2026-07', status: 'completed', paymentMethod: 'BANK_TRANSFER', createdAt: new Date(), processedAt: new Date() },
        { id: '3', instructor: { user: { fullName: 'John Teacher', email: 'john@email.com' } }, amount: 120000, period: '2026-06', status: 'pending', paymentMethod: 'TNM_MPAMBA', createdAt: new Date() },
      ];
      setPayouts(mockPayouts);
      
      const pendingAmount = mockPayouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
      const completedAmount = mockPayouts.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
      
      setStats({
        pending: pendingAmount,
        completed: completedAmount,
        total: pendingAmount + completedAmount,
        totalAmount: pendingAmount + completedAmount,
        totalCount: mockPayouts.length,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayoutAction = async () => {
    if (!selectedPayout) return;

    try {
      const body: any = {
        action: actionType,
        data: { payoutId: selectedPayout.id },
      };

      if (actionType === 'process') {
        body.data.method = payoutMethod;
        body.data.accountDetails =
          payoutMethod === 'AIRTEL_MONEY' || payoutMethod === 'TNM_MPAMBA'
            ? { phone: payoutPhone, operatorRefId: payoutOperatorRefId }
            : { bankUuid: payoutBankUuid, bankAccountName: payoutBankAccountName, bankAccountNumber: payoutBankAccountNumber };
      }

      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Action failed' }));
        throw new Error(result.error || 'Action failed');
      }

      setToast({ message: `Payout ${actionType.replace(/_/g, ' ')} successful`, type: 'success' });
      setShowActionModal(false);
      fetchPayouts();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'processing': return <Badge variant="info">Processing</Badge>;
      case 'failed': return <Badge variant="error">Failed</Badge>;
      case 'cancelled': return <Badge variant="neutral">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'instructor',
      header: 'Instructor',
      accessor: (payout: any) => (
        <div>
          <p className="font-medium text-navy">
            {payout.instructor?.user?.fullName || payout.instructor?.name || 'Unknown'}
          </p>
          <p className="text-xs text-grey-medium">
            {payout.instructor?.user?.email || payout.instructor?.email || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (payout: any) => (
        <span className="font-semibold text-navy">{formatCurrency(payout.amount)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      accessor: (payout: any) => (
        <Badge variant="neutral" size="sm">
          {payout.paymentMethod?.replace(/_/g, ' ') || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      accessor: (payout: any) => (
        <span className="text-sm">{payout.period || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (payout: any) => getStatusBadge(payout.status),
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (payout: any) => (
        <div className="text-sm">
          <p>{formatDate(payout.createdAt)}</p>
          {payout.processedAt && (
            <p className="text-xs text-grey-medium">Paid: {formatDate(payout.processedAt)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (payout: any) => (
        <div className="flex gap-1">
          {payout.status === 'pending' && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => { setSelectedPayout(payout); setActionType('process'); setShowActionModal(true); }}
              >
                <Check size={14} className="mr-1" /> Pay
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { setSelectedPayout(payout); setActionType('cancel'); setShowActionModal(true); }}
              >
                <X size={14} className="mr-1" /> Cancel
              </Button>
            </>
          )}
          {payout.status === 'processing' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => { setSelectedPayout(payout); setActionType('mark_paid'); setShowActionModal(true); }}
            >
              <Check size={14} className="mr-1" /> Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payout Management</h1>
          <p className="text-grey-dark mt-1">Manage instructor payouts and earnings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download size={16} />}>Export</Button>
          <Button variant="ghost" size="sm" onClick={fetchPayouts}><RefreshCw size={16} /></Button>
        </div>
      </div>


      <div className="flex gap-2 border-b border-grey-light pb-2">
        {[
          { id: 'payouts', label: 'All Payouts', href: '/admin/payouts' },
          { id: 'instructors', label: 'Instructor Earnings', href: '/admin/payouts/instructors' },
          { id: 'settings', label: 'Payout Settings', href: '/admin/payouts/settings' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname === tab.href ? 'bg-navy text-white' : 'text-grey-dark hover:bg-grey-light'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Pending</p>
                <p className="text-xl font-bold text-navy">{formatCurrency(stats.pending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check size={20} className="text-green" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Completed</p>
                <p className="text-xl font-bold text-navy">{formatCurrency(stats.completed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Amount</p>
                <p className="text-xl font-bold text-navy">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Payouts</p>
                <p className="text-xl font-bold text-navy">{stats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={payouts}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No payouts found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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
      )}

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setPayoutMethod('AIRTEL_MONEY');
          setPayoutPhone('');
          setPayoutOperatorRefId('');
          setPayoutBankUuid('');
          setPayoutBankAccountName('');
          setPayoutBankAccountNumber('');
        }}
        title={`${actionType === 'process' ? 'Process' : actionType === 'cancel' ? 'Cancel' : 'Mark as Paid'} Payout`}
        size="md"
      >
        <div className="space-y-4">
          {actionType === 'process' ? (
            <>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-sm text-grey-dark">Instructor: <strong>{selectedPayout?.instructor?.user?.fullName || selectedPayout?.instructor?.name}</strong></p>
                <p className="text-sm text-grey-dark">Amount: <strong>{formatCurrency(selectedPayout?.amount)}</strong></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-grey-dark mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: '📱' },
                    { id: 'TNM_MPAMBA', name: 'TNM Mpamba', icon: '📱' },
                    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: '🏦' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayoutMethod(m.id)}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        payoutMethod === m.id ? 'border-navy bg-navy/5' : 'border-grey-light'
                      }`}
                    >
                      <div className="text-lg mb-1">{m.icon}</div>
                      <p className="text-xs font-medium text-navy">{m.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {payoutMethod === 'AIRTEL_MONEY' || payoutMethod === 'TNM_MPAMBA' ? (
                <>
                  <Input
                    label="Phone Number"
                    placeholder="+265 888 000 000"
                    value={payoutPhone}
                    onChange={(e) => setPayoutPhone(e.target.value)}
                  />
                  <Input
                    label="Mobile Money Operator Ref ID"
                    placeholder="e.g., 20be6c20-adeb-4b5b-a7ba-0769820df4fb"
                    value={payoutOperatorRefId}
                    onChange={(e) => setPayoutOperatorRefId(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Bank UUID"
                    placeholder="Bank UUID from PayChangu"
                    value={payoutBankUuid}
                    onChange={(e) => setPayoutBankUuid(e.target.value)}
                  />
                  <Input
                    label="Account Name"
                    placeholder="John Doe"
                    value={payoutBankAccountName}
                    onChange={(e) => setPayoutBankAccountName(e.target.value)}
                  />
                  <Input
                    label="Account Number"
                    placeholder="2652493369"
                    value={payoutBankAccountNumber}
                    onChange={(e) => setPayoutBankAccountNumber(e.target.value)}
                  />
                </>
              )}
            </>
          ) : (
            <p className="text-grey-dark">
              {actionType === 'cancel'
                ? 'Are you sure you want to cancel this payout?'
                : 'Confirm that this payout has been paid manually?'}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowActionModal(false)}>
              No, Go Back
            </Button>
            {actionType === 'process' && (
              <Button variant="primary" onClick={handlePayoutAction}>
                Process Payout
              </Button>
            )}
            {actionType === 'cancel' && (
              <Button variant="danger" onClick={handlePayoutAction}>
                Cancel Payout
              </Button>
            )}
            {actionType === 'mark_paid' && (
              <Button variant="success" onClick={handlePayoutAction}>
                Mark as Paid
              </Button>
            )}
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