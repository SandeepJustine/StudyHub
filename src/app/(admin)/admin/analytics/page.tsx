'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  GraduationCap,
  Building2,
  CreditCard,
  Activity,
  Download,
  RefreshCw,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedStream, setSelectedStream] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics Dashboard</h1>
          <p className="text-grey-dark mt-1">Platform performance and revenue metrics</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-grey-light rounded-lg p-1">
            {[
              { value: '7d', label: 'Week' },
              { value: '30d', label: 'Month' },
              { value: '90d', label: 'Quarter' },
              { value: '1y', label: 'Year' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeframe(t.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timeframe === t.value ? 'bg-white shadow text-navy' : 'text-grey-dark'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button variant="outline" leftIcon={<Download size={16} />}>
            Export Report
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchAnalytics}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics?.revenue?.mrr || 0)}
          change={12.5}
          positive={true}
          icon={<DollarSign size={20} />}
          iconBg="bg-green-100"
          iconColor="text-green"
        />
        <KPICard
          title="Average Revenue Per User"
          value={formatCurrency(metrics?.revenue?.arpu || 0)}
          change={3.1}
          positive={true}
          icon={<Activity size={20} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          title="Customer Acquisition Cost"
          value={formatCurrency(metrics?.revenue?.cac || 0)}
          change={-5.2}
          positive={true}
          icon={<TrendingDown size={20} />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <KPICard
          title="Lifetime Value"
          value={formatCurrency(metrics?.revenue?.ltv || 0)}
          change={8.3}
          positive={true}
          icon={<TrendingUp size={20} />}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={metrics?.users?.total?.toLocaleString() || '0'}
          change={15.2}
          positive={true}
          icon={<Users size={20} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          title="Active Subscriptions"
          value={metrics?.users?.active?.toLocaleString() || '0'}
          change={8.7}
          positive={true}
          icon={<CreditCard size={20} />}
          iconBg="bg-green-100"
          iconColor="text-green"
        />
        <KPICard
          title="Churn Rate"
          value={`${(metrics?.users?.churnRate || 0).toFixed(1)}%`}
          change={0.5}
          positive={false}
          icon={<TrendingDown size={20} />}
          iconBg="bg-red-100"
          iconColor="text-red"
        />
        <KPICard
          title="NPS Score"
          value={metrics?.satisfaction?.nps?.toFixed(0) || '0'}
          change={5}
          positive={true}
          icon={<Activity size={20} />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue by Stream</CardTitle>
              <select
                className="px-3 py-1 border border-grey-light rounded text-sm"
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
              >
                <option value="all">All Streams</option>
                <option value="student">Student Subs</option>
                <option value="institution">Institution Subs</option>
                <option value="professional">Professional Boards</option>
                <option value="corporate">Corporate</option>
                <option value="courses">Course Sales</option>
                <option value="certificates">Certificates</option>
                <option value="recruitment">Recruitment</option>
                <option value="events">Events</option>
                <option value="marketplace">Marketplace</option>
              </select>
            </div>
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
                    <div className="text-right">
                      <span className="font-semibold text-navy">{formatCurrency(amount)}</span>
                      <p className="text-xs text-grey-medium">
                        {((amount / (metrics?.revenue?.breakdown?.total || 1)) * 100).toFixed(1)}%
                      </p>
                    </div>
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
                    <span className="font-medium text-navy">{tier._count} users</span>
                  </div>
                  <div className="w-full bg-grey-light rounded-full h-2">
                    <div
                      className="bg-navy rounded-full h-2"
                      style={{ width: `${(tier._count / (metrics?.users?.active || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-green">
                {metrics?.courses?.completionRate?.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-1">Total Courses</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.courses?.totalCourses?.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800 mb-1">Total Enrollments</p>
              <p className="text-2xl font-bold text-purple-600">
                {metrics?.courses?.totalEnrollments?.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institution Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Renewal Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-navy mb-3">Upcoming Renewals (30 days)</h4>
              <div className="space-y-3">
                {[
                  { name: 'Lilongwe Secondary', tier: 'Gold', renewalDate: '2026-08-15', amount: 500000 },
                  { name: 'Blantyre Academy', tier: 'Silver', renewalDate: '2026-08-20', amount: 250000 },
                  { name: 'Mzuzu International', tier: 'Bronze', renewalDate: '2026-08-25', amount: 100000 },
                ].map((school, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                    <div>
                      <p className="font-medium text-navy">{school.name}</p>
                      <div className="flex items-center gap-2 text-xs text-grey-medium">
                        <Badge size="sm">{school.tier}</Badge>
                        <Calendar size={12} />
                        {new Date(school.renewalDate).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="font-semibold text-navy">{formatCurrency(school.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-navy mb-3">At-Risk Accounts</h4>
              <div className="space-y-3">
                {[
                  { name: 'Zomba College', reason: 'No activity in 45 days', students: 15 },
                  { name: 'Karonga School', reason: 'Payment method expiring', students: 28 },
                ].map((school, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">{school.name}</p>
                      <p className="text-xs text-red-600">{school.reason}</p>
                    </div>
                    <Badge variant="error">{school.students} students</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ title, value, change, positive, icon, iconBg, iconColor }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-grey-medium">{title}</p>
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        </div>
        <p className="text-2xl font-bold text-navy">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {positive ? (
              <TrendingUp size={14} className="text-green" />
            ) : (
              <TrendingDown size={14} className="text-red" />
            )}
            <span className={`text-sm ${positive ? 'text-green' : 'text-red'}`}>
              {positive ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-grey-medium">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}