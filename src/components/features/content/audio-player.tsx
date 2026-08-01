'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Lock, Download, FileText } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  title?: string;
  transcript?: string;
  canDownload?: boolean;
  requiresPremium?: boolean;
  onProgress?: (progress: number) => void;
}

export function AudioPlayer({ url, title, transcript, canDownload = false, requiresPremium = false, onProgress }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [transcriptData, setTranscriptData] = useState<Array<{ time: number; text: string }>>([]);
  const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (transcriptData.length > 0) {
        const index = transcriptData.findIndex((seg, i) => {
          const nextSeg = transcriptData[i + 1];
          return audio.currentTime >= seg.time && (!nextSeg || audio.currentTime < nextSeg.time);
        });
        if (index !== -1) setCurrentTranscriptIndex(index);
      }
    };
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onProgress?.(100);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onProgress, transcriptData]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Parse transcript with timestamps
  useEffect(() => {
    if (transcript) {
      const lines = transcript.split('\n');
      const parsed: Array<{ time: number; text: string }> = [];
      
      lines.forEach(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\](.*)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          parsed.push({
            time: minutes * 60 + seconds,
            text: match[3].trim(),
          });
        } else if (line.trim()) {
          parsed.push({
            time: parsed.length > 0 ? parsed[parsed.length - 1].time + 5 : 0,
            text: line.trim(),
          });
        }
      });
      
      setTranscriptData(parsed);
    }
  }, [transcript]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const seekToTranscript = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!canDownload) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'audio.mp3';
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
          <p className="text-sm text-grey-dark mb-4">This audio is available for premium subscribers only.</p>
          <Button variant="primary">Upgrade to Premium</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />

      <div className="bg-grey-light/50 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="primary"
            size="lg"
            onClick={togglePlay}
            leftIcon={isPlaying ? <Pause size={20} /> : <Play size={20} />}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <div className="flex-1">
            <div className="flex items-center justify-between text-sm text-grey-dark mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-grey-light rounded-lg appearance-none cursor-pointer accent-navy"
            />
          </div>

          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-grey-medium" />
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="text-sm border border-grey-light rounded px-2 py-1"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canDownload && (
            <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<Download size={14} />}>
              Download
            </Button>
          )}
          {transcript && transcriptData.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              leftIcon={<FileText size={14} />}
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </Button>
          )}
        </div>
      </div>

      {/* In-Viewer Transcript */}
      {showTranscript && transcriptData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
              <FileText size={16} />
              Transcript
            </h4>
            <div 
              ref={transcriptRef}
              className="text-sm text-grey-dark space-y-2 max-h-[300px] overflow-y-auto"
            >
              {transcriptData.map((segment, index) => (
                <div
                  key={index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    index === currentTranscriptIndex
                      ? 'bg-navy/10 text-navy border-l-2 border-navy'
                      : 'hover:bg-grey-light/50'
                  }`}
                  onClick={() => seekToTranscript(segment.time)}
                >
                  <span className="text-xs font-mono text-grey-medium mr-2">
                    [{formatTime(segment.time)}]
                  </span>
                  {segment.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
