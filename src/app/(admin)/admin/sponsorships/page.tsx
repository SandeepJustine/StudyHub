'use client';

import { useState, useEffect, useCallback } from 'react';
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
  TrendingUp,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

const PLACEMENTS = [
  { value: 'HERO', label: 'Hero Banner', description: 'Top of homepage' },
  { value: 'BETWEEN_SECTIONS', label: 'Between Sections', description: 'Between content blocks' },
  { value: 'SIDEBAR', label: 'Sidebar', description: 'Course listing sidebar' },
  { value: 'FEATURED_LISTING', label: 'Featured Listing', description: 'Prominent card placement' },
  { value: 'COURSE_LIST', label: 'Course List', description: 'Within course grid' },
  { value: 'COURSE_DETAIL', label: 'Course Detail', description: 'On course pages' },
];

const TYPES = [
  { value: 'BANNER', label: 'Banner Ad' },
  { value: 'FEATURED_LISTING', label: 'Featured Listing' },
  { value: 'PROMOTED_COURSE', label: 'Promoted Course' },
  { value: 'WEBINAR', label: 'Sponsored Webinar' },
];

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
    avgCtr: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sponsor: '',
    type: 'BANNER',
    targetUrl: '',
    imageUrl: '',
    image: null as File | null,
    startDate: '',
    endDate: '',
    price: '',
    description: '',
    placement: 'HERO',
  });

  useEffect(() => {
    fetchSponsorships();
  }, []);

  const fetchSponsorships = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);

      const response = await fetch(`/api/admin/sponsorships?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch sponsorships');
      const data = await response.json();
      if (data.success) {
        setSponsorships(data.data || []);
        setStats({
          activeSponsorships: data.stats?.activeSponsorships || 0,
          totalRevenue: data.stats?.totalRevenue || 0,
          totalImpressions: data.stats?.totalImpressions || 0,
          totalClicks: data.stats?.totalClicks || 0,
          avgCtr: data.stats?.totalImpressions > 0 ? ((data.stats.totalClicks / data.stats.totalImpressions) * 100) : 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = useCallback(() => {
    setEditingSponsorship(null);
    setFormData({ sponsor: '', type: 'BANNER', targetUrl: '', imageUrl: '', image: null, startDate: '', endDate: '', price: '', description: '', placement: 'HERO' });
    setImagePreview(null);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((sponsorship: any) => {
    setEditingSponsorship(sponsorship);
    setFormData({
      sponsor: sponsorship.sponsor || '',
      type: sponsorship.type || 'BANNER',
      targetUrl: sponsorship.targetUrl || '',
      imageUrl: sponsorship.imageUrl || '',
      image: null,
      startDate: sponsorship.startDate?.split('T')[0] || '',
      endDate: sponsorship.endDate?.split('T')[0] || '',
      price: sponsorship.price?.toString() || '',
      description: sponsorship.description || '',
      placement: sponsorship.placement || 'HERO',
    });
    setImagePreview(sponsorship.image || sponsorship.imageUrl);
    setShowModal(true);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.sponsor || !formData.startDate || !formData.endDate || !formData.price) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('sponsor', formData.sponsor);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('targetUrl', formData.targetUrl);
      formDataToSend.append('imageUrl', formData.imageUrl);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('placement', formData.placement);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = editingSponsorship
        ? `/api/admin/sponsorships?sponsorshipId=${editingSponsorship.id}`
        : '/api/admin/sponsorships';
      
      const method = editingSponsorship ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
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
      setToast({ message: err.message || 'Failed to update', type: 'error' });
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
      setToast({ message: err.message || 'Failed to delete', type: 'error' });
    }
  };

  const columns = [
    {
      key: 'sponsor', header: 'Sponsor',
      accessor: (s: any) => (
        <div>
          <div className="flex items-center gap-2">
            {s.image && <img src={s.image} alt="" className="w-8 h-8 rounded object-cover" />}
            {s.imageUrl && !s.image && <img src={s.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />}
            <div>
              <p className="font-medium text-navy">{s.sponsor}</p>
              <p className="text-xs text-grey-medium">{s.type?.replace(/_/g, ' ')} • {s.placement || 'General'}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'period', header: 'Period',
      accessor: (s: any) => (
        <div className="text-sm">
          <p>{formatDate(s.startDate)}</p>
          <p className="text-xs text-grey-medium">to {formatDate(s.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'performance', header: 'Performance',
      accessor: (s: any) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2"><Eye size={12} className="text-grey-medium" /><span>{(s.impressions || 0).toLocaleString()} views</span></div>
          <div className="flex items-center gap-2"><MousePointer size={12} className="text-grey-medium" /><span>{(s.clicks || 0).toLocaleString()} clicks</span></div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp size={10} className="text-grey-medium" />
            <span className="text-grey-medium">CTR: {s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(2) : 0}%</span>
          </div>
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
          <p className="text-grey-dark mt-1">Manage sponsored content and advertisements across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchSponsorships}><RefreshCw size={16} /></Button>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={openNewModal}>New Sponsorship</Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} /><span>API error: {error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Megaphone className="text-green" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Active</p>
                <p className="text-xl font-bold text-navy">{stats.activeSponsorships}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Revenue</p>
                <p className="text-xl font-bold text-navy">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Impressions</p>
                <p className="text-xl font-bold text-navy">{(stats.totalImpressions || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MousePointer className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Clicks</p>
                <p className="text-xl font-bold text-navy">{(stats.totalClicks || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red/10 rounded-lg">
                <TrendingUp className="text-red" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Avg CTR</p>
                <p className="text-xl font-bold text-navy">{stats.avgCtr.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter size={16} className="text-grey-medium" />
            <select
              className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sponsorships Table */}
      <Card>
        <CardContent className="p-0">
          <Table data={sponsorships} columns={columns} isLoading={loading} emptyMessage="No sponsorships found" />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSponsorship ? 'Edit Sponsorship' : 'Create Sponsorship'} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Sponsor Name *" placeholder="e.g., National Bank" value={formData.sponsor} onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Type</label>
              <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                {TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Placement</label>
            <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg" value={formData.placement} onChange={(e) => setFormData({ ...formData, placement: e.target.value })}>
              {PLACEMENTS.map(p => (
                <option key={p.value} value={p.value}>{p.label} - {p.description}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Start Date *" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            <Input label="End Date *" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          </div>

          <Input label="Price (MWK) *" type="number" placeholder="500000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          <Input label="Target URL" placeholder="https://..." value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} />
          <Input label="Image URL (optional)" placeholder="https://..." value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Or Upload Image</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-grey-light rounded-lg cursor-pointer hover:border-navy transition-colors">
                <ImageIcon size={18} className="text-grey-medium" />
                <span className="text-sm text-grey-dark">Choose file</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {formData.image && <span className="text-xs text-grey-medium">{formData.image.name}</span>}
            </div>
            {imagePreview && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-grey-light">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Description</label>
            <textarea
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[80px]"
              placeholder="Brief description of this sponsorship..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

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
