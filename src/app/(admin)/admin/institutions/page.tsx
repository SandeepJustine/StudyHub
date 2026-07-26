'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import {
  Search,
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  CreditCard,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstitutions();
  }, [searchQuery, selectedTier]);

  const fetchInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedTier) params.append('tier', selectedTier);

      const response = await fetch(`/api/admin/institutions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch institutions');
      }
      const data = await response.json();
      setInstitutions(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching institutions:', err);
    } finally {
      setLoading(false);
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
          {inst.tier.replace('INSTITUTION_', '')}
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
          <p className="text-xs text-grey-medium">
            Renews: {new Date(inst.renewalDate).toLocaleDateString()}
          </p>
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
            View
          </Button>
          <Button variant="ghost" size="sm">
            <ExternalLink size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Institutions</h1>
          <p className="text-grey-dark mt-1">Manage partner schools and institutions</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchInstitutions}>
          <RefreshCw size={16} />
        </Button>
      </div>

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

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={selectedInstitution?.name}
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
                  <Badge>{selectedInstitution.tier.replace('INSTITUTION_', '')}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-medium">Status</span>
                  <Badge variant={selectedInstitution.subscriptionStatus === 'active' ? 'success' : 'error'}>
                    {selectedInstitution.subscriptionStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-medium">Active Since</span>
                  <span>{new Date(selectedInstitution.activeSince).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-medium">Next Renewal</span>
                  <span>{new Date(selectedInstitution.renewalDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">View Portal</Button>
              <Button variant="primary">Manage Subscription</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}