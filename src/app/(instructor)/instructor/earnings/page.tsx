import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, Calendar, Download, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { instructorService } from '@/lib/instructor/instructor-service';

export const dynamic = 'force-dynamic';

export default async function InstructorEarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  let summary: any = null;
  let error: string | null = null;

  try {
    const instructor = await instructorService.resolveByUserId(session.user.id);
    summary = await instructorService.getEarningsSummary(instructor.id);
  } catch (e: any) {
    error = e.message || 'Failed to load earnings';
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">Error</h2>
        <p className="text-grey-dark">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">No Data</h2>
        <p className="text-grey-dark">No earnings data available.</p>
      </div>
    );
  }

  const { summary: s, payouts, recentTransactions, monthlyEarnings } = summary;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} className="text-green" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'failed':
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
        <Button variant="primary" leftIcon={<Send size={18} />}>
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
              {monthlyEarnings.map((m: any) => (
                <div key={m.period} className="flex items-center gap-3">
                  <span className="text-xs text-grey-medium w-12">{m.label}</span>
                  <div className="flex-1 bg-grey-light rounded-lg h-6 relative">
                    <div
                      className="bg-navy h-full rounded-lg"
                      style={{ width: `${(m.amount / Math.max(...monthlyEarnings.map((e: any) => e.amount), 1)) * 100}%` }}
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
              {recentTransactions.map((t: any) => (
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
              {payouts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(p.status)}
                    <div>
                      <h4 className="font-semibold text-navy">{formatCurrency(p.amount)}</h4>
                      <p className="text-xs text-grey-medium">Period: {p.period}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'error'} size="sm">
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
    </div>
  );
}
