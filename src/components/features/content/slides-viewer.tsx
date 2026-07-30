'use client';

import { useState } from 'react';
import { Download, ExternalLink, Presentation, Maximize2 } from 'lucide-react';

interface SlidesViewerProps {
  provider?: string;
  url?: string;
  embedCode?: string;
  downloadUrl?: string;
  slideCount?: number;
}

export function SlidesViewer({
  provider,
  url,
  embedCode,
  downloadUrl,
  slideCount,
}: SlidesViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // If embed code is provided, render it directly (Google Slides, Canva, etc.)
  if (embedCode) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-grey-light">
        <div
          className={`w-full transition-all ${
            isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
          }`}
          dangerouslySetInnerHTML={{ __html: embedCode }}
        />

        {/* Overlay controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
              title="Download presentation"
            >
              <Download size={16} />
            </a>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {slideCount && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
            {slideCount} slides
          </div>
        )}
      </div>
    );
  }

  // If URL is provided, try to generate embed code
  if (url) {
    const isGoogleSlides = url.includes('docs.google.com/presentation');
    const isCanva = url.includes('canva.com');

    let embedSrc = '';
    let embedHeight = '480px';

    if (isGoogleSlides) {
      // Extract presentation ID from Google Slides URL
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        embedSrc = `https://docs.google.com/presentation/d/${match[1]}/embed`;
      }
    } else if (isCanva) {
      embedSrc = url.endsWith('?embed') ? url : `${url}?embed`;
    } else {
      embedSrc = url;
    }

    if (embedSrc) {
      return (
        <div className="relative rounded-xl overflow-hidden border border-grey-light">
          <iframe
            src={embedSrc}
            width="100%"
            height={embedHeight}
            frameBorder="0"
            allowFullScreen
            className="border-0"
          />

          <div className="absolute top-4 right-4 flex gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>
            {downloadUrl && (
              <a
                href={downloadUrl}
                className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
                title="Download"
              >
                <Download size={16} />
              </a>
            )}
          </div>

          {slideCount && (
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
              {slideCount} slides
            </div>
          )}
        </div>
      );
    }
  }

  // Fallback: show a placeholder
  return (
    <div className="rounded-xl border-2 border-dashed border-grey-light p-12 text-center">
      <Presentation size={48} className="mx-auto text-grey-medium mb-4" />
      <p className="text-grey-medium">
        {provider ? `${provider} presentation` : 'No slides available'}
      </p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red hover:text-red-700 mt-2 inline-block"
        >
          Open presentation ↗
        </a>
      )}
    </div>
  );
}
