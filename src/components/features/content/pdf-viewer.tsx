'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface PDFViewerProps {
  url?: string;
  downloadUrl?: string;
  embedUrl?: string;
  pageCount?: number;
}

export function PDFViewer({ url, downloadUrl, embedUrl, pageCount }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(pageCount || 1);
  const [loading, setLoading] = useState(true);

  // If an embed URL is provided, use the browser's built-in PDF viewer
  if (embedUrl || url) {
    const pdfSrc = embedUrl || url!;

    return (
      <div className="rounded-xl overflow-hidden border border-grey-light bg-grey-light/30">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-white border-b border-grey-light">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:bg-grey-light/50 rounded transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm text-grey-medium">
              Page {currentPage} of {numPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1 hover:bg-grey-light/50 rounded transition-colors disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-1 hover:bg-grey-light/50 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>

            <span className="text-sm text-grey-medium">{Math.round(scale * 100)}%</span>

            <button
              onClick={() => setScale(Math.min(2, scale + 0.1))}
              className="p-1 hover:bg-grey-light/50 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>

            {(downloadUrl || url) && (
              <a
                href={downloadUrl || url}
                download
                className="p-1 hover:bg-grey-light/50 rounded transition-colors"
                title="Download PDF"
              >
                <Download size={18} />
              </a>
            )}
          </div>
        </div>

        {/* PDF embed */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-grey-light/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
          )}
          <embed
            src={`${pdfSrc}#page=${currentPage}&zoom=${Math.round(scale * 100)}`}
            type="application/pdf"
            width="100%"
            height="600px"
            onLoad={() => setLoading(false)}
            onLoadStart={() => setLoading(true)}
          />
        </div>
      </div>
    );
  }

  // Fallback if no URL
  return (
    <div className="rounded-xl border-2 border-dashed border-grey-light p-12 text-center">
      <FileText size={48} className="mx-auto text-grey-medium mb-4" />
      <p className="text-grey-medium">No PDF file available</p>
    </div>
  );
}
