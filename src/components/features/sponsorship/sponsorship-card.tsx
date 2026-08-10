import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';

interface Sponsorship {
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

interface SponsorshipCardProps {
  sponsorships: Sponsorship[];
  placement?: string;
}

export function SponsorshipCard({ sponsorships, placement = 'FEATURED_LISTING' }: SponsorshipCardProps) {
  const items = sponsorships.filter(s => s.placement === placement || (!s.placement && s.type === 'FEATURED_LISTING'));
  if (items.length === 0) return null;

  const handleClick = async (sponsorshipId: string, targetUrl?: string | null) => {
    try {
      await fetch('/api/sponsorships/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorshipId }),
      });
    } catch {
      // ignore
    }
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-lg transition-all duration-300 border border-grey-light/50"
          onClick={() => handleClick(item.id, item.targetUrl)}
        >
          <div className="relative h-40">
            {item.image && (
              <Image
                src={item.image}
                alt={item.sponsor}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            )}
            {item.imageUrl && !item.image && (
              <img
                src={item.imageUrl}
                alt={item.sponsor}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
          </div>
          <div className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-yellow-500" />
              <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Sponsored</span>
            </div>
            <h3 className="font-bold text-navy mb-1">{item.sponsor}</h3>
            {item.description && (
              <p className="text-sm text-grey-dark line-clamp-2">{item.description}</p>
            )}
            {item.targetUrl && (
              <div className="flex items-center gap-1 text-xs text-red mt-2 group-hover:underline">
                <ExternalLink size={12} />
                <span>Visit sponsor</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
