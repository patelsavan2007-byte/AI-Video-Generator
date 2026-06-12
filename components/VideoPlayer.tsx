"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX, Download } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoPlayer({ src, poster, className = "" }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const pct = x / bounds.width;
      videoRef.current.currentTime = pct * videoRef.current.duration;
      setProgress(pct * 100);
    }
  };

  // Add the API base URL to media sources when in browser to ensure they hit the rewrite
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const mediaUrl = src.startsWith('http') ? src : `${baseUrl}${src}`;
  const posterUrl = poster ? (poster.startsWith('http') ? poster : `${baseUrl}${poster}`) : undefined;

  return (
    <div ref={containerRef} className={`relative group w-full aspect-video bg-black flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={mediaUrl}
        poster={posterUrl}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        loop
        playsInline
      />
      
      {/* Play Overlay (shows when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="bg-brand-500/80 rounded-full p-4 backdrop-blur-sm transform transition-transform group-hover:scale-110">
            <Play className="h-8 w-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <div 
          className="h-1.5 w-full bg-white/30 rounded-full mb-4 cursor-pointer hover:h-2 transition-all group/progress"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-brand-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transform translate-x-1/2 shadow" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-brand-400 transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-brand-400 transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href={mediaUrl} 
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-brand-400 transition-colors"
              title="Download video"
            >
              <Download className="h-5 w-5" />
            </a>
            <button onClick={toggleFullscreen} className="text-white hover:text-brand-400 transition-colors">
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
