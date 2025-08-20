'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download } from 'lucide-react';
import { VapiService } from '@/services/VapiService';
import { cn } from '@/lib/utils';

interface MiniAudioPlayerProps {
  callId: string | null;
  className?: string;
}

export function MiniAudioPlayer({ callId, className }: MiniAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Removed isDeleting state as delete functionality was removed
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!callId) {
      setAudioUrl(null);
      return;
    }

    const fetchAudioUrl = async () => {
      try {
        setIsLoading(true);
        const vapiService = new VapiService();
        const result = await vapiService.getCallRecordings(callId);
        
        if (result.success && result.recordings) {
          const url = result.recordings.mono?.combinedUrl || 
                     result.recordings.stereoUrl;
          setAudioUrl(url || null);
        } else {
          setAudioUrl(null);
        }
      } catch (err) {
        console.error('Error fetching audio URL:', err);
        setAudioUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudioUrl();
  }, [callId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    let animationFrameId: number | undefined;

    const updateProgress = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
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

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `interview-recording-${callId}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Delete functionality removed to avoid overhead and complexity
  // const handleDelete = async () => { ... };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!callId) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 bg-transparent rounded-lg px-3 py-2', className)}>
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading || !audioUrl}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 group"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
        ) : (
          <Play className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-colors ml-0.5" />
        )}
      </button>

      {/* Progress Scrubber */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatTime(currentTime)}
        </span>
        
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={isLoading || !audioUrl}
          className="flex-1 h-1 bg-transparent rounded-lg appearance-none cursor-pointer slider"
          style={{ '--progress': `${(duration > 0 ? (currentTime / duration) * 100 : 0)}%` } as React.CSSProperties}
        />
        
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatTime(duration)}
        </span>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isLoading || !audioUrl}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
        title="Download recording"
      >
        <Download className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
      </button>

      {/* Delete button removed to avoid overhead and complexity */}

      <style jsx>{`
        .slider {
          background: linear-gradient(to right, hsl(var(--foreground)) 0%, hsl(var(--foreground)) var(--progress), hsl(var(--muted)) var(--progress), hsl(var(--muted)) 100%);
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: hsl(var(--foreground));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: hsl(var(--foreground));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
