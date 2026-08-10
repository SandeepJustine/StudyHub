'use client';

import { useState, useEffect } from 'react';
import { SponsorshipBanner } from './sponsorship-banner';
import { SponsorshipCard } from './sponsorship-card';
import { SponsorshipSidebar } from './sponsorship-sidebar';

export interface Sponsorship {
  id: string;
  sponsor: string;
  type: string;
  targetUrl: string | null;
  imageUrl: string | null;
  image: string | null;
  placement: string | null;
  description: string | null;
  impressions: number;
  clicks: number;
}

interface PublicSponsorshipsProps {
  placements?: string[];
}

export function PublicSponsorships({ placements = ['HERO', 'SIDEBAR', 'FEATURED_LISTING', 'COURSE_LIST', 'BETWEEN_SECTIONS'] }: PublicSponsorshipsProps) {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsorships();
  }, []);

  const fetchSponsorships = async () => {
    try {
      const params = new URLSearchParams();
      placements.forEach(p => params.append('placement', p));
      
      const res = await fetch(`/api/sponsorships?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch sponsorships');
      const data = await res.json();
      if (data.success) {
        setSponsorships(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load sponsorships:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const hasBanner = sponsorships.some(s => s.placement === 'HERO' || s.placement === 'BETWEEN_SECTIONS' || !s.placement);
  const hasCards = sponsorships.some(s => s.placement === 'FEATURED_LISTING' || s.placement === 'COURSE_LIST');
  const hasSidebar = sponsorships.some(s => s.placement === 'SIDEBAR');

  if (!hasBanner && !hasCards && !hasSidebar) return null;

  return (
    <>
      {hasBanner && <SponsorshipBanner sponsorships={sponsorships} placement="HERO" />}
      {hasBanner && <SponsorshipBanner sponsorships={sponsorships} placement="BETWEEN_SECTIONS" />}
      {hasCards && <SponsorshipCard sponsorships={sponsorships} placement="FEATURED_LISTING" />}
      {hasCards && <SponsorshipCard sponsorships={sponsorships} placement="COURSE_LIST" />}
      {hasSidebar && <SponsorshipSidebar sponsorships={sponsorships} placement="SIDEBAR" />}
    </>
  );
}
