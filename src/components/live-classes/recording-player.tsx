'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, X, Maximize2, Clock, User, ExternalLink } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface RecordingPlayerProps {
  id: string;
  title: string;
  subject?: string;
  instructor?: string;
  duration?: number;
  recordingUrl: string;
  scheduledAt: Date;
}

export function RecordingPlayer({
  id,
  title,
  subject,
  instructor,
  duration,
  recordingUrl,
  scheduledAt,
}: RecordingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert YouTube/Vimeo URLs to embed URLs
  const getEmbedUrl = (url: string): string => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    
    // Jitsi recordings
    if (url.includes('youtube.com') || url.includes('vimeo.com') || url.includes('meet.jit.si')) {
      return url;
    }
    
    // Direct video URL
    return url;
  };

  const embedUrl = getEmbedUrl(recordingUrl);
  const isEmbeddable = embedUrl.includes('youtube.com/embed') || embedUrl.includes('player.vimeo.com');

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-0 overflow-hidden">
        {/* Player Area */}
        <div className={`relative bg-black ${isPlaying ? 'aspect-video' : 'aspect-video'}`}>
          {isPlaying ? (
            <>
              {isEmbeddable ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={recordingUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70"
              >
                <X size={16} />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute bottom-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70"
              >
                <Maximize2 size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-navy/80 hover:bg-navy/90 transition-colors group"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red/90 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Play size={28} className="text-white ml-1" />
                </div>
                <p className="text-white font-medium">Watch Recording</p>
              </div>
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {subject && <Badge variant="info" size="sm">{subject}</Badge>}
            <Badge variant="neutral" size="sm">Recorded</Badge>
          </div>
          <h3 className="font-semibold text-navy text-sm mb-1">{title}</h3>
          <div className="flex items-center gap-3 text-xs text-grey-medium">
            {instructor && (
              <span className="flex items-center gap-1"><User size={11} />{instructor}</span>
            )}
            <span className="flex items-center gap-1"><Clock size={11} />{duration} min</span>
            <span className="flex items-center gap-1">{formatDate(scheduledAt)}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={() => setIsPlaying(true)}>
              <Play size={14} className="mr-1" /> Watch
            </Button>
            <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink size={14} className="mr-1" /> Open
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}