import { BookOpen, Users, Calendar, Building2, MapPin, Monitor } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import prisma from '@/lib/utils/prisma';
import type { TrainingCategory, TrainingMode } from '@/types/corporate';

export const metadata = {
  title: 'Corporate Trainings | StudyHub',
  description: 'Explore corporate training packages from companies across Malawi',
};

async function getPublicTrainings() {
  return prisma.corporateTrainingPackage.findMany({
    where: { status: 'ACTIVE' },
    include: {
      corporate: {
        select: {
          id: true,
          companyName: true,
          logo: true,
          industry: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

interface TrainingPackage {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  mode: TrainingMode;
  totalBudget: number;
  status: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  maximumParticipants: number;
  enrolledCount: number;
  certificationIncluded: boolean;
  instructorName?: string | null;
  curriculum: any;
  createdAt: Date;
  corporate?: {
    id: string;
    companyName: string;
    logo?: string | null;
    industry?: string | null;
  };
}

function getCategoryLabel(category: TrainingCategory): string {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function getModeIcon(mode: TrainingMode) {
  switch (mode) {
    case 'IN_PERSON': return <Building2 size={14} />;
    case 'HYBRID': return <MapPin size={14} />;
    default: return <Monitor size={14} />;
  }
}

export default async function PublicTrainingsPage() {
  const packages = await getPublicTrainings() as TrainingPackage[];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy">Corporate Training Packages</h1>
            <p className="text-grey-dark mt-1">
              Browse training packages from companies across Malawi
            </p>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={64} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-xl font-semibold text-navy mb-2">No Training Packages Available</h3>
            <p className="text-grey-dark">
              Corporate training packages will appear here when they are published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {pkg.corporate?.logo ? (
                        <img
                          src={pkg.corporate.logo}
                          alt={pkg.corporate.companyName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
                          <Building2 size={20} className="text-navy" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-navy text-lg">{pkg.title}</h3>
                        {pkg.corporate?.companyName && (
                          <p className="text-sm text-grey-dark">{pkg.corporate.companyName}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="info" size="sm">{getCategoryLabel(pkg.category)}</Badge>
                          <span className="flex items-center gap-1 text-xs text-grey-medium">
                            {getModeIcon(pkg.mode)} {pkg.mode.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">{pkg.status}</Badge>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-grey-dark mb-4 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <Users size={14} />
                      <span>{pkg.enrolledCount}/{pkg.maximumParticipants} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <Calendar size={14} />
                      <span>
                        {new Date(pkg.startDate).toLocaleDateString()} - {new Date(pkg.endDate).toLocaleDateString()}
                        <span className="text-grey-medium ml-1">({pkg.durationDays} days)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <BookOpen size={14} />
                      <span>{pkg.curriculum?.length || 0} modules</span>
                      {pkg.certificationIncluded && <span className="text-xs text-green">(Certificate included)</span>}
                    </div>
                    {pkg.instructorName && (
                      <div className="flex items-center gap-2 text-sm text-grey-dark">
                        <span className="text-xs text-grey-medium">Instructor: {pkg.instructorName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-grey-light">
                    <p className="text-xl font-bold text-navy">
                      {formatCurrency(pkg.totalBudget)}
                    </p>
                    <Button variant="outline" size="sm">
                      Contact Sales
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
