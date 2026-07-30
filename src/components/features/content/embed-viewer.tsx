'use client';

import { useState } from 'react';
import { Download, ExternalLink, Maximize2, Link as LinkIcon } from 'lucide-react';

interface EmbedViewerProps {
  embedCode: string;
  provider?: string;
  url?: string;
  isResponsive?: boolean;
  downloadUrl?: string;
}

export function EmbedViewer({
  embedCode,
  provider,
  url,
  isResponsive = true,
  downloadUrl,
}: EmbedViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-black'
    : 'relative rounded-xl overflow-hidden border border-grey-light bg-white';

  return (
    <div className={containerClass}>
      {/* Embed content */}
      <div
        className={`w-full ${
          isResponsive ? 'aspect-video' : 'h-[480px]'
        } transition-all`}
        dangerouslySetInnerHTML={{ __html: embedCode }}
      />

      {/* Overlay controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
            title="Open original"
          >
            <ExternalLink size={16} />
          </a>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
            title="Download"
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

      {/* Provider badge */}
      {provider && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
          <LinkIcon size={12} />
          {provider}
        </div>
      )}
    </div>
  );
}
