'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FileText, Users, TrendingUp, Plus, Eye, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { formatRelativeTime } from '@/utils/formatters';

export default function CorporateDashboardPage() {
  const [stats, setStats] = useState({
    activePostings: 5,
    totalApplications: 47,
    activeContracts: 3,
    totalSpent: 3500000,
    viewsThisMonth: 1200,
  });

  const [recentApplications, setRecentApplications] = useState([
    {
      id: '1',
      applicantName: 'John Phiri',
      position: 'Graduate Trainee - Finance',
      appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'pending',
      matchScore: 85,
    },
    {
      id: '2',
      applicantName: 'Mary Banda',
      position: 'IT Intern',
      appliedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'reviewed',
      matchScore: 92,
    },
    {
      id: '3',
      applicantName: 'Peter Kamanga',
      position: 'Marketing Assistant',
      appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'shortlisted',
      matchScore: 78,
    },
    {
      id: '4',
      applicantName: 'Grace Mwale',
      position: 'Data Analyst',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'pending',
      matchScore: 90,
    },
  ]);

  return (
    <div className="space-y-6">
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
                <p className="text-2xl font-bold text-navy">{stats.activePostings}</p>
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
                <p className="text-2xl font-bold text-navy">{stats.totalApplications}</p>
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
                <p className="text-2xl font-bold text-navy">{stats.activeContracts}</p>
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
                <p className="text-2xl font-bold text-navy">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button variant="primary" leftIcon={<Plus size={18} />}>
          Post New Job
        </Button>
        <Button variant="outline" leftIcon={<FileText size={18} />}>
          Create Training Package
        </Button>
      </div>

      {/* Active Job Postings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Job Postings</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: 'Graduate Trainee - Finance',
                applications: 12,
                views: 245,
                posted: '2 weeks ago',
                deadline: '30 June 2026',
                status: 'active',
                price: 50000,
              },
              {
                title: 'IT Intern',
                applications: 8,
                views: 180,
                posted: '1 week ago',
                deadline: '15 July 2026',
                status: 'active',
                price: 50000,
              },
              {
                title: 'Marketing Assistant',
                applications: 5,
                views: 120,
                posted: '3 days ago',
                deadline: '20 July 2026',
                status: 'active',
                price: 75000,
              },
            ].map((job, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-navy">{job.title}</h3>
                    <Badge variant="success" size="sm">{job.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-grey-medium">
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {job.applications} applications
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {job.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Posted {job.posted}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-grey-medium">Deadline</p>
                  <p className="font-medium text-navy">{job.deadline}</p>
                  <Badge variant="neutral" size="sm" className="mt-1">
                    {formatCurrency(job.price)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Applications</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentApplications.map((app) => (
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
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-navy">{app.matchScore}%</span>
                      <span className="text-xs text-grey-medium">match</span>
                    </div>
                    <div className="w-20 h-1.5 bg-grey-light rounded-full mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          app.matchScore >= 80 ? 'bg-green' : app.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red'
                        }`}
                        style={{ width: `${app.matchScore}%` }}
                      />
                    </div>
                  </div>
                  <Badge
                    variant={
                      app.status === 'shortlisted' ? 'success' :
                      app.status === 'reviewed' ? 'info' : 'warning'
                    }
                  >
                    {app.status}
                  </Badge>
                  <span className="text-xs text-grey-medium">
                    {formatRelativeTime(app.appliedAt)}
                  </span>
                  <Button variant="ghost" size="sm">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Contracts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Training Contracts</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: 'Excel Advanced Training',
                employees: 25,
                startDate: '1 July 2026',
                endDate: '31 July 2026',
                status: 'active',
                amount: 750000,
              },
              {
                title: 'Leadership Development Program',
                employees: 15,
                startDate: '15 July 2026',
                endDate: '15 September 2026',
                status: 'active',
                amount: 1500000,
              },
            ].map((contract, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-navy">{contract.title}</h3>
                  <p className="text-sm text-grey-medium">
                    {contract.employees} employees • {contract.startDate} - {contract.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green">{formatCurrency(contract.amount)}</p>
                  <Badge variant="success" size="sm">{contract.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}