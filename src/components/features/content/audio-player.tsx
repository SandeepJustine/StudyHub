'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Download,
  Music,
} from 'lucide-react';

interface AudioPlayerProps {
  url?: string;
  provider?: string;
  embedCode?: string;
  duration?: number;
  thumbnail?: string;
  transcript?: string;
  downloadUrl?: string;
  onComplete?: () => void;
}

export function AudioPlayer({
  url,
  provider,
  embedCode,
  duration,
  thumbnail,
  transcript,
  downloadUrl,
  onComplete,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);

  // If embed code is provided (SoundCloud, Spotify, etc.), render iframe
  if (embedCode) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-grey-light/20">
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: embedCode }}
        />
        {downloadUrl && (
          <a
            href={downloadUrl}
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
            title="Download audio"
          >
            <Download size={16} />
          </a>
        )}
      </div>
    );
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgress = () => {
    if (audioRef.current) {
      const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(percent);
      setCurrentTime(audioRef.current.currentTime);

      if (percent >= 95 && onComplete) {
        onComplete();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * (audioRef.current.duration || 0);
    }
  };

  const handleVolumeChange = () => {
    setMuted(!muted);
    if (audioRef.current) {
      audioRef.current.muted = !muted;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl bg-white border border-grey-light p-6">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleProgress}
        onEnded={() => {
          setIsPlaying(false);
          if (onComplete) onComplete();
        }}
        preload="metadata"
      />

      <div className="flex items-center gap-4">
        {/* Thumbnail or icon */}
        {thumbnail ? (
          <div
            className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0">
            <Music size={24} className="text-navy" />
          </div>
        )}

        <div className="flex-1">
          {/* Progress bar */}
          <div
            className="w-full h-2 bg-grey-light/50 rounded-full cursor-pointer mb-3"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-red rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-grey-light/50 rounded-lg transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime -= 10;
                }}
                className="p-1 hover:bg-grey-light/50 rounded transition-colors"
              >
                <SkipBack size={14} />
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime += 10;
                }}
                className="p-1 hover:bg-grey-light/50 rounded transition-colors"
              >
                <SkipForward size={14} />
              </button>

              <button
                onClick={handleVolumeChange}
                className="p-1 hover:bg-grey-light/50 rounded transition-colors"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <span className="text-sm text-grey-medium">
                {formatTime(currentTime)} / {formatTime(duration || 0)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {transcript && (
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-xs text-grey-medium hover:text-navy transition-colors"
                >
                  Transcript
                </button>
              )}

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  className="p-1 hover:bg-grey-light/50 rounded transition-colors"
                  title="Download audio"
                >
                  <Download size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript */}
      {showTranscript && transcript && (
        <div className="mt-4 p-4 bg-grey-light/30 rounded-lg">
          <h4 className="font-medium text-navy mb-2">Transcript</h4>
          <p className="text-sm text-grey-dark leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}
