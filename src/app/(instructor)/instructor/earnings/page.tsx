'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { DollarSign, TrendingUp, Calendar, Download, Send, CheckCircle, Clock, XCircle, Smartphone, Building2, AlertCircle, Check } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PayoutRequestModal } from '@/components/features/payment/payout-request-modal';

interface Summary {
  totalEarnings: number;
  pendingEarnings: number;
  totalPaidOut: number;
  revenueShare: number;
}

interface Transaction {
  id: string;
  courseTitle: string;
  yourEarnings: number;
  platformFee: number;
  date: string;
}

interface Payout {
  id: string;
  amount: number;
  period: string;
  status: string;
  paidAt?: string;
}

interface EarningsData {
  summary: Summary;
  payouts: Payout[];
  recentTransactions: Transaction[];
  monthlyEarnings: Array<{ period: string; label: string; amount: number }>;
}

export default function InstructorEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/instructor/earnings');
        if (!res.ok) throw new Error('Failed to fetch earnings');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load earnings');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePayoutRequest = async (payoutData: {
    amount: number;
    method: string;
    accountDetails: any;
  }) => {
    const res = await fetch('/api/instructor/earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payoutData),
    });

    if (!res.ok) {
      const result = await res.json().catch(() => ({ error: 'Failed to request payout' }));
      throw new Error(result.error || 'Failed to request payout');
    }

    const result = await res.json();
    if (result.success) {
      // Refresh data
      const refreshRes = await fetch('/api/instructor/earnings');
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setData(refreshData.data);
      }
    } else {
      throw new Error(result.error || 'Failed to request payout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey-dark">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">Error</h2>
        <p className="text-grey-dark">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">No Data</h2>
        <p className="text-grey-dark">No earnings data available.</p>
      </div>
    );
  }

  const { summary: s, payouts, recentTransactions, monthlyEarnings } = data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <CheckCircle size={16} className="text-green" />;
      case 'pending':
      case 'processing':
        return <Clock size={16} className="text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle size={16} className="text-red" />;
      default:
        return <Clock size={16} className="text-grey-medium" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Earnings</h1>
          <p className="text-sm text-grey-medium">Track your earnings and request payouts</p>
        </div>
        <Button variant="primary" leftIcon={<Send size={18} />} onClick={() => setShowPayoutModal(true)}>
          Request Payout
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="text-green" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-navy">{formatCurrency(s.totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Pending Earnings</p>
                <p className="text-2xl font-bold text-navy">{formatCurrency(s.pendingEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Paid Out</p>
                <p className="text-2xl font-bold text-navy">{formatCurrency(s.totalPaidOut)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Revenue Share</p>
                <p className="text-2xl font-bold text-navy">{Math.round(s.revenueShare * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Earnings (Last 12 Months)</CardTitle>
          <CardDescription>Your instructor payout per month</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyEarnings && monthlyEarnings.length > 0 ? (
            <div className="space-y-3">
              {monthlyEarnings.map((m) => (
                <div key={m.period} className="flex items-center gap-3">
                  <span className="text-xs text-grey-medium w-12">{m.label}</span>
                  <div className="flex-1 bg-grey-light rounded-lg h-6 relative">
                    <div
                      className="bg-navy h-full rounded-lg"
                      style={{ width: `${(m.amount / Math.max(...monthlyEarnings.map((e) => e.amount), 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-grey-dark w-24 text-right">{formatCurrency(m.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-grey-medium">No earnings data for the past 12 months.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest course sales</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-navy">{t.courseTitle || 'Unknown Course'}</h4>
                    <p className="text-xs text-grey-medium">Transaction: {t.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green">{formatCurrency(t.yourEarnings)}</p>
                    <p className="text-xs text-grey-medium">
                      Platform fee: {formatCurrency(t.platformFee || 0)}
                    </p>
                    <p className="text-xs text-grey-medium">{formatDate(t.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-grey-medium">No recent transactions.</p>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your recent payout requests</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts && payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(p.status)}
                    <div>
                      <h4 className="font-semibold text-navy">{formatCurrency(p.amount)}</h4>
                      <p className="text-xs text-grey-medium">Period: {p.period}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.status === 'paid' || p.status === 'completed' ? 'success' : p.status === 'pending' || p.status === 'processing' ? 'warning' : 'error'} size="sm">
                      {p.status}
                    </Badge>
                    {p.paidAt && (
                      <p className="text-xs text-grey-medium mt-1">Paid: {formatDate(p.paidAt)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-grey-medium">No payout requests yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Modal */}
      <PayoutRequestModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        onSubmit={handlePayoutRequest}
        pendingEarnings={s.pendingEarnings}
        minPayout={10000}
      />
    </div>
  );
}
