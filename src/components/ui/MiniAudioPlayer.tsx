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

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!callId || !audioUrl) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2', className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        ) : (
          <Play className="w-4 h-4 text-gray-700 dark:text-gray-300 ml-0.5" />
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
          className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
          }}
        />
        
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatTime(duration)}
        </span>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title="Download recording"
      >
        <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
      </button>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}