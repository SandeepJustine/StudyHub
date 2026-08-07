'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, FileText, Lock, Crown } from 'lucide-react';
import { UpgradeBanner } from '@/components/features/subscription/upgrade-banner';

interface DocumentViewerProps {
  url: string;
  title: string;
  contentType: string;
  canDownload: boolean;
  paperId: string;
  onClose?: () => void;
}

export function DocumentViewer({ url, title, contentType, canDownload, paperId, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const isPdf = contentType === 'application/pdf';
  const isDoc = contentType.includes('word') || contentType.includes('document');

  const handleDownload = async () => {
    const link = document.createElement('a');
    link.href = `/api/past-papers/${paperId}/download`;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-grey-light">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-navy" />
            <h2 className="text-lg font-semibold text-navy truncate">{title}</h2>
            {!canDownload && (
              <Badge variant="warning" size="sm" className="ml-2">
                <Lock size={12} className="mr-1" />
                View Only
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canDownload && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download size={16} className="mr-1" />
                Download
              </Button>
            )}
            {!canDownload && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <Crown size={14} className="text-yellow-600" />
                <span className="text-xs text-yellow-800 font-medium">Upgrade to download</span>
              </div>
            )}
            {onClose && (
              <Button variant="ghost" size="xs" className="h-9 w-9 p-0" onClick={onClose}>
                <X size={20} />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden bg-grey-light">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            </div>
          )}
          {isPdf && (
            <iframe
              src={url}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title={title}
            />
          )}
          {isDoc && (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="text-center p-8">
                <FileText size={64} className="text-navy mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-navy mb-2">{title}</h3>
                <p className="text-grey-dark mb-4">Word Document</p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => window.open(url, '_blank')}>
                    View Online
                  </Button>
                  {canDownload && (
                    <Button onClick={handleDownload}>
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                  )}
                  {!canDownload && (
                    <Button onClick={() => {}} disabled>
                      <Lock size={16} className="mr-1" />
                      Premium Only
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          {!canDownload && (
            <div className="absolute bottom-4 right-4 z-20">
              <UpgradeBanner type="download" variant="inline" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
