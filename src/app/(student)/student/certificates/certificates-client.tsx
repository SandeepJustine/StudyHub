'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { FileText, Download, Eye, CreditCard, Smartphone, Building2, Lock } from 'lucide-react';

interface Certificate {
  id: string;
  certificateNumber: string;
  type: string;
  delivery: string;
  title: string;
  description?: string;
  issuedAt: string;
  paymentStatus: string;
  amount: number;
  verificationId: string;
  enrollment?: {
    course: { title: string; subject: string };
  };
  examAttempt?: {
    quiz: { title: string };
    score: number;
    passed: boolean;
  };
}

interface StudentCertificatesClientProps {
  initialCertificates: any[];
}

export function StudentCertificatesClient({ initialCertificates }: StudentCertificatesClientProps) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phone, setPhone] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const paymentMethods = [
    { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: <Smartphone size={20} /> },
    { id: 'TNM_MPAMBA', name: 'TNM Mpamba', icon: <Smartphone size={20} /> },
    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: <Building2 size={20} /> },
    { id: 'PAYCHANGU', name: 'Card Payment', icon: <CreditCard size={20} /> },
  ];

  const handleRequestCertificate = async () => {
    if (!selectedCertificate || !paymentMethod) {
      setToast({ message: 'Please select a payment method', type: 'error' });
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          certificateId: selectedCertificate.id,
          paymentMethod,
          phone,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `Server error ${res.status}`);
      }

      if (result.data.paymentStatus === 'PAID' || result.data.paymentStatus === 'FREE') {
        setToast({ message: 'Certificate payment successful!', type: 'success' });
        setShowRequestModal(false);
        setSelectedCertificate(null);
        setPaymentMethod('');
        setPhone('');
        // Refresh certificates
        const certRes = await fetch('/api/certificates');
        const certResult = await certRes.json();
        if (certResult.success) {
          setCertificates(certResult.data);
        }
      } else {
        setToast({ message: 'Payment is being processed. Please wait for confirmation.', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to process payment', type: 'error' });
    } finally {
      setSubscribing(false);
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
      setToast({ message: error.error || 'Payment required to download certificate', type: 'error' });
    }
  };

  const getStatusBadge = (cert: Certificate) => {
    if (cert.paymentStatus === 'PAID') {
      return <Badge variant="success" size="sm">Paid</Badge>;
    } else if (cert.paymentStatus === 'PENDING') {
      return <Badge variant="warning" size="sm">Payment Pending</Badge>;
    }
    return <Badge variant="neutral" size="sm">Free</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-navy">My Certificates</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certificates.map((cert) => (
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
                {getStatusBadge(cert)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grey-medium">Type</span>
                  <Badge variant="info" size="sm">{cert.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grey-medium">Delivery</span>
                  <Badge variant="neutral" size="sm">{cert.delivery}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-grey-medium">Issued</span>
                  <span className="text-navy">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                </div>
                {cert.amount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-grey-medium">Amount</span>
                    <span className="text-navy font-semibold">MWK {cert.amount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedCertificate(cert)}>
                  <Eye size={14} className="mr-1" /> View
                </Button>
                {cert.paymentStatus === 'PAID' || cert.paymentStatus === 'FREE' ? (
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => handleDownload(cert.id)}>
                    <Download size={14} className="mr-1" /> Download
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => { setSelectedCertificate(cert); setShowRequestModal(true); }}>
                    <Lock size={14} className="mr-1" /> Pay
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {certificates.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <FileText size={40} className="mx-auto text-grey-medium mb-3" />
            <h3 className="font-semibold text-navy">No Certificates Yet</h3>
            <p className="text-sm text-grey-dark">Complete a course or exam to earn your first certificate.</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => { setShowRequestModal(false); setSelectedCertificate(null); setPaymentMethod(''); setPhone(''); }}
        title="Complete Payment"
        size="md"
      >
        <div className="space-y-4">
          {selectedCertificate && (
            <>
              <div className="bg-grey-light/50 rounded-lg p-4">
                <h3 className="font-semibold text-navy">{selectedCertificate.title}</h3>
                <p className="text-sm text-grey-medium">{selectedCertificate.certificateNumber}</p>
                <p className="text-lg font-bold text-navy mt-2">MWK {selectedCertificate.amount.toLocaleString()}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-grey-dark mb-3">Select Payment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === method.id ? 'border-navy bg-navy/5' : 'border-grey-light hover:border-navy/50'}`}
                    >
                      <span className={paymentMethod === method.id ? 'text-navy' : 'text-grey-medium'}>{method.icon}</span>
                      <span className="text-sm font-medium text-grey-dark">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(paymentMethod === 'AIRTEL_MONEY' || paymentMethod === 'TNM_MPAMBA') && (
                <Input
                  label={paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Phone Number' : 'TNM Phone Number'}
                  placeholder={paymentMethod === 'AIRTEL_MONEY' ? '+265 999 000 000' : '+265 888 000 000'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={subscribing}
                />
              )}

              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={handleRequestCertificate}
                loading={subscribing}
                leftIcon={<CreditCard size={18} />}
              >
                {subscribing ? 'Processing...' : `Pay MWK ${selectedCertificate.amount.toLocaleString()}`}
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* View Certificate Modal */}
      <Modal
        isOpen={!!selectedCertificate && !showRequestModal}
        onClose={() => setSelectedCertificate(null)}
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
              {selectedCertificate.description && (
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-navy">{selectedCertificate.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Type</p>
                  <Badge variant="info" size="sm">{selectedCertificate.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Status</p>
                  <Badge variant={selectedCertificate.paymentStatus === 'PAID' ? 'success' : selectedCertificate.paymentStatus === 'FREE' ? 'neutral' : 'warning'} size="sm">
                    {selectedCertificate.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Issued</p>
                  <p className="text-sm text-navy">{new Date(selectedCertificate.issuedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-grey-medium uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-sm text-navy font-semibold">MWK {selectedCertificate.amount.toLocaleString()}</p>
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
                  <p className="text-xs text-grey-medium">Score: {selectedCertificate.examAttempt.score}% | {selectedCertificate.examAttempt.passed ? 'Passed' : 'Failed'}</p>
                </div>
              )}
            </div>
            {selectedCertificate.paymentStatus === 'PAID' || selectedCertificate.paymentStatus === 'FREE' ? (
              <Button variant="primary" fullWidth onClick={() => handleDownload(selectedCertificate.id)}>
                <Download size={14} className="mr-1" /> Download Certificate
              </Button>
            ) : (
              <Button variant="primary" fullWidth onClick={() => { setShowRequestModal(true); }}>
                <Lock size={14} className="mr-1" /> Pay & Download
              </Button>
            )}
          </div>
        )}
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
