'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Search, Filter, Users, Clock, FileText, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  position: string;
  postingId: string;
  postingTitle: string;
  appliedAt: string;
  status: string;
  coverLetter?: string;
  cvUrl?: string;
  notes?: string;
}

interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'warning', icon: <Clock size={14} /> },
  reviewed: { label: 'Reviewed', variant: 'info', icon: <FileText size={14} /> },
  shortlisted: { label: 'Shortlisted', variant: 'success', icon: <CheckCircle size={14} /> },
  rejected: { label: 'Rejected', variant: 'error', icon: <XCircle size={14} /> },
  hired: { label: 'Hired', variant: 'success', icon: <CheckCircle size={14} /> },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');

  useEffect(() => {
    loadApplications();
  }, [searchQuery, statusFilter, pagination.page]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (searchQuery) params.set('query', searchQuery);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/corporate/applications?${params.toString()}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setApplications(result.applications || []);
        setPagination(result.pagination || pagination);
      } else {
        setToast({ message: result.error || 'Failed to load applications', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load applications', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = (app: Application) => {
    setSelectedApplication(app);
    setReviewStatus(app.status);
    setReviewNotes(app.notes || '');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/corporate/applications/${selectedApplication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reviewStatus, notes: reviewNotes }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'Application status updated successfully', type: 'success' });
        setShowReviewModal(false);
        loadApplications();
      } else {
        setToast({ message: result.error || 'Failed to update application', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update application', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadApplications();
  };

  const handleFilter = () => {
    setPagination({ ...pagination, page: 1 });
    loadApplications();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Applications</h1>
          <p className="text-grey-dark mt-1">Review and manage job applications from candidates</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadApplications} leftIcon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} className="text-grey-medium" />}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleFilter} leftIcon={<Filter size={16} />}>
              Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              All Applications ({pagination.total})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-grey-light/50 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-grey-medium mb-4" />
              <p className="text-grey-dark">No applications found</p>
              <p className="text-sm text-grey-medium mt-1">
                Applications will appear here when candidates apply to your job postings.
              </p>
            </div>
          ) : (
            <Table
              data={applications}
              columns={[
                {
                  key: 'applicant',
                  header: 'Applicant',
                  accessor: (app) => (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                        <span className="font-medium text-navy">
                          {app.applicantName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-navy">{app.applicantName}</p>
                        <p className="text-sm text-grey-medium">{app.applicantEmail}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'position',
                  header: 'Position',
                  accessor: (app) => (
                    <div>
                      <p className="font-medium text-navy">{app.postingTitle}</p>
                      <p className="text-sm text-grey-medium">{app.position}</p>
                    </div>
                  ),
                },
                {
                  key: 'appliedAt',
                  header: 'Applied',
                  accessor: (app) => (
                    <span className="flex items-center gap-1 text-sm text-grey-medium">
                      <Clock size={14} />
                      {formatRelativeTime(new Date(app.appliedAt))}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  accessor: (app) => {
                    const config = statusConfig[app.status] || statusConfig.pending;
                    return (
                      <Badge variant={config.variant} size="md" className="flex items-center gap-1">
                        {config.icon}
                        {config.label}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  accessor: (app) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReview(app)}
                    >
                      Review
                    </Button>
                  ),
                },
              ]}
              onRowClick={(app) => handleReview(app)}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm text-navy">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`Review Application - ${selectedApplication?.applicantName}`}
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-grey-medium">Applicant Name</p>
                <p className="font-semibold text-navy">{selectedApplication.applicantName}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Email</p>
                <p className="font-semibold text-navy">{selectedApplication.applicantEmail}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Position</p>
                <p className="font-semibold text-navy">{selectedApplication.position}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Job Posting</p>
                <p className="font-semibold text-navy">{selectedApplication.postingTitle}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Applied</p>
                <p className="font-semibold text-navy">
                  {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-grey-medium">Current Status</p>
                <p className="font-semibold text-navy">
                  {statusConfig[selectedApplication.status]?.label || selectedApplication.status}
                </p>
              </div>
            </div>

            {selectedApplication.coverLetter && (
              <div>
                <p className="text-sm text-grey-medium mb-1">Cover Letter</p>
                <p className="text-sm text-grey-dark bg-grey-light/50 rounded-lg p-3">
                  {selectedApplication.coverLetter}
                </p>
              </div>
            )}

            {selectedApplication.cvUrl && (
              <div>
                <p className="text-sm text-grey-medium mb-1">CV</p>
                <a
                  href={selectedApplication.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy hover:underline text-sm"
                >
                  View CV
                </a>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Application Status</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Notes</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg min-h-[100px]"
                placeholder="Add notes about this application..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitReview} loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
