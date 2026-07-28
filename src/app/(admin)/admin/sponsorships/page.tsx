'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Table } from '@/components/ui/table';
import { Toast } from '@/components/ui/toast';
import {
  Plus,
  Megaphone,
  Eye,
  MousePointer,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Save,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function AdminSponsorshipsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingSponsorship, setEditingSponsorship] = useState<any>(null);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState({
    activeSponsorships: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    totalClicks: 0,
  });
  const [formData, setFormData] = useState({
    sponsor: '',
    type: 'BANNER',
    targetUrl: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    price: '',
  });

  useEffect(() => {
    fetchSponsorships();
  }, []);

  const fetchSponsorships = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/sponsorships');
      if (!response.ok) throw new Error('Failed to fetch sponsorships');
      const data = await response.json();
      if (data.success) {
        setSponsorships(data.data || []);
        setStats(data.stats || { activeSponsorships: 0, totalRevenue: 0, totalImpressions: 0, totalClicks: 0 });
      }
    } catch (err: any) {
      console.error('Failed to fetch:', err);
      setError(err.message);
      // Mock data
      const mock = [
        { id: '1', sponsor: 'National Bank', type: 'BANNER', startDate: '2026-07-01', endDate: '2026-08-01', price: 500000, impressions: 15000, clicks: 450, status: 'active', targetUrl: 'https://nationalbank.mw', imageUrl: '' },
        { id: '2', sponsor: 'Airtel Malawi', type: 'FEATURED_LISTING', startDate: '2026-07-15', endDate: '2026-09-15', price: 350000, impressions: 8000, clicks: 320, status: 'active', targetUrl: 'https://airtel.mw', imageUrl: '' },
        { id: '3', sponsor: 'UNICEF Malawi', type: 'WEBINAR', startDate: '2026-08-01', endDate: '2026-08-30', price: 750000, impressions: 0, clicks: 0, status: 'scheduled', targetUrl: '', imageUrl: '' },
      ];
      setSponsorships(mock);
      setStats({
        activeSponsorships: mock.filter(s => s.status === 'active').length,
        totalRevenue: mock.reduce((sum, s) => sum + s.price, 0),
        totalImpressions: mock.reduce((sum, s) => sum + s.impressions, 0),
        totalClicks: mock.reduce((sum, s) => sum + s.clicks, 0),
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingSponsorship(null);
    setFormData({ sponsor: '', type: 'BANNER', targetUrl: '', imageUrl: '', startDate: '', endDate: '', price: '' });
    setShowModal(true);
  };

  const openEditModal = (sponsorship: any) => {
    setEditingSponsorship(sponsorship);
    setFormData({
      sponsor: sponsorship.sponsor || '',
      type: sponsorship.type || 'BANNER',
      targetUrl: sponsorship.targetUrl || '',
      imageUrl: sponsorship.imageUrl || '',
      startDate: sponsorship.startDate?.split('T')[0] || '',
      endDate: sponsorship.endDate?.split('T')[0] || '',
      price: sponsorship.price?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.sponsor || !formData.startDate || !formData.endDate || !formData.price) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    try {
      const url = editingSponsorship
        ? `/api/admin/sponsorships?id=${editingSponsorship.id}`
        : '/api/admin/sponsorships';
      
      const method = editingSponsorship ? 'PUT' : 'POST';
      
      const body: any = {
        sponsor: formData.sponsor,
        type: formData.type,
        targetUrl: formData.targetUrl,
        imageUrl: formData.imageUrl,
        startDate: formData.startDate,
        endDate: formData.endDate,
        price: parseInt(formData.price) || 0,
      };

      // If editing, include the ID
      if (editingSponsorship) {
        body.sponsorshipId = editingSponsorship.id;
        body.action = 'update';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      setToast({
        message: editingSponsorship ? 'Sponsorship updated' : 'Sponsorship created',
        type: 'success',
      });
      setShowModal(false);
      fetchSponsorships();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsorship?')) return;
    try {
      const response = await fetch(`/api/admin/sponsorships?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setToast({ message: 'Sponsorship deleted', type: 'success' });
      fetchSponsorships();
    } catch (err: any) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const handleStatusChange = async (id: string, action: string) => {
    try {
      const response = await fetch('/api/admin/sponsorships', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorshipId: id, action }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setToast({ message: `Sponsorship ${action}d`, type: 'success' });
      fetchSponsorships();
    } catch (err: any) {
      setToast({ message: 'Failed to update', type: 'error' });
    }
  };

  const columns = [
    {
      key: 'sponsor', header: 'Sponsor',
      accessor: (s: any) => (
        <div>
          <p className="font-medium text-navy">{s.sponsor}</p>
          <p className="text-xs text-grey-medium">{s.type?.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'period', header: 'Period',
      accessor: (s: any) => (
        <div className="text-sm">
          <p>{new Date(s.startDate).toLocaleDateString()}</p>
          <p className="text-xs text-grey-medium">to {new Date(s.endDate).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'performance', header: 'Performance',
      accessor: (s: any) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2"><Eye size={12} className="text-grey-medium" /><span>{(s.impressions || 0).toLocaleString()} views</span></div>
          <div className="flex items-center gap-2"><MousePointer size={12} className="text-grey-medium" /><span>{(s.clicks || 0).toLocaleString()} clicks</span></div>
          <p className="text-xs text-grey-medium">CTR: {s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(2) : 0}%</p>
        </div>
      ),
    },
    {
      key: 'revenue', header: 'Revenue',
      accessor: (s: any) => <span className="font-semibold text-green">{formatCurrency(s.price)}</span>,
    },
    {
      key: 'status', header: 'Status',
      accessor: (s: any) => (
        <Badge variant={s.status === 'active' ? 'success' : s.status === 'scheduled' ? 'warning' : 'neutral'}>
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      accessor: (s: any) => (
        <div className="flex gap-1">
          {s.status === 'scheduled' && (
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(s.id, 'activate')}>
              Activate
            </Button>
          )}
          {s.status === 'active' && (
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(s.id, 'pause')}>
              Pause
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => openEditModal(s)}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
            <Trash2 size={14} className="text-red" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Sponsorships</h1>
          <p className="text-grey-dark mt-1">Manage sponsored content and advertisements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchSponsorships}><RefreshCw size={16} /></Button>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={openNewModal}>New Sponsorship</Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} /><span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">Active</p><p className="text-2xl font-bold text-navy">{stats.activeSponsorships}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">Revenue</p><p className="text-2xl font-bold text-green">{formatCurrency(stats.totalRevenue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">Impressions</p><p className="text-2xl font-bold text-blue-600">{(stats.totalImpressions || 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-grey-medium">Avg CTR</p><p className="text-2xl font-bold text-purple-600">{stats.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) : 0}%</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0"><Table data={sponsorships} columns={columns} isLoading={loading} emptyMessage="No sponsorships found" /></CardContent></Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSponsorship ? 'Edit Sponsorship' : 'Create Sponsorship'} size="lg">
        <div className="space-y-4">
          <Input label="Sponsor Name *" placeholder="e.g., National Bank" value={formData.sponsor} onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Type</label>
              <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="BANNER">Banner Ad</option>
                <option value="WEBINAR">Sponsored Webinar</option>
                <option value="PROMOTED_COURSE">Promoted Course</option>
                <option value="FEATURED_LISTING">Featured Listing</option>
              </select>
            </div>
            <Input label="Price (MWK) *" type="number" placeholder="500000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date *" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            <Input label="End Date *" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          </div>
          <Input label="Target URL" placeholder="https://..." value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} />
          <Input label="Image URL" placeholder="https://..." value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave}>
              {editingSponsorship ? 'Update' : 'Create'} Sponsorship
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}