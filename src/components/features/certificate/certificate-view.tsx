'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  Download, 
  Share2, 
  Printer, 
  Shield, 
  QrCode,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface CertificateViewProps {
  certificate: {
    id: string;
    title: string;
    type: 'DIGITAL' | 'PRINTED' | 'VERIFIED';
    verificationId: string;
    issuedAt: Date;
    studentName: string;
    courseTitle?: string;
    examTitle?: string;
    score?: number;
    instructorName?: string;
    qrCodeUrl?: string;
  };
  onDownload?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
}

export function CertificateView({
  certificate,
  onDownload,
  onShare,
  onPrint,
}: CertificateViewProps) {
  const typeBadges = {
    DIGITAL: { variant: 'info' as const, label: 'Digital Certificate' },
    PRINTED: { variant: 'warning' as const, label: 'Printed Certificate' },
    VERIFIED: { variant: 'success' as const, label: 'Verified Certificate' },
  };

  const typeBadge = typeBadges[certificate.type];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Certificate Card */}
      <Card padding="lg" className="border-4 border-navy/20 relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ 
            backgroundImage: 'url("/images/patterns/academic-border.svg")',
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 60px',
          }}
        />

        {/* Content */}
        <div className="relative text-center space-y-6">
          {/* Award Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center">
              <Award size={40} className="text-navy" />
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-sm text-grey-medium uppercase tracking-wider">Certificate of Achievement</p>
            <h2 className="text-2xl font-bold text-navy mt-2">{certificate.title}</h2>
          </div>

          {/* Recipient */}
          <div>
            <p className="text-sm text-grey-medium">This certificate is awarded to</p>
            <p className="text-xl font-bold text-navy mt-1">{certificate.studentName}</p>
          </div>

          {/* Course/Exam Info */}
          <div className="bg-navy/5 rounded-xl p-4 inline-block">
            {certificate.courseTitle && (
              <div className="flex items-center gap-2 text-sm text-grey-dark">
                <BookOpen size={16} />
                <span>{certificate.courseTitle}</span>
              </div>
            )}
            {certificate.examTitle && (
              <div className="flex items-center gap-2 text-sm text-grey-dark mt-1">
                <CheckCircle size={16} />
                <span>{certificate.examTitle}</span>
              </div>
            )}
            {certificate.score !== undefined && (
              <div className="flex items-center gap-2 text-sm text-green font-medium mt-1">
                <Award size={16} />
                <span>Score: {certificate.score}%</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex justify-center gap-8 text-sm text-grey-medium">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Issued: {formatDate(certificate.issuedAt)}</span>
            </div>
            {certificate.instructorName && (
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>By: {certificate.instructorName}</span>
              </div>
            )}
          </div>

          {/* Verification */}
          <div className="flex items-center justify-center gap-4">
            <Badge variant={typeBadge.variant}>
              <Shield size={12} className="mr-1" />
              {typeBadge.label}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-grey-medium">
              <QrCode size={16} />
              <span className="font-mono text-xs">{certificate.verificationId}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        {onDownload && (
          <Button variant="primary" leftIcon={<Download size={16} />} onClick={onDownload}>
            Download
          </Button>
        )}
        {onPrint && (
          <Button variant="outline" leftIcon={<Printer size={16} />} onClick={onPrint}>
            Print
          </Button>
        )}
        {onShare && (
          <Button variant="outline" leftIcon={<Share2 size={16} />} onClick={onShare}>
            Share
          </Button>
        )}
      </div>

      {/* Verification Info */}
      <Card padding="md" className="bg-navy/5">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-navy mt-0.5" />
          <div>
            <p className="font-medium text-navy text-sm">Verified Certificate</p>
            <p className="text-xs text-grey-dark mt-1">
              This certificate can be verified using the verification ID above.
              Visit <span className="text-navy font-medium">studyhub.mw/verify</span> to authenticate.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}