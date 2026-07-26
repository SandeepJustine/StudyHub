import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface InstitutionCardProps {
  institution: {
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
    address?: {
      city: string;
      district: string;
    };
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    averageProgress?: number;
  };
  onView: (institutionId: string) => void;
  onManage?: (institutionId: string) => void;
}

export function InstitutionCard({ institution, onView, onManage }: InstitutionCardProps) {
  const capacityPercentage = (institution.studentsCount / institution.maxStudents) * 100;
  const daysUntilRenewal = Math.ceil(
    (new Date(institution.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const tierBadge = {
    INSTITUTION_BRONZE: { variant: 'warning' as const, label: 'Bronze' },
    INSTITUTION_SILVER: { variant: 'info' as const, label: 'Silver' },
    INSTITUTION_GOLD: { variant: 'success' as const, label: 'Gold' },
  };

  const tierInfo = tierBadge[institution.tier as keyof typeof tierBadge] || { variant: 'neutral' as const, label: institution.tier };

  return (
    <Card padding="lg" className="hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center">
            {institution.logo ? (
              <img src={institution.logo} alt={institution.name} className="w-8 h-8 object-contain" />
            ) : (
              <Building2 size={24} className="text-navy" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-navy">{institution.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={tierInfo.variant} size="sm">{tierInfo.label}</Badge>
              <Badge variant={institution.subscriptionStatus === 'active' ? 'success' : 'error'} size="sm">
                {institution.subscriptionStatus}
              </Badge>
            </div>
          </div>
        </div>
        {institution.averageProgress !== undefined && (
          <div className="text-right">
            <p className="text-xs text-grey-medium">Progress</p>
            <p className="text-lg font-bold text-navy">{institution.averageProgress.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-grey-medium" />
          <span className="text-grey-dark">{institution.studentsCount} students</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <GraduationCap size={16} className="text-grey-medium" />
          <span className="text-grey-dark">{institution.teachersCount} teachers</span>
        </div>
        {institution.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-grey-medium" />
            <span className="text-grey-dark">{institution.address.city}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <CreditCard size={16} className="text-grey-medium" />
          <span className="text-grey-dark">{formatCurrency(institution.subscriptionAmount)}/mo</span>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-grey-medium">Capacity</span>
          <span className={`font-medium ${capacityPercentage > 90 ? 'text-red' : 'text-navy'}`}>
            {institution.studentsCount}/{institution.maxStudents}
          </span>
        </div>
        <Progress value={capacityPercentage} size="sm" variant={capacityPercentage > 90 ? 'error' : 'success'} />
      </div>

      {/* Renewal Info */}
      <div className="flex items-center gap-2 text-xs text-grey-medium mb-4">
        <Calendar size={14} />
        <span>
          Renews {formatDate(institution.renewalDate)}
          {daysUntilRenewal <= 30 && (
            <Badge variant={daysUntilRenewal <= 7 ? 'error' : 'warning'} size="sm" className="ml-2">
              {daysUntilRenewal}d left
            </Badge>
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" fullWidth onClick={() => onView(institution.id)}>
          View Details
        </Button>
        {onManage && (
          <Button variant="outline" size="sm" onClick={() => onManage(institution.id)}>
            <ExternalLink size={14} />
          </Button>
        )}
      </div>
    </Card>
  );
}