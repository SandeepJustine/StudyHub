'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  FileText, Users, Calendar, DollarSign, Clock, CheckCircle,
  AlertCircle, RefreshCw, Eye, Play,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';
import type { CorporateTrainingPackage, TrainingStatus } from '@/types/corporate';

const statusConfig: Record<TrainingStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon: React.ReactNode }> = {
  DRAFT: { label: 'Draft', variant: 'warning', icon: <Clock size={14} /> },
  PENDING_APPROVAL: { label: 'Pending', variant: 'warning', icon: <Clock size={14} /> },
  ACTIVE: { label: 'Active', variant: 'success', icon: <CheckCircle size={14} /> },
  IN_PROGRESS: { label: 'In Progress', variant: 'info', icon: <RefreshCw size={14} /> },
  COMPLETED: { label: 'Completed', variant: 'success', icon: <CheckCircle size={14} /> },
  CANCELLED: { label: 'Cancelled', variant: 'error', icon: <AlertCircle size={14} /> },
  ARCHIVED: { label: 'Archived', variant: 'neutral', icon: <FileText size={14} /> },
};

export default function ContractsPage() {
  const [packages, setPackages] = useState<CorporateTrainingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CorporateTrainingPackage | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/corporate/training');
      const result = await response.json();
      if (response.ok && result.success) {
        setPackages(result.data || []);
      } else {
        setToast({ message: result.error || 'Failed to load packages', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load packages', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (pkg: CorporateTrainingPackage) => {
    setIsActivating(true);
    try {
      const response = await fetch(`/api/corporate/training/${pkg.id}/activate`, {
        method: 'POST',
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'Package activated successfully', type: 'success' });
        loadPackages();
      } else {
        setToast({ message: result.error || 'Failed to activate package', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to activate package', type: 'error' });
    } finally {
      setIsActivating(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Training Packages</h1>
          <p className="text-grey-dark mt-1">Manage your corporate training packages</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadPackages} leftIcon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-grey-light/50 rounded w-3/4"></div>
                  <div className="h-4 bg-grey-light/50 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No packages yet</h3>
            <p className="text-grey-medium">
              Create training packages from the Training section to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {packages.map(pkg => {
            const config = statusConfig[pkg.status] || statusConfig.DRAFT;
            return (
              <Card key={pkg.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-navy">{pkg.title}</h3>
                        <Badge variant={config.variant} size="md" className="flex items-center gap-1">
                          {config.icon}
                          {config.label}
                        </Badge>
                        <Badge variant="info" size="sm">{pkg.category.replace('_', ' ')}</Badge>
                        <Badge variant="neutral" size="sm">{pkg.mode.replace('_', ' ')}</Badge>
                      </div>

                      {pkg.description && (
                        <p className="text-sm text-grey-medium mb-3 line-clamp-2">
                          {pkg.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-grey-medium" />
                          <span className="text-navy font-medium">{formatCurrency(pkg.totalBudget)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-grey-medium" />
                          <span className="text-navy">{pkg.enrolledCount}/{pkg.maximumParticipants} enrolled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-grey-medium" />
                          <span className="text-navy">{pkg.curriculum?.length || 0} modules</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-grey-medium" />
                          <span className="text-navy">
                            {formatDate(pkg.startDate)} - {formatDate(pkg.endDate)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-grey-medium">
                        Created {formatRelativeTime(new Date(pkg.createdAt))}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedPackage(pkg); setShowDetailModal(true); }}
                        leftIcon={<Eye size={16} />}
                      >
                        View
                      </Button>
                      {pkg.status === 'DRAFT' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleActivate(pkg)}
                          loading={isActivating}
                          leftIcon={<Play size={16} />}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedPackage?.title || 'Package Details'}
        size="lg"
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-grey-medium">Status</p>
                <p className="font-semibold text-navy">{selectedPackage.status}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Budget</p>
                <p className="font-semibold text-navy">{formatCurrency(selectedPackage.totalBudget)}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Participants</p>
                <p className="font-semibold text-navy">
                  {selectedPackage.enrolledCount}/{selectedPackage.maximumParticipants} (min {selectedPackage.minimumParticipants})
                </p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Price per Person</p>
                <p className="font-semibold text-navy">{formatCurrency(selectedPackage.pricePerParticipant)} {selectedPackage.currency}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Start Date</p>
                <p className="font-semibold text-navy">{formatDate(selectedPackage.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">End Date</p>
                <p className="font-semibold text-navy">{formatDate(selectedPackage.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Duration</p>
                <p className="font-semibold text-navy">{selectedPackage.durationDays} days</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Certification</p>
                <p className="font-semibold text-navy">{selectedPackage.certificationIncluded ? 'Included' : 'Not included'}</p>
              </div>
            </div>

            {selectedPackage.instructorName && (
              <div>
                <p className="text-sm text-grey-medium mb-1">Instructor</p>
                <p className="font-semibold text-navy">{selectedPackage.instructorName}</p>
                {selectedPackage.instructorBio && (
                  <p className="text-sm text-grey-dark">{selectedPackage.instructorBio}</p>
                )}
              </div>
            )}

            {selectedPackage.learningOutcomes && selectedPackage.learningOutcomes.length > 0 && (
              <div>
                <p className="text-sm text-grey-medium mb-2">Learning Outcomes</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedPackage.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="text-sm text-grey-dark">{outcome}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPackage.curriculum && selectedPackage.curriculum.length > 0 && (
              <div>
                <p className="text-sm text-grey-medium mb-2">Curriculum ({selectedPackage.curriculum.length} modules)</p>
                <div className="space-y-2">
                  {selectedPackage.curriculum.map((mod, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-grey-light/50 rounded-lg">
                      <div>
                        <p className="font-medium text-navy">{mod.title}</p>
                        <p className="text-sm text-grey-medium">{mod.description}</p>
                      </div>
                      <p className="text-sm text-grey-medium">{mod.durationHours}h</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-grey-light">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              {selectedPackage.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleActivate(selectedPackage);
                    setShowDetailModal(false);
                  }}
                  loading={isActivating}
                  leftIcon={<Play size={16} />}
                >
                  Activate
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
