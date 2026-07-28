'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Search,
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Eye,
  Settings,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchInstitutions();
  }, [searchQuery, selectedTier, pagination.page]);

  const fetchInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedTier) params.append('tier', selectedTier);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/institutions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch institutions');
      
      const data = await response.json();
      if (data.success) {
        setInstitutions(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err: any) {
      console.error('Error fetching institutions:', err);
      setError(err.message);
      
      // Mock data fallback
      setInstitutions([
        { id: '1', name: 'Lilongwe Secondary School', slug: 'lilongwe-secondary', tier: 'INSTITUTION_GOLD', students: 450, teachers: 25, subscriptionStatus: 'active', subscriptionAmount: 500000, renewalDate: '2026-08-15', activeSince: '2025-01-15' },
        { id: '2', name: 'Blantyre Academy', slug: 'blantyre-academy', tier: 'INSTITUTION_SILVER', students: 320, teachers: 18, subscriptionStatus: 'active', subscriptionAmount: 250000, renewalDate: '2026-08-20', activeSince: '2025-03-10' },
        { id: '3', name: 'Mzuzu International', slug: 'mzuzu-international', tier: 'INSTITUTION_BRONZE', students: 150, teachers: 10, subscriptionStatus: 'active', subscriptionAmount: 100000, renewalDate: '2026-08-25', activeSince: '2025-06-01' },
        { id: '4', name: 'Zomba College', slug: 'zomba-college', tier: 'INSTITUTION_BRONZE', students: 45, teachers: 5, subscriptionStatus: 'at_risk', subscriptionAmount: 100000, renewalDate: '2026-09-01', activeSince: '2025-09-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPortal = (institution: any) => {
    // Open institution portal in new tab
    window.open(`https://${institution.slug}.studyhub.mw`, '_blank');
  };

  const handleManageSubscription = (institution: any) => {
    setSelectedInstitution(institution);
    setShowDetails(false);
    setShowManageModal(true);
  };

  const handleUpdateTier = async (tier: string) => {
    if (!selectedInstitution) return;
    
    try {
      const response = await fetch('/api/admin/institutions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: selectedInstitution.id,
          action: 'update_tier',
          data: { tier },
        }),
      });

      if (!response.ok) throw new Error('Failed to update tier');

      setToast({ message: 'Institution tier updated successfully', type: 'success' });
      setShowManageModal(false);
      fetchInstitutions();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update tier', type: 'error' });
    }
  };

  const handleToggleActive = async () => {
    if (!selectedInstitution) return;
    
    try {
      const response = await fetch('/api/admin/institutions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: selectedInstitution.id,
          action: 'toggle_active',
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setToast({ message: 'Institution status updated', type: 'success' });
      setShowManageModal(false);
      fetchInstitutions();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update status', type: 'error' });
    }
  };

  const columns = [
    {
      key: 'institution',
      header: 'Institution',
      accessor: (inst: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center">
            <Building2 size={20} className="text-navy" />
          </div>
          <div>
            <p className="font-medium text-navy">{inst.name}</p>
            <p className="text-xs text-grey-medium">{inst.slug}.studyhub.mw</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      accessor: (inst: any) => (
        <Badge variant={
          inst.tier === 'INSTITUTION_GOLD' ? 'success' :
          inst.tier === 'INSTITUTION_SILVER' ? 'info' : 'warning'
        }>
          {inst.tier?.replace('INSTITUTION_', '')}
        </Badge>
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      accessor: (inst: any) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-grey-medium" />
            <span>{inst.students} students</span>
          </div>
          <div className="flex items-center gap-1">
            <GraduationCap size={12} className="text-grey-medium" />
            <span>{inst.teachers} teachers</span>
          </div>
        </div>
      ),
    },
    {
      key: 'subscription',
      header: 'Subscription',
      accessor: (inst: any) => (
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={inst.subscriptionStatus === 'active' ? 'success' : 'error'} size="sm">
              {inst.subscriptionStatus}
            </Badge>
          </div>
          <p className="text-sm font-medium text-navy mt-1">{formatCurrency(inst.subscriptionAmount)}/mo</p>
          {inst.renewalDate && (
            <p className="text-xs text-grey-medium">
              Renews: {new Date(inst.renewalDate).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (inst: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedInstitution(inst); setShowDetails(true); }}
          >
            <Eye size={14} className="mr-1" /> View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewPortal(inst)}
          >
            <ExternalLink size={14} className="mr-1" /> Portal
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedInstitution(inst); setShowManageModal(true); }}
          >
            <Settings size={14} className="mr-1" /> Manage
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Institutions</h1>
          <p className="text-grey-dark mt-1">Manage partner schools and institutions</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchInstitutions}>
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search institutions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
          >
            <option value="">All Tiers</option>
            <option value="INSTITUTION_BRONZE">Bronze</option>
            <option value="INSTITUTION_SILVER">Silver</option>
            <option value="INSTITUTION_GOLD">Gold</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={institutions}
            columns={columns}
            isLoading={loading}
            emptyMessage="No institutions found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={selectedInstitution?.name || 'Institution Details'}
        size="lg"
      >
        {selectedInstitution && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Users size={24} className="mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-600">{selectedInstitution.students}</p>
                <p className="text-xs text-blue-800">Students</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <GraduationCap size={24} className="mx-auto text-green mb-2" />
                <p className="text-2xl font-bold text-green">{selectedInstitution.teachers}</p>
                <p className="text-xs text-green-800">Teachers</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <CreditCard size={24} className="mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedInstitution.subscriptionAmount)}</p>
                <p className="text-xs text-purple-800">Monthly Fee</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-navy mb-2">Subscription Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-grey-medium">Tier</span>
                  <Badge>{selectedInstitution.tier?.replace('INSTITUTION_', '')}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-medium">Status</span>
                  <Badge variant={selectedInstitution.subscriptionStatus === 'active' ? 'success' : 'error'}>
                    {selectedInstitution.subscriptionStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-medium">Active Since</span>
                  <span>{selectedInstitution.activeSince ? new Date(selectedInstitution.activeSince).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-medium">Next Renewal</span>
                  <span>{selectedInstitution.renewalDate ? new Date(selectedInstitution.renewalDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleViewPortal(selectedInstitution)}>
                <ExternalLink size={14} className="mr-1" /> View Portal
              </Button>
              <Button variant="primary" onClick={() => handleManageSubscription(selectedInstitution)}>
                <Settings size={14} className="mr-1" /> Manage Subscription
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage Subscription Modal */}
      <Modal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        title={`Manage: ${selectedInstitution?.name}`}
        size="md"
      >
        {selectedInstitution && (
          <div className="space-y-4">
            <div className="p-3 bg-grey-light/50 rounded-lg">
              <p className="text-sm text-grey-medium">Current Tier</p>
              <p className="text-xl font-bold text-navy">{selectedInstitution.tier?.replace('INSTITUTION_', '')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-navy mb-2">Change Tier</h4>
              <div className="grid grid-cols-3 gap-2">
                {['INSTITUTION_BRONZE', 'INSTITUTION_SILVER', 'INSTITUTION_GOLD'].map((tier) => (
                  <Button
                    key={tier}
                    variant={selectedInstitution.tier === tier ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateTier(tier)}
                    disabled={selectedInstitution.tier === tier}
                  >
                    {tier.replace('INSTITUTION_', '')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-grey-light pt-4">
              <Button
                variant={selectedInstitution.isActive === false ? 'success' : 'danger'}
                fullWidth
                onClick={handleToggleActive}
              >
                {selectedInstitution.isActive === false ? 'Activate Institution' : 'Deactivate Institution'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}