'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { VoiceOption } from '@/types/voice.types';
import { type AIConfig } from '@/utils/ai-config-storage';

interface VoicePlayerProps {
  text: string;
  autoPlay?: boolean;
  voice?: VoiceOption;
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onError?: (error: string) => void;
  onPlaybackComplete?: () => void;
  onAudioData?: (audioData: Float32Array) => void;
  aiConfig?: AIConfig | null;
}

export interface VoicePlayerRef {
  stopPlayback: () => void;
  getAudioElement: () => HTMLAudioElement | null;
}

export const VoicePlayer = forwardRef<VoicePlayerRef, VoicePlayerProps>(({
  text,
  autoPlay = false,
  voice = 'Kore',
  className,
  onPlayStateChange,
  onError,
  onPlaybackComplete,
  onAudioData,
  aiConfig
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const generateSpeechRef = useRef<((shouldAutoPlay?: boolean) => Promise<void>) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    stopPlayback: () => {
      console.log('🛑 VoicePlayer: Force stopping playback');

      // Stop audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop any ongoing audio
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (error) {
          console.warn('Warning: Could not stop audio:', error);
        }
      }

      // Clean up Web Audio API
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;

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
    },
    getAudioElement: () => audioRef.current
  }), [audioUrl, onPlayStateChange]);

  // Setup audio analysis
  const setupAudioAnalysis = useCallback((audio: HTMLAudioElement) => {
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Resume audio context if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create analyser node if it doesn't exist
      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 128; // 64 frequency bins
        analyserRef.current.smoothingTimeConstant = 0.8;
      }

      // Create source node if it doesn't exist
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);
      }

      // Start audio analysis loop
      const analyseAudio = () => {
        if (!analyserRef.current) {
          return;
        }

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        analyserRef.current.getFloatFrequencyData(dataArray);

        // Convert decibel values to 0-1 range for visualization
        const normalizedData = new Float32Array(bufferLength);
        for (let i = 0; i < bufferLength; i++) {
          // Convert from dB (-100 to 0) to 0-1 range
          normalizedData[i] = Math.max(0, ((dataArray[i] || -100) + 100) / 100);
        }

        onAudioData?.(normalizedData);

        if (audioRef.current && !audioRef.current.paused) {
          animationFrameRef.current = requestAnimationFrame(analyseAudio);
        }
      };

      // Start analysis when audio plays
      audio.addEventListener('play', () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        analyseAudio();
      });

      // Stop analysis when audio pauses or ends
      const stopAnalysis = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      audio.addEventListener('pause', stopAnalysis);
      audio.addEventListener('ended', stopAnalysis);

    } catch {
      // Failed to setup audio analysis
    }
  }, [onAudioData]);

  const generateSpeech = useCallback(async (shouldAutoPlay = false) => {
    if (!text.trim() || isGeneratingRef.current) return;

    if (!aiConfig?.apiKey) {
      const errorMessage = 'OpenAI API key required. Please configure your API key in Account Settings.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    try {
      isGeneratingRef.current = true;
      setIsLoading(true);
      setError(null);

      console.log(`🎤 Generating speech with OpenAI TTS for:`, text.substring(0, 50) + '...');

      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice, apiKey: aiConfig.apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS request failed');
      }

      const audioBuffer = await response.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);

      // Wait for the audio element to be created in the DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      const audio = audioRef.current;
      if (!audio) {
        throw new Error('Audio element not available');
      }

      // Setup audio analysis for real-time visualization
      if (onAudioData) {
        setupAudioAnalysis(audio);
      }

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
        // Auto-playing generated speech
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

          // Audio ready, starting playback
          const playPromise = audio.play();
          playPromiseRef.current = playPromise;
          await playPromise;
          // Auto-play successful
        } catch {
          // Auto-play failed - don't throw error for auto-play failures
        }
      }

    } catch (error) {
      // TTS error occurred
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  }, [text, voice, onPlayStateChange, onPlaybackComplete, onError, onAudioData, setupAudioAnalysis, aiConfig]);

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
    const currentAudio = audioRef.current;
    const currentUrl = audioUrl;

    return () => {
      // Stop audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clean up Web Audio API
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      if (currentAudio) {
        // Wait for any pending play promise before pausing
        if (playPromiseRef.current) {
          playPromiseRef.current.then(() => {
            if (currentAudio) {
              currentAudio.pause();
            }
          }).catch(() => {
            // Play was already interrupted, safe to continue
            if (currentAudio) {
              currentAudio.pause();
            }
          });
        } else {
          currentAudio.pause();
        }
      }
    };
  }, [audioUrl]);

  if (!text.trim()) {
    return null;
  }

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Hidden audio element for proper audio output */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}

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
          <InlineLoadingSpinner size="sm" />
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
        {isLoading ? 'Generating with OpenAI TTS...' : isPlaying ? 'Playing' : 'Ready to play'}
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
