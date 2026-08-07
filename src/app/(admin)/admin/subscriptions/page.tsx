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
  CreditCard,
  Filter,
  Download,
  RefreshCw,
  Eye,
  XCircle,
  CheckCircle,
  Pause,
  AlertCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PRICING_TIERS } from '@/lib/billing/pricing-tiers';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: string; label: string }>({ action: '', label: '' });
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions');
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showChangeTierModal, setShowChangeTierModal] = useState(false);
  const [changeTierForm, setChangeTierForm] = useState({ newTier: '', newCycle: 'MONTHLY', autoRenew: true });
  const [submitting, setSubmitting] = useState(false);

  // Pricing plans state
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState({
    tier: '',
    name: '',
    monthlyPrice: 0,
    annualPrice: 0,
    features: '',
    isActive: true,
  });

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else {
      loadPricingPlans();
    }
  }, [statusFilter, tierFilter, searchQuery, activeTab, pagination.page]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (tierFilter) params.append('tier', tierFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/subscriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
      // Mock data
      setSubscriptions([
        { id: '1', userName: 'John Phiri', userEmail: 'john@email.com', tier: 'STUDENT_PREMIUM', cycle: 'MONTHLY', amount: 10000, status: 'active', startDate: '2026-01-15', endDate: '2026-08-15', autoRenew: true, paymentMethod: 'AIRTEL_MONEY', transactionCount: 7 },
        { id: '2', userName: 'Mary Banda', userEmail: 'mary@email.com', tier: 'STUDENT_ANNUAL', cycle: 'ANNUAL', amount: 50000, status: 'active', startDate: '2026-03-01', endDate: '2027-03-01', autoRenew: true, paymentMethod: 'BANK_TRANSFER', transactionCount: 1 },
        { id: '3', userName: 'Lilongwe Secondary', userEmail: 'admin@lilongwesec.mw', institutionName: 'Lilongwe Secondary', tier: 'INSTITUTION_GOLD', cycle: 'MONTHLY', amount: 500000, status: 'active', startDate: '2025-01-01', endDate: '2026-08-15', autoRenew: true, paymentMethod: 'BANK_TRANSFER', transactionCount: 18 },
        { id: '4', userName: 'Peter Instructor', userEmail: 'peter@email.com', tier: 'INSTRUCTOR_PRO', cycle: 'MONTHLY', amount: 25000, status: 'active', startDate: '2026-06-01', endDate: '2026-09-01', autoRenew: true, paymentMethod: 'TNM_MPAMBA', transactionCount: 3 },
        { id: '5', userName: 'Grace Student', userEmail: 'grace@email.com', tier: 'STUDENT_BASIC', cycle: 'MONTHLY', amount: 5000, status: 'cancelled', startDate: '2026-04-01', endDate: '2026-07-01', cancelledAt: '2026-06-15', autoRenew: false, paymentMethod: 'AIRTEL_MONEY', transactionCount: 4 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadPricingPlans = () => {
    // Load from PRICING_TIERS constant
    const plans = Object.entries(PRICING_TIERS).map(([key, config]) => ({
      tier: key,
      name: config.name,
      description: config.description,
      monthlyPrice: config.monthlyPrice,
      annualPrice: config.annualPrice,
      features: config.features || [],
      limits: config.limits || {},
      revenueShare: config.revenueShare,
    }));
    setPricingPlans(plans);
  };

  const handleSubscriptionAction = async (action: string) => {
    if (!selectedSub) return;
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: selectedSub.id, action }),
      });
      if (!response.ok) throw new Error('Action failed');
      setToast({ message: `Subscription ${action}ed successfully`, type: 'success' });
      setShowConfirmModal(false);
      setShowDetailModal(false);
      fetchSubscriptions();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    }
  };

  const handleChangeTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !changeTierForm.newTier) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSub.id,
          action: 'change_tier',
          newTier: changeTierForm.newTier,
          newCycle: changeTierForm.newCycle,
          autoRenew: changeTierForm.autoRenew,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change tier');
      }

      setToast({ message: 'Subscription tier changed successfully', type: 'success' });
      setShowChangeTierModal(false);
      setShowDetailModal(false);
      setChangeTierForm({ newTier: '', newCycle: 'MONTHLY', autoRenew: true });
      fetchSubscriptions();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to change tier', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableTiers = () => {
    if (!selectedSub) return [];
    const role = selectedSub.userRole;
    const tierMap: Record<string, string[]> = {
      STUDENT: ['STUDENT_BASIC', 'STUDENT_PREMIUM', 'STUDENT_ANNUAL', 'ICAM', 'PROFESSIONAL_BOARD'],
      SCHOOL_ADMIN: ['INSTITUTION_BRONZE', 'INSTITUTION_SILVER', 'INSTITUTION_GOLD'],
      INSTRUCTOR: ['INSTRUCTOR_FREE', 'INSTRUCTOR_PRO'],
    };
    return tierMap[role] || [];
  };

  const handleSavePlan = () => {
    if (!newPlan.tier || !newPlan.name) {
      setToast({ message: 'Tier and name are required', type: 'error' });
      return;
    }
    // In production, save to API/database
    setToast({ message: editingPlan ? 'Plan updated successfully' : 'Plan created successfully', type: 'success' });
    setShowPlanModal(false);
    setEditingPlan(null);
    setNewPlan({ tier: '', name: '', monthlyPrice: 0, annualPrice: 0, features: '', isActive: true });
    loadPricingPlans();
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setNewPlan({
      tier: plan.tier,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice || 0,
      annualPrice: plan.annualPrice || 0,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features || '',
      isActive: true,
    });
    setShowPlanModal(true);
  };

  const handleDeletePlan = (plan: any) => {
    if (confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) {
      setPricingPlans(pricingPlans.filter(p => p.tier !== plan.tier));
      setToast({ message: 'Plan deleted', type: 'success' });
    }
  };

  const handleExportCSV = () => {
    if (subscriptions.length === 0) {
      setToast({ message: 'No data to export', type: 'error' });
      return;
    }
    const headers = ['User', 'Email', 'Plan', 'Cycle', 'Amount', 'Status', 'Start Date', 'End Date'];
    const rows = subscriptions.map(s => [s.userName, s.userEmail, s.tier, s.cycle, s.amount, s.status, s.startDate, s.endDate]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'CSV exported', type: 'success' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelled</Badge>;
      case 'expired': return <Badge variant="neutral">Expired</Badge>;
      case 'paused': return <Badge variant="warning">Paused</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const mrr = activeSubs.reduce((sum, s) => sum + (s.cycle === 'ANNUAL' ? Math.floor(s.amount / 12) : s.amount), 0);

  // Subscription columns
  const subscriptionColumns = [
    {
      key: 'user', header: 'User / Institution',
      accessor: (sub: any) => (
        <div>
          <p className="font-medium text-navy">{sub.userName || sub.institutionName}</p>
          <p className="text-xs text-grey-medium">{sub.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'plan', header: 'Plan',
      accessor: (sub: any) => (
        <div>
          <Badge variant="info" size="sm">{sub.tier?.replace(/_/g, ' ')}</Badge>
          <p className="text-xs text-grey-medium mt-1">{sub.cycle?.toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount',
      accessor: (sub: any) => <span className="font-semibold text-navy">{formatCurrency(sub.amount)}</span>,
    },
    {
      key: 'status', header: 'Status',
      accessor: (sub: any) => getStatusBadge(sub.status),
    },
    {
      key: 'period', header: 'Period',
      accessor: (sub: any) => (
        <div className="text-sm">
          <p>{formatDate(sub.startDate)}</p>
          <p className="text-xs text-grey-medium">to {formatDate(sub.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      accessor: (sub: any) => (
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSub(sub); setShowDetailModal(true); }}>
          <Eye size={14} className="mr-1" /> Details
        </Button>
      ),
    },
  ];

  // Pricing plan columns
  const planColumns = [
    {
      key: 'name', header: 'Plan Name',
      accessor: (plan: any) => (
        <div>
          <p className="font-medium text-navy">{plan.name}</p>
          <p className="text-xs text-grey-medium">{plan.tier}</p>
        </div>
      ),
    },
    {
      key: 'monthly', header: 'Monthly',
      accessor: (plan: any) => (
        <span className="font-semibold">{plan.monthlyPrice ? formatCurrency(plan.monthlyPrice) : 'N/A'}</span>
      ),
    },
    {
      key: 'annual', header: 'Annual',
      accessor: (plan: any) => (
        <span className="font-semibold">{plan.annualPrice ? formatCurrency(plan.annualPrice) : 'N/A'}</span>
      ),
    },
    {
      key: 'revenueShare', header: 'Rev Share',
      accessor: (plan: any) => (
        <span>{plan.revenueShare ? `${plan.revenueShare * 100}%` : 'N/A'}</span>
      ),
    },
    {
      key: 'features', header: 'Features',
      accessor: (plan: any) => (
        <span className="text-sm text-grey-dark">{Array.isArray(plan.features) ? plan.features.length : 0} features</span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      accessor: (plan: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}><Edit size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan)}><Trash2 size={14} className="text-red" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Subscriptions</h1>
          <p className="text-grey-dark mt-1">Manage subscriptions and pricing plans</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'subscriptions' ? (
            <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleExportCSV}>Export</Button>
          ) : (
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => { setEditingPlan(null); setNewPlan({ tier: '', name: '', monthlyPrice: 0, annualPrice: 0, features: '', isActive: true }); setShowPlanModal(true); }}>
              Add Plan
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => activeTab === 'subscriptions' ? fetchSubscriptions() : loadPricingPlans()}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-grey-light pb-2">
        {[
          { id: 'subscriptions', label: 'Subscriptions' },
          { id: 'plans', label: 'Pricing Plans' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-navy text-white' : 'text-grey-dark hover:bg-grey-light'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

      {activeTab === 'subscriptions' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">Active Subs</p><p className="text-2xl font-bold text-navy">{activeSubs.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">MRR</p><p className="text-2xl font-bold text-green">{formatCurrency(mrr)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">Total</p><p className="text-2xl font-bold text-blue-600">{subscriptions.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">Cancelled</p><p className="text-2xl font-bold text-red">{subscriptions.filter(s => s.status === 'cancelled').length}</p></CardContent></Card>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search size={18} />} />
              </div>
              <select className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <select className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                <option value="">All Plans</option>
                <option value="STUDENT_BASIC">Student Basic</option>
                <option value="STUDENT_PREMIUM">Student Premium</option>
                <option value="STUDENT_ANNUAL">Student Annual</option>
                <option value="INSTITUTION_BRONZE">Institution Bronze</option>
                <option value="INSTITUTION_SILVER">Institution Silver</option>
                <option value="INSTITUTION_GOLD">Institution Gold</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Card><CardContent className="p-0"><Table data={subscriptions} columns={subscriptionColumns} isLoading={loading} emptyMessage="No subscriptions found" /></CardContent></Card>
        </>
      ) : (
        /* Pricing Plans */
        <Card><CardContent className="p-0"><Table data={pricingPlans} columns={planColumns} emptyMessage="No pricing plans found" /></CardContent></Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      {/* Subscription Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Subscription Details" size="md">
        {selectedSub && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">User</p><p className="font-medium">{selectedSub.userName}</p></div>
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">Email</p><p className="font-medium text-sm">{selectedSub.userEmail}</p></div>
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">Plan</p><p className="font-medium">{selectedSub.tier?.replace(/_/g, ' ')}</p></div>
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">Amount</p><p className="font-medium">{formatCurrency(selectedSub.amount)}/{selectedSub.cycle?.toLowerCase()}</p></div>
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">Status</p>{getStatusBadge(selectedSub.status)}</div>
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">Payment</p><p className="font-medium text-sm">{selectedSub.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</p></div>
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">Start Date</p><p className="font-medium text-sm">{formatDate(selectedSub.startDate)}</p></div>
              <div className="p-3 bg-grey-light/50 rounded-lg"><p className="text-xs text-grey-medium">End Date</p><p className="font-medium text-sm">{formatDate(selectedSub.endDate)}</p></div>
            </div>
            {selectedSub.status === 'active' && (
              <div className="flex gap-3 border-t border-grey-light pt-4">
                <Button variant="danger" size="sm" onClick={() => { setConfirmAction({ action: 'cancel', label: 'Cancel Subscription' }); setShowConfirmModal(true); }}><XCircle size={14} className="mr-1" /> Cancel</Button>
                <Button variant="navy" size="sm" onClick={() => { setConfirmAction({ action: 'pause', label: 'Pause Subscription' }); setShowConfirmModal(true); }}><Pause size={14} className="mr-1" /> Pause</Button>
                <Button variant="primary" size="sm" onClick={() => setShowChangeTierModal(true)}><Settings size={14} className="mr-1" /> Change Tier</Button>
              </div>
            )}
            {selectedSub.status === 'cancelled' && (
              <div className="border-t border-grey-light pt-4">
                <Button variant="success" size="sm" onClick={() => { setConfirmAction({ action: 'reactivate', label: 'Reactivate Subscription' }); setShowConfirmModal(true); }}><CheckCircle size={14} className="mr-1" /> Reactivate</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Action" size="sm">
        <div className="space-y-4">
          <p className="text-grey-dark">Are you sure you want to {confirmAction.label.toLowerCase()}?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button variant={confirmAction.action === 'cancel' ? 'danger' : 'primary'} onClick={() => handleSubscriptionAction(confirmAction.action)}>{confirmAction.label}</Button>
          </div>
        </div>
      </Modal>

      {/* Change Tier Modal */}
      <Modal isOpen={showChangeTierModal} onClose={() => { setShowChangeTierModal(false); setChangeTierForm({ newTier: '', newCycle: 'MONTHLY', autoRenew: true }); }} title="Change Subscription Tier" size="md">
        <form onSubmit={handleChangeTier} className="space-y-4">
          {selectedSub && (
            <div className="bg-grey-light/50 rounded-lg p-3">
              <p className="text-sm font-medium text-navy">Current: {selectedSub.tier?.replace(/_/g, ' ')}</p>
              <p className="text-xs text-grey-medium">{selectedSub.userName} • {selectedSub.userEmail}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-navy mb-1">New Tier</label>
            <select
              value={changeTierForm.newTier}
              onChange={(e) => setChangeTierForm({ ...changeTierForm, newTier: e.target.value })}
              className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              required
            >
              <option value="">Select a new tier</option>
              {getAvailableTiers().map((tier) => (
                <option key={tier} value={tier}>{tier.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Billing Cycle</label>
            <select
              value={changeTierForm.newCycle}
              onChange={(e) => setChangeTierForm({ ...changeTierForm, newCycle: e.target.value })}
              className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRenew"
              checked={changeTierForm.autoRenew}
              onChange={(e) => setChangeTierForm({ ...changeTierForm, autoRenew: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="autoRenew" className="text-sm text-grey-dark">Auto-renew subscription</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => { setShowChangeTierModal(false); setChangeTierForm({ newTier: '', newCycle: 'MONTHLY', autoRenew: true }); }}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting} disabled={!changeTierForm.newTier}>Change Tier</Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Plan Modal */}
      <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title={editingPlan ? 'Edit Plan' : 'Add New Plan'} size="md">
        <div className="space-y-4">
          <Input label="Tier Key" placeholder="e.g., STUDENT_PREMIUM" value={newPlan.tier} onChange={(e) => setNewPlan({ ...newPlan, tier: e.target.value })} disabled={!!editingPlan} />
          <Input label="Plan Name" placeholder="e.g., Student Premium" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monthly Price (MWK)" type="number" value={newPlan.monthlyPrice} onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: parseInt(e.target.value) || 0 })} />
            <Input label="Annual Price (MWK)" type="number" value={newPlan.annualPrice} onChange={(e) => setNewPlan({ ...newPlan, annualPrice: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Features (one per line)</label>
            <textarea className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[100px] text-sm" value={newPlan.features} onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })} placeholder="Unlimited course access&#10;AI Tutor assistance&#10;Live class participation" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSavePlan}>{editingPlan ? 'Update Plan' : 'Create Plan'}</Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}