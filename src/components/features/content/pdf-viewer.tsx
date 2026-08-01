'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Lock, FileText } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  title?: string;
  canDownload?: boolean;
  requiresPremium?: boolean;
  onClose?: () => void;
}

export function PDFViewer({ url, title, canDownload = false, requiresPremium = false, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // For demo purposes, use a placeholder
    // In production, this would be the actual PDF URL
    setTimeout(() => {
      setIsLoading(false);
      setTotalPages(5); // Mock page count
    }, 1000);
  }, [url]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    if (!canDownload) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (requiresPremium) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <Lock size={48} className="mx-auto text-grey-medium mb-4" />
          <h3 className="text-lg font-semibold text-navy mb-2">Premium Content</h3>
          <p className="text-sm text-grey-dark mb-4">
            This PDF is available for premium subscribers only.
          </p>
          <Button variant="primary">Upgrade to Premium</Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <FileText size={48} className="mx-auto text-red mb-4" />
          <h3 className="text-lg font-semibold text-navy mb-2">Failed to load PDF</h3>
          <p className="text-sm text-grey-dark">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-grey-light">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} leftIcon={<ChevronLeft size={16} />}>
              Back
            </Button>
          )}
          <span className="font-medium text-navy truncate max-w-[200px]">{title || 'PDF Viewer'}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-grey-light rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut size={16} />
            </Button>
            <span className="text-xs text-grey-dark px-2 min-w-[60px] text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn size={16} />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!canDownload}
            title={canDownload ? 'Download PDF' : 'Download not available'}
          >
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* PDF Container */}
      <div className="bg-grey-light rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-grey-dark">Loading PDF...</p>
            </div>
          </div>
        ) : (
          <div className="relative h-[600px]">
            {/* In production, use react-pdf or pdf.js */}
            <iframe
              ref={iframeRef}
              src={`${url}#page=${currentPage}&zoom=${zoom}`}
              className="w-full h-full"
              title={title || 'PDF Viewer'}
            />
            
            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-lg p-2 flex items-center gap-2 shadow-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-navy">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-sm text-grey-medium">
        <p>PDF Viewer - Zoom: {zoom}%</p>
        {canDownload && (
          <Badge variant="success" size="sm">Downloadable</Badge>
        )}
      </div>
    </div>
  );
}
