'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FileText, Users, TrendingUp, Plus, Eye, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

interface DashboardData {
  companyName: string;
  industry: string;
  isVerified: boolean;
  stats: {
    activePostings: number;
    totalApplications: number;
    activeContracts: number;
    totalSpent: number;
  };
  recentPostings: Array<{
    id: string;
    title: string;
    status: string;
    applications: number;
    createdAt: string;
  }>;
  recentApplications: Array<{
    id: string;
    applicantName: string;
    position: string;
    appliedAt: string;
    status: string;
  }>;
  recentContracts: Array<{
    id: string;
    title: string;
    employees: number;
    startDate: string;
    endDate: string;
    status: string;
    amount: number;
    courses: any[];
  }>;
}

export default function CorporateDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/corporate/dashboard');
      const result = await response.json();
      if (response.ok && result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-grey-light/50 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-grey-light/50 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Welcome, {data.companyName}
          </h1>
          <p className="text-grey-dark mt-1">
            {data.industry} {data.isVerified && '• Verified Client'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Active Postings</p>
                <p className="text-2xl font-bold text-navy">{data.stats.activePostings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="text-green" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Applications</p>
                <p className="text-2xl font-bold text-navy">{data.stats.totalApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Active Contracts</p>
                <p className="text-2xl font-bold text-navy">{data.stats.activeContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Investment</p>
                <p className="text-2xl font-bold text-navy">{formatCurrency(data.stats.totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/corporate/recruitment">
          <Button variant="primary" leftIcon={<Plus size={18} />}>
            Post New Job
          </Button>
        </Link>
        <Link href="/corporate/training">
          <Button variant="outline" leftIcon={<FileText size={18} />}>
            Create Training Package
          </Button>
        </Link>
      </div>

      {/* Active Job Postings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Job Postings</CardTitle>
            <Link href="/corporate/recruitment">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentPostings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-grey-medium">No job postings yet</p>
              <Link href="/corporate/recruitment">
                <Button variant="primary" size="sm" className="mt-3">Create your first posting</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentPostings.map((posting) => (
                <div key={posting.id} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-navy">{posting.title}</h3>
                      <Badge variant={posting.status === 'active' ? 'success' : 'warning'} size="sm">
                        {posting.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-grey-medium">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {posting.applications} applications
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> Posted {formatRelativeTime(new Date(posting.createdAt))}
                      </span>
                    </div>
                  </div>
                  <Link href={`/corporate/recruitment?postingId=${posting.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Applications</CardTitle>
            <Link href="/corporate/recruitment">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-grey-medium">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                      <span className="font-medium text-navy">
                        {app.applicantName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy">{app.applicantName}</h3>
                      <p className="text-sm text-grey-medium">{app.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        app.status === 'shortlisted' ? 'success' :
                        app.status === 'reviewed' ? 'info' : 'warning'
                      }
                    >
                      {app.status}
                    </Badge>
                    <span className="text-xs text-grey-medium">
                      {formatRelativeTime(new Date(app.appliedAt))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Contracts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training Contracts</CardTitle>
            <Link href="/corporate/training">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentContracts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-grey-medium">No training contracts yet</p>
              <Link href="/corporate/training">
                <Button variant="primary" size="sm" className="mt-3">Create your first package</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentContracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-navy">{contract.title}</h3>
                    <p className="text-sm text-grey-medium">
                      {contract.employees} employees • {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green">{formatCurrency(contract.amount)}</p>
                    <Badge variant={contract.status === 'active' ? 'success' : 'warning'} size="sm">
                      {contract.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
