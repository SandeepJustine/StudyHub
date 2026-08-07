'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Award, Search, Download, Eye, Trash2, Filter, FileText, Users, Building2 } from 'lucide-react';

interface Certificate {
  id: string;
  certificateNumber: string;
  type: string;
  delivery: string;
  title: string;
  issuedAt: string;
  paymentStatus: string;
  amount: number;
  verificationId: string;
  student: {
    user: { fullName: string; email: string };
  };
  template?: { id: string; name: string };
  enrollment?: {
    course: { title: string; subject: string };
  };
  examAttempt?: {
    quiz: { title: string };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCertificatesClient() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchCertificates = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/certificates/admin?${params}`);
      const result = await res.json();

      if (result.success) {
        setCertificates(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [typeFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates(1);
  };

  const handleView = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedCertificate) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/certificates/admin/${selectedCertificate.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to revoke certificate');
      }

      setToast({ message: 'Certificate revoked successfully', type: 'success' });
      setShowDeleteModal(false);
      setSelectedCertificate(null);
      fetchCertificates(pagination?.page || 1);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to revoke certificate', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (certificateId: string) => {
    const res = await fetch(`/api/certificates/${certificateId}/download`);
    if (res.ok) {
      const html = await res.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        setToast({ message: 'Please allow popups to view the certificate', type: 'error' });
      }
    } else {
      const error = await res.json().catch(() => ({ error: 'Failed to download certificate' }));
      setToast({ message: error.error || 'Failed to download certificate', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="sm">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'FREE':
        return <Badge variant="neutral" size="sm">Free</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-navy/10 rounded-xl">
            <Award size={22} className="text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Certificate Management</h1>
            <p className="text-sm text-grey-medium">Platform-wide certificate oversight</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-navy/10 rounded-lg"><Award size={20} className="text-navy" /></div>
            <div>
              <p className="text-2xl font-bold text-navy">{pagination?.total || 0}</p>
              <p className="text-xs text-grey-medium">Total Certificates</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><FileText size={20} className="text-green" /></div>
            <div>
              <p className="text-2xl font-bold text-navy">{certificates.filter((c) => c.paymentStatus === 'PAID').length}</p>
              <p className="text-xs text-grey-medium">Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Users size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold text-navy">{certificates.filter((c) => c.paymentStatus === 'PENDING').length}</p>
              <p className="text-xs text-grey-medium">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Building2 size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-navy">{new Set(certificates.map((c) => c.student.user.email)).size}</p>
              <p className="text-xs text-grey-medium">Unique Students</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
              <Input
                placeholder="Search by certificate number, title, or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="">All Types</option>
                <option value="DIGITAL">Digital</option>
                <option value="PRINTED">Printed</option>
                <option value="VERIFIED">Verified</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FREE">Free</option>
              </select>
              <Button type="submit" variant="primary" size="sm">
                <Filter size={14} className="mr-1" /> Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {certificates.length > 0 ? (
              <div className="bg-white rounded-lg border border-grey-light overflow-hidden">
                <table className="w-full">
                  <thead className="bg-grey-light/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-grey-dark uppercase tracking-wider">Certificate</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-grey-dark uppercase tracking-wider">Student</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-grey-dark uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-grey-dark uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-grey-dark uppercase tracking-wider">Issued</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-grey-dark uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-grey-light">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-grey-light/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-navy/10 rounded-lg">
                              <FileText size={16} className="text-navy" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-navy">{cert.title}</p>
                              <p className="text-xs text-grey-medium">{cert.certificateNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-navy">{cert.student.user.fullName}</p>
                            <p className="text-xs text-grey-medium">{cert.student.user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info" size="sm">{cert.type}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(cert.paymentStatus)}
                        </td>
                        <td className="px-4 py-3 text-sm text-grey-medium">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="xs" onClick={() => handleView(cert)}>
                              <Eye size={14} />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => handleDownload(cert.id)}>
                              <Download size={14} />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedCertificate(cert); setShowDeleteModal(true); }}>
                              <Trash2 size={14} className="text-red" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Award size={40} className="mx-auto text-grey-medium mb-3" />
                  <h3 className="font-semibold text-navy">No Certificates Found</h3>
                  <p className="text-sm text-grey-dark">No certificates match your search criteria.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-grey-medium">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} certificates
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchCertificates(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchCertificates(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedCertificate(null); }}
        title="Certificate Details"
        size="md"
      >
        {selectedCertificate && (
          <div className="space-y-4">
            <div className="bg-grey-light/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Certificate Number</p>
                <p className="text-sm font-mono text-navy">{selectedCertificate.certificateNumber}</p>
              </div>
              <div>
                <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Title</p>
                <p className="text-sm text-navy">{selectedCertificate.title}</p>
              </div>
              <div>
                <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Student</p>
                <p className="text-sm text-navy">{selectedCertificate.student.user.fullName}</p>
                <p className="text-xs text-grey-medium">{selectedCertificate.student.user.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Type</p>
                  <Badge variant="info" size="sm">{selectedCertificate.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Status</p>
                  {getStatusBadge(selectedCertificate.paymentStatus)}
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Delivery</p>
                  <p className="text-sm text-navy">{selectedCertificate.delivery}</p>
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-sm text-navy font-semibold">MWK {selectedCertificate.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Issued</p>
                  <p className="text-sm text-navy">{new Date(selectedCertificate.issuedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Verification ID</p>
                  <p className="text-sm font-mono text-navy">{selectedCertificate.verificationId}</p>
                </div>
              </div>
              {selectedCertificate.enrollment && (
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Course</p>
                  <p className="text-sm text-navy">{selectedCertificate.enrollment.course.title}</p>
                  <p className="text-xs text-grey-medium">{selectedCertificate.enrollment.course.subject}</p>
                </div>
              )}
              {selectedCertificate.examAttempt && (
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Exam</p>
                  <p className="text-sm text-navy">{selectedCertificate.examAttempt.quiz.title}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => handleDownload(selectedCertificate.id)}>
                <Download size={14} className="mr-1" /> Download
              </Button>
              <Button variant="danger" fullWidth onClick={() => { setShowViewModal(false); setShowDeleteModal(true); }}>
                <Trash2 size={14} className="mr-1" /> Revoke
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedCertificate(null); }}
        title="Revoke Certificate"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to revoke this certificate? This action cannot be undone.
            </p>
            {selectedCertificate && (
              <p className="text-sm text-red-700 mt-2 font-medium">
                {selectedCertificate.certificateNumber} - {selectedCertificate.student.user.fullName}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowDeleteModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" fullWidth onClick={handleDelete} loading={submitting}>
              Revoke Certificate
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
