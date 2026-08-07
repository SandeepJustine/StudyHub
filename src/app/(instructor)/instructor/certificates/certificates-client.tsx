'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Award, Plus, FileText, Users, Search, Filter, Eye, Download, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subject: string;
}

interface Enrollment {
  id: string;
  student: {
    user: { fullName: string; email: string };
  };
  course: { title: string; subject: string };
  completedAt: string | null;
  certificate: { id: string } | null;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  type: string;
  delivery: string;
  title: string;
  issuedAt: string;
  paymentStatus: string;
  amount: number;
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

interface Template {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

interface InstructorCertificatesClientProps {
  instructorId: string;
  courses: any[];
  enrollments: any[];
  initialCertificates: any[];
}

export function InstructorCertificatesClient({
  instructorId,
  courses,
  enrollments,
  initialCertificates,
}: InstructorCertificatesClientProps) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    templateId: '',
    type: 'DIGITAL',
    delivery: 'DIGITAL',
  });

  const eligibleEnrollments = enrollments.filter((e) => !e.certificate);

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = cert.student.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = !courseFilter || cert.enrollment?.course.title === courseFilter || cert.examAttempt?.quiz.title === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/certificates/templates');
      const result = await res.json();
      if (result.success) {
        setTemplates(result.data);
        const defaultTemplate = result.data.find((t: Template) => t.isDefault && t.isActive);
        if (defaultTemplate) {
          setFormData((prev) => ({ ...prev, templateId: defaultTemplate.id }));
        } else if (result.data.length > 0) {
          setFormData((prev) => ({ ...prev, templateId: result.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (showIssueModal) {
      fetchTemplates();
    }
  }, [showIssueModal]);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue',
          enrollmentId: selectedEnrollment.id,
          ...formData,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to issue certificate');
      }

      setToast({ message: 'Certificate issued successfully!', type: 'success' });
      setShowIssueModal(false);
      setSelectedEnrollment(null);
      setFormData({ title: '', description: '', templateId: '', type: 'DIGITAL', delivery: 'DIGITAL' });

      setCertificates((prev) => [result.data, ...prev]);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to issue certificate', type: 'error' });
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-navy/10 rounded-xl">
            <Award size={22} className="text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Certificates</h1>
            <p className="text-sm text-grey-medium">Issue and manage student certificates</p>
          </div>
        </div>
        <Button
          onClick={() => {
            if (eligibleEnrollments.length === 0) {
              setToast({ message: 'No eligible students found', type: 'error' });
              return;
            }
            setSelectedEnrollment(eligibleEnrollments[0]);
            setShowIssueModal(true);
          }}
          leftIcon={<Plus size={16} />}
        >
          Issue Certificate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-navy/10 rounded-lg"><Award size={20} className="text-navy" /></div>
            <div>
              <p className="text-2xl font-bold text-navy">{certificates.length}</p>
              <p className="text-xs text-grey-medium">Total Issued</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle size={20} className="text-green" /></div>
            <div>
              <p className="text-2xl font-bold text-navy">{eligibleEnrollments.length}</p>
              <p className="text-xs text-grey-medium">Eligible Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-navy">{courses.length}</p>
              <p className="text-xs text-grey-medium">Active Courses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
              <Input
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.title}>{course.title}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-navy">Issued Certificates ({filteredCertificates.length})</h2>
        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCertificates.map((cert) => (
              <Card key={cert.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-navy" />
                      <div>
                        <h3 className="font-semibold text-navy text-sm">{cert.title}</h3>
                        <p className="text-xs text-grey-medium">{cert.certificateNumber}</p>
                      </div>
                    </div>
                    <Badge variant={cert.paymentStatus === 'PAID' ? 'success' : 'neutral'} size="sm">
                      {cert.paymentStatus}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-grey-medium">Student</span>
                      <span className="text-navy">{cert.student.user.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-grey-medium">Type</span>
                      <Badge variant="info" size="sm">{cert.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-grey-medium">Issued</span>
                      <span className="text-navy">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownload(cert.id)}>
                    <Download size={14} className="mr-1" /> Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Award size={40} className="mx-auto text-grey-medium mb-3" />
              <h3 className="font-semibold text-navy">No Certificates Yet</h3>
              <p className="text-sm text-grey-dark">Issue certificates to students who have completed your courses.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showIssueModal}
        onClose={() => { setShowIssueModal(false); setSelectedEnrollment(null); }}
        title="Issue Certificate"
        size="md"
      >
        <form onSubmit={handleIssueCertificate} className="space-y-4">
          {selectedEnrollment && (
            <div className="bg-grey-light/50 rounded-lg p-4">
              <p className="text-sm font-medium text-navy">Student: {selectedEnrollment.student.user.fullName}</p>
              <p className="text-xs text-grey-medium">Course: {selectedEnrollment.course.title}</p>
            </div>
          )}
          <Input
            label="Certificate Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Certificate of Completion"
            required
          />
          <Input
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Template</label>
            <select
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              required
              disabled={loadingTemplates}
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
            {loadingTemplates && (
              <p className="text-xs text-grey-medium mt-1">Loading templates...</p>
            )}
            {!loadingTemplates && templates.length === 0 && (
              <p className="text-xs text-red-600 mt-1">No templates available. Please contact admin.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="DIGITAL">Digital</option>
              <option value="PRINTED">Printed</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Delivery</label>
            <select
              value={formData.delivery}
              onChange={(e) => setFormData({ ...formData, delivery: e.target.value })}
              className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="DIGITAL">Digital Only</option>
              <option value="PRINTED">Printed Only</option>
              <option value="BOTH">Both Digital & Printed</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowIssueModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" fullWidth loading={submitting} disabled={!formData.templateId}>Issue Certificate</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
