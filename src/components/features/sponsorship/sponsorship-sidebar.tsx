import Image from 'next/image';
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

interface SponsorshipSidebarProps {
  sponsorships: Sponsorship[];
  placement?: string;
}

export function SponsorshipSidebar({ sponsorships, placement = 'SIDEBAR' }: SponsorshipSidebarProps) {
  const items = sponsorships.filter(s => s.placement === placement || (!s.placement && s.type === 'BANNER'));
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
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-lg transition-all duration-300 border border-grey-light/50"
          onClick={() => handleClick(item.id, item.targetUrl)}
        >
          <div className="relative h-32">
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
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5">
                <Sparkles size={12} className="text-yellow-600" />
                <span className="text-xs font-semibold text-navy">Ad</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white">
            <h3 className="font-bold text-navy text-sm mb-1">{item.sponsor}</h3>
            {item.description && (
              <p className="text-xs text-grey-dark line-clamp-2">{item.description}</p>
            )}
            {item.targetUrl && (
              <div className="flex items-center gap-1 text-xs text-red mt-2">
                <ExternalLink size={12} />
                <span>Learn more</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
