'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  GraduationCap,
  Building2,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  Search,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, boolean>>({});
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    fetchPendingPayments();
  }, [timeframe]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const response = await fetch('/api/admin/payments');
      if (!response.ok) throw new Error('Failed to fetch pending payments');
      const data = await response.json();
      setPendingPayments(data.data || []);
    } catch (err: any) {
      setPaymentsError(err.message);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleVerifyPayment = async (transactionId: string, reference: string) => {
    setVerifyingId(transactionId);
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, reference }),
      });
      const data = await response.json();
      if (data.success) {
        setVerifyResults(prev => ({ ...prev, [transactionId]: data.data.verified }));
        fetchPendingPayments();
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((t) => (
            <Button
              key={t}
              variant={timeframe === t ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeframe(t)}
            >
              {t === '7d' ? 'Week' : t === '30d' ? 'Month' : t === '90d' ? 'Quarter' : 'Year'}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={16} />} onClick={fetchMetrics}>
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-grey-medium">MRR</p>
              <DollarSign size={20} className="text-green" />
            </div>
            <p className="text-2xl font-bold text-navy">
              {formatCurrency(metrics?.revenue?.mrr || 0)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={14} className="text-green" />
              <span className="text-sm text-green">+12.5%</span>
              <span className="text-xs text-grey-medium">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-grey-medium">Active Users</p>
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-navy">
              {metrics?.users?.active?.toLocaleString() || 0}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={14} className="text-green" />
              <span className="text-sm text-green">+8.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-grey-medium">ARPU</p>
              <Activity size={20} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-navy">
              {formatCurrency(metrics?.revenue?.arpu || 0)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={14} className="text-green" />
              <span className="text-sm text-green">+3.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-grey-medium">Churn Rate</p>
              <AlertTriangle size={20} className="text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-navy">
              {(metrics?.users?.churnRate || 0).toFixed(1)}%
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown size={14} className="text-green" />
              <span className="text-sm text-green">-0.5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} className="text-yellow-600" />
            Pending Payments
            {pendingPayments.length > 0 && (
              <Badge variant="warning">{pendingPayments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paymentsError ? (
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-grey-dark">Failed to load pending payments</p>
              <Button variant="ghost" size="sm" onClick={fetchPendingPayments}>Retry</Button>
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={32} className="mx-auto text-green mb-2" />
              <p className="text-sm text-grey-medium">No pending payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-grey-light/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {payment.user?.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs text-grey-medium">
                        {payment.course?.title || 'N/A'} • MWK {payment.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-grey-medium font-mono">{payment.reference}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" size="sm">{payment.status}</Badge>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleVerifyPayment(payment.id, payment.reference)}
                      disabled={verifyingId === payment.id}
                    >
                      {verifyingId === payment.id ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.revenue?.breakdown?.byCategory && 
                Object.entries(metrics.revenue.breakdown.byCategory).map(([category, amount]: [string, any]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-navy" />
                      <span className="text-sm text-grey-dark capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <span className="font-semibold text-navy">{formatCurrency(amount)}</span>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.revenue?.breakdown?.byTier?.map((tier: any) => (
                <div key={tier.tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-grey-dark">{tier.tier.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-navy">{tier._count}</span>
                  </div>
                  <div className="w-full bg-grey-light rounded-full h-2">
                    <div
                      className="bg-navy rounded-full h-2"
                      style={{ width: `${(tier._count / metrics.users.active) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'New subscription', user: 'John Doe', plan: 'Student Premium', time: '5 min ago', type: 'success' },
              { action: 'Course purchase', user: 'Jane Smith', plan: 'Mathematics MSCE', time: '12 min ago', type: 'info' },
              { action: 'Institution renewal', user: 'Lilongwe Secondary', plan: 'Gold Tier', time: '1 hour ago', type: 'warning' },
              { action: 'Payment failed', user: 'Bob Wilson', plan: 'Student Basic', time: '2 hours ago', type: 'error' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-grey-light last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green' :
                    activity.type === 'error' ? 'bg-red' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-600'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-grey-dark">{activity.action}</p>
                    <p className="text-xs text-grey-medium">{activity.user} • {activity.plan}</p>
                  </div>
                </div>
                <span className="text-xs text-grey-medium">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}