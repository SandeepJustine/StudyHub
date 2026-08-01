'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  FileText, Users, Calendar, DollarSign, Clock, CheckCircle,
  AlertCircle, RefreshCw, Eye, Play, Package,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';

interface ContractCourse {
  courseId: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
}

interface Contract {
  id: string;
  title: string;
  description?: string;
  employees: number;
  courses: ContractCourse[];
  totalAmount: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'warning', icon: <Clock size={14} /> },
  active: { label: 'Active', variant: 'success', icon: <CheckCircle size={14} /> },
  completed: { label: 'Completed', variant: 'info', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Cancelled', variant: 'error', icon: <AlertCircle size={14} /> },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/corporate/contracts');
      const result = await response.json();
      if (response.ok && result.success) {
        setContracts(result.contracts || []);
      } else {
        setToast({ message: result.error || 'Failed to load contracts', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load contracts', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (contract: Contract) => {
    setIsActivating(true);
    try {
      const response = await fetch('/api/corporate/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'Contract activated successfully', type: 'success' });
        loadContracts();
      } else {
        setToast({ message: result.error || 'Failed to activate contract', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to activate contract', type: 'error' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (contract: Contract) => {
    return new Date() > new Date(contract.endDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Training Contracts</h1>
          <p className="text-grey-dark mt-1">Manage your corporate training contracts</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadContracts} leftIcon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Contracts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-grey-light/50 rounded w-3/4"></div>
                  <div className="h-4 bg-grey-light/50 rounded w-1/2"></div>
                  <div className="h-4 bg-grey-light/50 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No contracts yet</h3>
            <p className="text-grey-medium">
              Create training packages from the Training section to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map(contract => {
            const config = statusConfig[contract.status] || statusConfig.draft;
            const expired = isExpired(contract);
            return (
              <Card key={contract.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-navy">{contract.title}</h3>
                        <Badge variant={config.variant} size="md" className="flex items-center gap-1">
                          {config.icon}
                          {config.label}
                        </Badge>
                        {expired && contract.status === 'active' && (
                          <Badge variant="error" size="sm">
                            Expired
                          </Badge>
                        )}
                      </div>

                      {contract.description && (
                        <p className="text-sm text-grey-medium mb-3 line-clamp-2">
                          {contract.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-grey-medium" />
                          <span className="text-navy font-medium">{formatCurrency(contract.totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-grey-medium" />
                          <span className="text-navy">{contract.employees} employees</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-grey-medium" />
                          <span className="text-navy">{contract.courses?.length || 0} courses</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-grey-medium" />
                          <span className="text-navy">
                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-grey-medium">
                        Created {formatRelativeTime(new Date(contract.createdAt))}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(contract)}
                        leftIcon={<Eye size={16} />}
                      >
                        View
                      </Button>
                      {contract.status === 'draft' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleActivate(contract)}
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

      {/* Contract Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedContract?.title || 'Contract Details'}
        size="lg"
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-grey-medium">Status</p>
                <p className="font-semibold text-navy">
                  {statusConfig[selectedContract.status]?.label || selectedContract.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Amount</p>
                <p className="font-semibold text-navy">{formatCurrency(selectedContract.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Employees</p>
                <p className="font-semibold text-navy">{selectedContract.employees}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Start Date</p>
                <p className="font-semibold text-navy">{formatDate(selectedContract.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">End Date</p>
                <p className="font-semibold text-navy">{formatDate(selectedContract.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Created</p>
                <p className="font-semibold text-navy">{formatDate(selectedContract.createdAt)}</p>
              </div>
            </div>

            {selectedContract.description && (
              <div>
                <p className="text-sm text-grey-medium mb-1">Description</p>
                <p className="text-sm text-grey-dark">{selectedContract.description}</p>
              </div>
            )}

            {selectedContract.courses && selectedContract.courses.length > 0 && (
              <div>
                <p className="text-sm text-grey-medium mb-2">Courses</p>
                <div className="space-y-2">
                  {selectedContract.courses.map((course, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-grey-light/50 rounded-lg">
                      <div>
                        <p className="font-medium text-navy">{course.title}</p>
                        <p className="text-sm text-grey-medium">
                          {course.quantity} × {formatCurrency(course.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-navy">{formatCurrency(course.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-grey-light">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              {selectedContract.status === 'draft' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleActivate(selectedContract);
                    setShowDetailModal(false);
                  }}
                  loading={isActivating}
                  leftIcon={<Play size={16} />}
                >
                  Activate Contract
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
