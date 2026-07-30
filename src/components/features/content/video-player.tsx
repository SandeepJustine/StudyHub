'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({ url, poster, className, onProgress, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if the URL is a YouTube video
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  
  // Extract YouTube ID and create embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`;
      }
    }
    return url;
  };
  
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(url) : url;
  
  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // Handle time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    const progress = (currentTime / duration) * 100;
    
    setCurrentTime(currentTime);
    setProgress(progress);
    
    if (onProgress) {
      onProgress(progress);
    }
  };
  
  // Handle video end
  const handleEnded = () => {
    setIsPlaying(false);
    if (onComplete) {
      onComplete();
    }
  };
  
  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuted = !muted;
    setMuted(newMuted);
    videoRef.current.muted = newMuted;
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Show/hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // If it's a YouTube video, use an iframe
  if (isYouTube) {
    return (
      <div 
        className={`relative w-full h-full bg-black ${className || ''}`}
        ref={containerRef}
      >
        <iframe
          className="w-full h-full"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  
  // For non-YouTube videos, use the standard video player
  return (
    <div 
      className={`relative w-full h-full bg-black ${className || ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        src={url}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
      />
      
      {/* Video Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              {/* Time Display */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              
              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
