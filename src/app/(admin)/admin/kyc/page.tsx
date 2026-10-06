'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  FileText,
  User,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

type KycDoc = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  instructor: {
    user: { fullName: string; email: string };
  };
  reviewer: { fullName: string; email: string } | null;
};

const TYPE_LABEL: Record<string, string> = {
  NATIONAL_ID: 'National ID',
  CERTIFICATE: 'Certificate',
  OTHER: 'Other',
};

export default function AdminKycPage() {
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<KycDoc | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchDocs();
  }, [statusFilter, pagination.page]);

  async function fetchDocs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('instructorId', search); // crude: pass userId from user search
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await fetch(`/api/admin/kyc?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setDocs(json.data || []);
      setPagination((p) => ({ ...p, ...json.pagination }));
    } catch {
      setToast({ message: 'Failed to load KYC documents', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function reviewDocument(action: 'approve' | 'reject') {
    if (!selected) return;
    setSubmitting(selected.id);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selected.id, action, reviewNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Review failed');

      setDocs((prev) =>
        prev.map((d) => (d.id === selected.id ? json.data : d))
      );
      setSelected(null);
      setReviewNote('');
      setToast({ message: `Document ${action}d successfully`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Review failed', type: 'error' });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">KYC Verification</h1>
          <p className="text-grey-dark mt-1">Review instructor identity and qualification documents</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search size={18} className="text-grey-medium" />}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <Button variant="outline" leftIcon={<Filter size={16} />} onClick={fetchDocs}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-grey-medium">Pending</p>
              <Shield size={16} className="text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-navy">
              {docs.filter((d) => d.status === 'PENDING').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-grey-medium">Approved</p>
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-navy">
              {docs.filter((d) => d.status === 'APPROVED').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-grey-medium">Rejected</p>
              <XCircle size={16} className="text-red-600" />
            </div>
            <p className="text-2xl font-bold text-navy">
              {docs.filter((d) => d.status === 'REJECTED').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-grey-medium">Total</p>
              <FileText size={16} className="text-navy" />
            </div>
            <p className="text-2xl font-bold text-navy">{docs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-grey-medium">Loading…</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center text-grey-medium">No KYC documents found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-grey-light">
                    <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Instructor</th>
                    <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Type</th>
                    <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Document</th>
                    <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-grey-medium uppercase">Submitted</th>
                    <th className="text-right p-4 text-xs font-medium text-grey-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id} className="border-b border-grey-light last:border-b-0">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-navy text-sm">{doc.instructor.user.fullName}</p>
                          <p className="text-xs text-grey-medium">{doc.instructor.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-grey-dark">
                        {TYPE_LABEL[doc.type] || doc.type}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-navy truncate max-w-[200px]">{doc.fileName}</p>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            doc.status === 'APPROVED' ? 'success' :
                            doc.status === 'REJECTED' ? 'error' : 'warning'
                          }
                          size="sm"
                        >
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-grey-medium">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-grey-medium hover:text-navy rounded"
                            title="View"
                          >
                            <Eye size={14} />
                          </a>
                          {doc.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => { setSelected(doc); setReviewNote(''); }}
                                className="p-1.5 text-grey-medium hover:text-green rounded"
                                title="Approve"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => { setSelected(doc); setReviewNote(''); }}
                                className="p-1.5 text-grey-medium hover:text-red rounded"
                                title="Reject"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setReviewNote(''); }}
        title={`Review ${selected ? TYPE_LABEL[selected.type] || selected.type : ''}`}
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-grey-light/50 rounded-lg">
              <p className="text-sm font-medium text-navy">{selected.fileName}</p>
              <p className="text-xs text-grey-medium mt-1">
                {selected.instructor.user.fullName} · {selected.instructor.user.email}
              </p>
              <a
                href={selected.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                Open document in new tab
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">
                Review Note (optional)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Reason for approval or rejection…"
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[100px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => void reviewDocument('approve')}
                disabled={submitting === selected.id}
                className="flex-1"
              >
                {submitting === selected.id ? (
                  <Loader2 size={16} className="animate-spin mr-1" />
                ) : (
                  <CheckCircle size={16} className="mr-1" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => void reviewDocument('reject')}
                disabled={submitting === selected.id}
                className="flex-1 border-red text-red hover:bg-red-50"
              >
                {submitting === selected.id ? (
                  <Loader2 size={16} className="animate-spin mr-1" />
                ) : (
                  <XCircle size={16} className="mr-1" />
                )}
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
