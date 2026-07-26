'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Calendar, BookOpen, Eye, Download, Shield } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface Certificate {
  id: string;
  title: string;
  type: 'DIGITAL' | 'PRINTED' | 'VERIFIED';
  verificationId: string;
  issuedAt: Date;
  courseTitle?: string;
  examTitle?: string;
  score?: number;
}

interface CertificateListProps {
  certificates: Certificate[];
  onView: (certificateId: string) => void;
  onDownload?: (certificateId: string) => void;
  isLoading?: boolean;
}

export function CertificateList({ certificates, onView, onDownload, isLoading }: CertificateListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} padding="lg" className="animate-pulse">
            <div className="h-40 bg-grey-light rounded-lg mb-4" />
            <div className="h-4 bg-grey-light rounded w-3/4 mb-2" />
            <div className="h-3 bg-grey-light rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-16">
        <Award size={64} className="mx-auto text-grey-medium mb-4" />
        <h3 className="text-xl font-semibold text-navy mb-2">No Certificates Yet</h3>
        <p className="text-grey-dark">Complete courses or pass exams to earn certificates.</p>
      </div>
    );
  }

  const typeStyles = {
    DIGITAL: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
    PRINTED: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600' },
    VERIFIED: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((cert) => {
        const style = typeStyles[cert.type];
        
        return (
          <Card key={cert.id} padding="lg" className={`border-2 ${style.border} ${style.bg} hover:shadow-lg transition-shadow`}>
            <div className="flex items-start justify-between mb-4">
              <Award size={32} className={style.icon} />
              <Badge variant={cert.type === 'VERIFIED' ? 'success' : cert.type === 'PRINTED' ? 'warning' : 'info'} size="sm">
                {cert.type}
              </Badge>
            </div>

            <h3 className="font-semibold text-navy mb-2">{cert.title}</h3>

            <div className="space-y-2 text-sm text-grey-dark mb-4">
              {cert.courseTitle && (
                <div className="flex items-center gap-1">
                  <BookOpen size={14} />
                  <span>{cert.courseTitle}</span>
                </div>
              )}
              {cert.examTitle && (
                <div className="flex items-center gap-1">
                  <Award size={14} />
                  <span>{cert.examTitle}</span>
                </div>
              )}
              {cert.score !== undefined && (
                <p className="font-medium text-green">Score: {cert.score}%</p>
              )}
              <div className="flex items-center gap-1 text-xs text-grey-medium">
                <Calendar size={12} />
                <span>{formatDate(cert.issuedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-grey-medium mb-4">
              <Shield size={12} />
              <span className="font-mono">{cert.verificationId}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" size="sm" fullWidth leftIcon={<Eye size={14} />} onClick={() => onView(cert.id)}>
                View
              </Button>
              {onDownload && (
                <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => onDownload(cert.id)}>
                  PDF
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}