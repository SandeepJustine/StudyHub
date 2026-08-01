'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import {
  BarChart3, Users, FileText, Briefcase, TrendingUp, Calendar,
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import { formatRelativeTime, formatCurrency } from '@/utils/formatters';

interface AnalyticsData {
  company: {
    name: string;
    industry: string | null;
    isVerified: boolean;
  };
  recruitment: {
    totalPostings: number;
    activePostings: number;
    closedPostings: number;
    draftPostings: number;
    totalApplications: number;
    pendingApplications: number;
    reviewedApplications: number;
    shortlistedApplications: number;
    rejectedApplications: number;
    hiredApplications: number;
    applicationRate: number;
    hireRate: number;
  };
  contracts: {
    totalContracts: number;
    activeContracts: number;
    draftContracts: number;
    totalSpending: number;
  };
  recentApplications: Array<{
    id: string;
    applicantName: string;
    applicantEmail: string;
    postingTitle: string;
    appliedAt: string;
    status: string;
  }>;
  trends: {
    applicationsByDay: Array<{ date: string; count: number }>;
  };
  statusDistribution: Array<{ status: string; count: number }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  hired: 'bg-purple-100 text-purple-800',
};

export default function CorporateAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/corporate/analytics');
      const result = await response.json();
      if (response.ok && result.success) {
        setData(result.data);
      } else {
        setToast({ message: result.error || 'Failed to load analytics', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load analytics', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="h-8 bg-grey-light/50 rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-grey-light/50 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 size={48} className="mx-auto text-grey-medium mb-4" />
        <p className="text-grey-dark">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics</h1>
          <p className="text-grey-dark mt-1">
            {data.company.name} • {data.company.industry || 'Corporate Client'}
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="p-2 text-grey-medium hover:text-navy rounded-lg hover:bg-grey-light/50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Verification Badge */}
      {!data.company.isVerified && (
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-600" />
              <p className="text-yellow-800">
                Your company is not yet verified. Some features may be limited.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grey-medium">Total Postings</p>
                <p className="text-3xl font-bold text-navy">{data.recruitment.totalPostings}</p>
                <p className="text-xs text-grey-medium mt-1">
                  {data.recruitment.activePostings} active, {data.recruitment.draftPostings} draft
                </p>
              </div>
              <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                <Briefcase size={24} className="text-navy" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grey-medium">Total Applications</p>
                <p className="text-3xl font-bold text-navy">{data.recruitment.totalApplications}</p>
                <p className="text-xs text-grey-medium mt-1">
                  {data.recruitment.shortlistedApplications} shortlisted, {data.recruitment.hiredApplications} hired
                </p>
              </div>
              <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-navy" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grey-medium">Hire Rate</p>
                <p className="text-3xl font-bold text-navy">{data.recruitment.hireRate}%</p>
                <p className="text-xs text-grey-medium mt-1">
                  {data.recruitment.hiredApplications} of {data.recruitment.totalApplications} applications
                </p>
              </div>
              <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-navy" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grey-medium">Total Spending</p>
                <p className="text-3xl font-bold text-navy">{formatCurrency(data.contracts.totalSpending)}</p>
                <p className="text-xs text-grey-medium mt-1">
                  {data.contracts.activeContracts} active contracts
                </p>
              </div>
              <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-navy" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Application Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.statusDistribution.map(item => (
              <div key={item.status} className="text-center">
                <div className={`inline-block w-full px-3 py-2 rounded-lg ${statusColors[item.status] || 'bg-grey-100 text-grey-800'}`}>
                  <p className="font-bold text-lg">{item.count}</p>
                  <p className="text-xs capitalize">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-grey-medium mb-2" />
              <p className="text-grey-dark">No recent applications</p>
            </div>
          ) : (
            <div className="divide-y divide-grey-light">
              {data.recentApplications.map(app => (
                <div key={app.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                      <span className="font-medium text-navy">
                        {app.applicantName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{app.applicantName}</p>
                      <p className="text-sm text-grey-medium">{app.postingTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[app.status] ? 'neutral' : 'neutral'} className={statusColors[app.status] || ''}>
                      {app.status}
                    </Badge>
                    <p className="text-xs text-grey-medium mt-1">
                      {formatRelativeTime(new Date(app.appliedAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contracts Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Contracts Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-navy">{data.contracts.totalContracts}</p>
              <p className="text-sm text-grey-medium">Total Contracts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green">{data.contracts.activeContracts}</p>
              <p className="text-sm text-grey-medium">Active Contracts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-navy">{data.contracts.draftContracts}</p>
              <p className="text-sm text-grey-medium">Draft Contracts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
