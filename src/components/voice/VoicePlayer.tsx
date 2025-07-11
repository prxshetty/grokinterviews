'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoicePlayerProps {
  text: string;
  autoPlay?: boolean;
  voice?: string;
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onError?: (error: string) => void;
  onPlaybackComplete?: () => void;
}

export interface VoicePlayerRef {
  stopPlayback: () => void;
}

export const VoicePlayer = forwardRef<VoicePlayerRef, VoicePlayerProps>(({ 
  text, 
  autoPlay = false, 
  voice = 'Kore',
  className,
  onPlayStateChange,
  onError,
  onPlaybackComplete 
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const generateSpeechRef = useRef<((shouldAutoPlay?: boolean) => Promise<void>) | null>(null);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    stopPlayback: () => {
      console.log('🛑 VoicePlayer: Force stopping playback');
      
      // Stop any ongoing audio
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (error) {
          console.warn('Warning: Could not stop audio:', error);
        }
      }
      
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      // Reset states
      setIsPlaying(false);
      setIsLoading(false);
      setError(null);
      isGeneratingRef.current = false;
      
      // Clear any pending play promises
      playPromiseRef.current = null;
      
      // Notify parent
      onPlayStateChange?.(false);
      
      console.log('✅ VoicePlayer: Playback stopped successfully');
    }
  }), [audioUrl, onPlayStateChange]);

  const generateSpeech = useCallback(async (shouldAutoPlay = false) => {
    if (!text.trim() || isGeneratingRef.current) return;

    try {
      isGeneratingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log('🎤 Generating speech for:', text.substring(0, 50) + '...');

      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS request failed');
      }

      const audioBuffer = await response.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      // Create new audio element
      const audio = new Audio(url);
      audioRef.current = audio;

      // Handle audio events
      audio.onplay = () => {
        setIsPlaying(true);
        onPlayStateChange?.(true);
      };
      audio.onpause = () => {
        setIsPlaying(false);
        onPlayStateChange?.(false);
      };
      audio.onended = () => {
        setIsPlaying(false);
        onPlayStateChange?.(false);
        onPlaybackComplete?.();
        // Clean up URL to prevent memory leaks
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
      
      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
        onPlayStateChange?.(false);
      };

      // Auto-play if requested
      if (shouldAutoPlay) {
        console.log('🔊 Auto-playing generated speech...');
        try {
          // Ensure audio is ready to play
          audio.load();
          
          // Wait for audio to be ready
          await new Promise<void>((resolve, reject) => {
            audio.oncanplaythrough = () => resolve();
            audio.onerror = () => reject(new Error('Audio load failed'));
            // Fallback timeout
            setTimeout(resolve, 1000);
          });
          
          console.log('🔊 Audio ready, starting playback...');
          const playPromise = audio.play();
          playPromiseRef.current = playPromise;
          await playPromise;
          console.log('🔊 Auto-play successful!');
        } catch (playError) {
          console.error('❌ Auto-play failed:', playError);
          // Don't throw error for auto-play failures, just log them
        }
      }
      
    } catch (error) {
      console.error('❌ TTS error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  }, [text, voice, onPlayStateChange, onPlaybackComplete, onError]);

  // Update the ref whenever generateSpeech changes
  generateSpeechRef.current = generateSpeech;

  const togglePlayback = useCallback(async () => {
    if (!audioRef.current) {
      // Generate speech if not already done (manual trigger, no auto-play)
      await generateSpeech(false);
      return;
    }

    try {
      if (isPlaying) {
        // Wait for any pending play promise before pausing
        if (playPromiseRef.current) {
          try {
            await playPromiseRef.current;
          } catch {
            // Play was already interrupted, safe to continue
          }
          playPromiseRef.current = null;
        }
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        playPromiseRef.current = playPromise;
        await playPromise;
      }
    } catch {
      const errorMessage = 'Failed to play audio';
      setError(errorMessage);
      onError?.(errorMessage);
      playPromiseRef.current = null;
    }
  }, [isPlaying, generateSpeech, onError]); // Keep generateSpeech dependency for togglePlayback as it's needed

  // Auto-generate and play speech when text changes and autoPlay is enabled
  React.useEffect(() => {
    if (autoPlay && text.trim() && generateSpeechRef.current) {
      // Small delay to ensure UI updates are complete
      const timer = setTimeout(() => {
        generateSpeechRef.current!(true); // Pass true for auto-play
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Return undefined for cases where autoPlay is false or text is empty
    return undefined;
  }, [text, autoPlay]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        // Wait for any pending play promise before pausing
        if (playPromiseRef.current) {
          playPromiseRef.current.then(() => {
            if (audioRef.current) {
              audioRef.current.pause();
            }
          }).catch(() => {
            // Play was already interrupted, safe to continue
            if (audioRef.current) {
              audioRef.current.pause();
            }
          });
        } else {
          audioRef.current.pause();
        }
      }
    };
  }, [audioUrl]);

  if (!text.trim()) {
    return null;
  }

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Play/Pause Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={togglePlayback}
        disabled={isLoading}
        className={cn(
          "h-10 w-10 rounded-full",
          isPlaying && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        )}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Audio Indicator */}
      <div className="flex items-center space-x-2">
        {isPlaying ? (
          <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <VolumeX className="h-4 w-4 text-gray-400" />
        )}
        
        {/* Audio Waveform Animation */}
        {isPlaying && (
          <div className="flex items-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Text */}
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {isLoading ? 'Generating with Google Cloud TTS...' : isPlaying ? 'Playing' : 'Ready to play'}
      </span>

      {/* Error Display */}
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
});

// Fix React import
import React from 'react';

// Set display name for debugging
VoicePlayer.displayName = 'VoicePlayer';
