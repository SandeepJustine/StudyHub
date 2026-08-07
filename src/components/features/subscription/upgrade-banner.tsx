import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, Lock, ArrowRight, FileText, Upload } from 'lucide-react';

interface UpgradeBannerProps {
  type: 'download' | 'upload';
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
  onUpgradeClick?: () => void;
}

export function UpgradeBanner({ type, variant = 'banner', className = '', onUpgradeClick }: UpgradeBannerProps) {
  if (type === 'download') {
    return (
      <div className={`bg-gradient-to-r from-navy-50 to-purple-50 border border-purple-200 rounded-2xl p-5 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <Lock size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy">Download Past Papers</h3>
              <p className="text-sm text-grey-dark">Upgrade to Premium to download and save past papers for offline study</p>
            </div>
          </div>
          {onUpgradeClick ? (
            <Button variant="primary" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-navy font-semibold" onClick={onUpgradeClick}>
              Upgrade <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Link href="/pricing">
              <Button variant="primary" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-navy font-semibold">
                Upgrade <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (type === 'upload') {
    return (
      <div className={`bg-gradient-to-r from-navy-50 to-green-50 border border-green-200 rounded-2xl p-5 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Upload size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy">Upload Past Papers</h3>
              <p className="text-sm text-grey-dark">Upgrade to Instructor Pro or Institution tier to upload and share past papers</p>
            </div>
          </div>
          {onUpgradeClick ? (
            <Button variant="primary" size="sm" className="bg-green-500 hover:bg-green-600 text-white font-semibold" onClick={onUpgradeClick}>
              Upgrade <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Link href="/pricing">
              <Button variant="primary" size="sm" className="bg-green-500 hover:bg-green-600 text-white font-semibold">
                Upgrade <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return null;
}

interface PaywallCardProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
}

export function PaywallCard({ title, description, ctaText = 'Upgrade Now', ctaHref = '/pricing' }: PaywallCardProps) {
  return (
    <Card className="p-6 text-center">
      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Star size={24} className="text-yellow-600" />
      </div>
      <h3 className="text-lg font-semibold text-navy mb-2">{title}</h3>
      <p className="text-sm text-grey-dark mb-4">{description}</p>
      <Link href={ctaHref}>
        <Button variant="primary" className="w-full">
          {ctaText} <ArrowRight size={14} className="ml-1" />
        </Button>
      </Link>
    </Card>
  );
}
