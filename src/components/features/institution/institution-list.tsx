'use client';

import { useState } from 'react';
import { InstitutionCard } from './institution-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, SortAsc, Building2, X } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  slug: string;
  tier: string;
  logo?: string;
  studentsCount: number;
  teachersCount: number;
  maxStudents: number;
  subscriptionStatus: string;
  subscriptionAmount: number;
  renewalDate: Date;
  address?: { city: string; district: string };
  contactPhone?: string;
  contactEmail?: string;
  averageProgress?: number;
}

interface InstitutionListProps {
  institutions: Institution[];
  onView: (institutionId: string) => void;
  onManage?: (institutionId: string) => void;
  isLoading?: boolean;
}

export function InstitutionList({ institutions, onView, onManage, isLoading }: InstitutionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Filter institutions
  const filtered = institutions
    .filter(inst => {
      const matchesSearch = !searchQuery ||
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = !tierFilter || inst.tier === tierFilter;
      const matchesStatus = !statusFilter || inst.subscriptionStatus === statusFilter;

      return matchesSearch && matchesTier && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'students': return b.studentsCount - a.studentsCount;
        case 'renewal': return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
        case 'tier': return a.tier.localeCompare(b.tier);
        default: return 0;
      }
    });

  const activeFilterCount = [tierFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setTierFilter('');
    setStatusFilter('');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
          <Input
            placeholder="Search institutions by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-medium hover:text-grey-dark"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm bg-white"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="">All Tiers</option>
            <option value="INSTITUTION_BRONZE">Bronze</option>
            <option value="INSTITUTION_SILVER">Silver</option>
            <option value="INSTITUTION_GOLD">Gold</option>
          </select>

          <select
            className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="at_risk">At Risk</option>
          </select>

          <select
            className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="students">Most Students</option>
            <option value="renewal">Renewal Date</option>
            <option value="tier">Tier</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-grey-medium">
          {filtered.length} institution{filtered.length !== 1 ? 's' : ''} found
          {activeFilterCount > 0 && ' (filtered)'}
        </p>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={64} className="mx-auto text-grey-medium mb-4" />
          <h3 className="text-xl font-semibold text-navy mb-2">No institutions found</h3>
          <p className="text-grey-dark mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((institution) => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
              onView={onView}
              onManage={onManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
