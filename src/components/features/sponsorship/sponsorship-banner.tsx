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

interface SponsorshipBannerProps {
  sponsorships: Sponsorship[];
  placement?: string;
}

export function SponsorshipBanner({ sponsorships, placement = 'HERO' }: SponsorshipBannerProps) {
  const items = sponsorships.filter(s => s.placement === placement || !s.placement);
  if (items.length === 0) return null;

  const handleClick = async (sponsorshipId: string, targetUrl?: string | null) => {
    try {
      await fetch('/api/sponsorships/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorshipId }),
      });
    } catch {
      // ignore click tracking errors
    }
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => handleClick(item.id, item.targetUrl)}
        >
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
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Sponsored</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white">{item.sponsor}</h3>
                {item.description && (
                  <p className="text-sm text-white/80 mt-1 line-clamp-1">{item.description}</p>
                )}
              </div>
              {item.targetUrl && (
                <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                  <ExternalLink size={18} className="text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
