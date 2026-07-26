'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Search, CreditCard, Calendar, TrendingUp, Filter, Download, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, tierFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    // Mock data - in production, fetch from API
    setSubscriptions([
      { id: '1', user: 'John Phiri', email: 'john@email.com', tier: 'STUDENT_PREMIUM', cycle: 'MONTHLY', amount: 10000, status: 'active', startDate: '2026-01-15', endDate: '2026-08-15', autoRenew: true },
      { id: '2', user: 'Mary Banda', email: 'mary@email.com', tier: 'STUDENT_ANNUAL', cycle: 'ANNUAL', amount: 50000, status: 'active', startDate: '2026-03-01', endDate: '2027-03-01', autoRenew: true },
      { id: '3', user: 'Lilongwe Secondary', email: 'admin@lilongwesec.mw', tier: 'INSTITUTION_GOLD', cycle: 'MONTHLY', amount: 500000, status: 'active', startDate: '2025-01-01', endDate: '2026-08-15', autoRenew: true },
      { id: '4', user: 'Peter Instructor', email: 'peter@email.com', tier: 'INSTRUCTOR_PRO', cycle: 'MONTHLY', amount: 25000, status: 'active', startDate: '2026-06-01', endDate: '2026-09-01', autoRenew: true },
      { id: '5', user: 'Grace Student', email: 'grace@email.com', tier: 'STUDENT_BASIC', cycle: 'MONTHLY', amount: 5000, status: 'cancelled', startDate: '2026-04-01', endDate: '2026-07-01', autoRenew: false },
    ]);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelled</Badge>;
      case 'expired': return <Badge variant="neutral">Expired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      accessor: (sub: any) => (
        <div>
          <p className="font-medium text-navy">{sub.user}</p>
          <p className="text-xs text-grey-medium">{sub.email}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      accessor: (sub: any) => (
        <div>
          <p className="text-sm font-medium">{sub.tier.replace(/_/g, ' ')}</p>
          <p className="text-xs text-grey-medium">{sub.cycle.toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (sub: any) => (
        <span className="font-semibold text-navy">{formatCurrency(sub.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (sub: any) => getStatusBadge(sub.status),
    },
    {
      key: 'period',
      header: 'Period',
      accessor: (sub: any) => (
        <div className="text-sm">
          <p>{formatDate(sub.startDate)}</p>
          <p className="text-xs text-grey-medium">to {formatDate(sub.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (sub: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSelectedSub(sub); setShowDetails(true); }}
        >
          Details
        </Button>
      ),
    },
  ];

  // Calculate summary
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const mrr = activeSubs.reduce((sum, s) => sum + (s.cycle === 'ANNUAL' ? Math.floor(s.amount / 12) : s.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Subscriptions</h1>
          <p className="text-grey-dark mt-1">Manage all platform subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download size={16} />}>Export</Button>
          <Button variant="ghost" size="sm" onClick={fetchSubscriptions}><RefreshCw size={16} /></Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Active Subs</p>
            <p className="text-2xl font-bold text-navy">{activeSubs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">MRR</p>
            <p className="text-2xl font-bold text-green">{formatCurrency(mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Churn Rate</p>
            <p className="text-2xl font-bold text-red">2.3%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Renewals (30d)</p>
            <p className="text-2xl font-bold text-blue-600">12</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input placeholder="Search..." leftIcon={<Search size={18} />} />
          </div>
          <select className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          <select className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
            <option value="">All Plans</option>
            <option value="STUDENT">Student Plans</option>
            <option value="INSTITUTION">Institution Plans</option>
            <option value="INSTRUCTOR">Instructor Plans</option>
          </select>
          <Button variant="outline" leftIcon={<Filter size={16} />}>More Filters</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table data={subscriptions} columns={columns} isLoading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}