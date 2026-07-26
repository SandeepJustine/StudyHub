'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Table } from '@/components/ui/table';
import { Plus, Megaphone, Eye, MousePointer, Calendar, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function AdminSponsorshipsPage() {
  const [showNewSponsorship, setShowNewSponsorship] = useState(false);
  const [sponsorships, setSponsorships] = useState([
    {
      id: '1',
      sponsor: 'National Bank',
      type: 'BANNER',
      placement: 'HOMEPAGE',
      startDate: '2026-07-01',
      endDate: '2026-08-01',
      price: 500000,
      impressions: 15000,
      clicks: 450,
      status: 'active',
    },
    {
      id: '2',
      sponsor: 'Airtel Malawi',
      type: 'FEATURED_LISTING',
      placement: 'COURSE_PAGE',
      startDate: '2026-07-15',
      endDate: '2026-09-15',
      price: 350000,
      impressions: 8000,
      clicks: 320,
      status: 'active',
    },
    {
      id: '3',
      sponsor: 'UNICEF Malawi',
      type: 'WEBINAR',
      placement: 'HOMEPAGE',
      startDate: '2026-08-01',
      endDate: '2026-08-30',
      price: 750000,
      impressions: 0,
      clicks: 0,
      status: 'scheduled',
    },
  ]);

  const columns = [
    {
      key: 'sponsor',
      header: 'Sponsor',
      accessor: (s: any) => (
        <div>
          <p className="font-medium text-navy">{s.sponsor}</p>
          <p className="text-xs text-grey-medium">{s.type.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'placement',
      header: 'Placement',
      accessor: (s: any) => (
        <Badge variant="info">{s.placement.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      accessor: (s: any) => (
        <div className="text-sm">
          <p>{new Date(s.startDate).toLocaleDateString()}</p>
          <p className="text-xs text-grey-medium">to {new Date(s.endDate).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'performance',
      header: 'Performance',
      accessor: (s: any) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Eye size={12} className="text-grey-medium" />
            <span>{s.impressions.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-2">
            <MousePointer size={12} className="text-grey-medium" />
            <span>{s.clicks.toLocaleString()} clicks</span>
          </div>
          <p className="text-xs text-grey-medium">
            CTR: {s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(2) : 0}%
          </p>
        </div>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      accessor: (s: any) => (
        <span className="font-semibold text-green">{formatCurrency(s.price)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (s: any) => (
        <Badge variant={s.status === 'active' ? 'success' : s.status === 'scheduled' ? 'warning' : 'neutral'}>
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (s: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm"><Edit size={14} /></Button>
          <Button variant="ghost" size="sm"><Trash2 size={14} className="text-red" /></Button>
        </div>
      ),
    },
  ];

  const totalRevenue = sponsorships.reduce((sum, s) => sum + s.price, 0);
  const totalImpressions = sponsorships.reduce((sum, s) => sum + s.impressions, 0);
  const totalClicks = sponsorships.reduce((sum, s) => sum + s.clicks, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Sponsorships</h1>
          <p className="text-grey-dark mt-1">Manage sponsored content and advertisements</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowNewSponsorship(true)}>
          New Sponsorship
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Active Sponsorships</p>
            <p className="text-2xl font-bold text-navy">{sponsorships.filter(s => s.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-green">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Total Impressions</p>
            <p className="text-2xl font-bold text-blue-600">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Avg CTR</p>
            <p className="text-2xl font-bold text-purple-600">
              {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table data={sponsorships} columns={columns} />
        </CardContent>
      </Card>

      <Modal isOpen={showNewSponsorship} onClose={() => setShowNewSponsorship(false)} title="Create Sponsorship" size="lg">
        <div className="space-y-4">
          <Input label="Sponsor Name" placeholder="e.g., National Bank" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Type</label>
              <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg">
                <option value="BANNER">Banner Ad</option>
                <option value="WEBINAR">Sponsored Webinar</option>
                <option value="PROMOTED_COURSE">Promoted Course</option>
                <option value="FEATURED_LISTING">Featured Listing</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Placement</label>
              <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg">
                <option value="HOMEPAGE">Homepage</option>
                <option value="COURSE_PAGE">Course Page</option>
                <option value="SIDEBAR">Sidebar</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" />
            <Input label="End Date" type="date" />
          </div>
          <Input label="Price (MWK)" type="number" placeholder="500000" />
          <Input label="Target URL" placeholder="https://..." />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowNewSponsorship(false)}>Cancel</Button>
            <Button variant="primary">Create Sponsorship</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}