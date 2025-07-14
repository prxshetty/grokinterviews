'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceActivityDetector, createVAD, isVADSupported } from '@/utils/vadUtils';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionReceived: (text: string) => void;
  disabled?: boolean;
  enableVAD?: boolean; // Enable Voice Activity Detection
  autoStart?: boolean; // Automatically start recording
}

export interface VoiceRecorderRef {
  forceStop: () => void;
  pauseVAD: () => Promise<void>;
  resumeVAD: () => Promise<void>;
  checkMicrophonePermission: () => Promise<PermissionState | 'prompt'>;
  requestMicrophonePermission: () => Promise<boolean>;
}

export const VoiceRecorder = forwardRef<VoiceRecorderRef, VoiceRecorderProps>(({ 
  onRecordingComplete, 
  onTranscriptionReceived, 
  disabled = false,
  enableVAD = true,
  autoStart = false 
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vadSupported, setVadSupported] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStartRef = useRef(autoStart);

  // Keep autoStartRef updated
  useEffect(() => {
    autoStartRef.current = autoStart;
  }, [autoStart]);

  // Define permission functions before useImperativeHandle
  const checkMicrophonePermission = useCallback(async () => {
    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return permission.state;
      }
      return 'prompt'; // Fallback if permissions API not available
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return 'prompt';
    }
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we just wanted to request permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    forceStop: () => {
      console.log('🛑 VoiceRecorder: Force stopping recording');
      
      // Stop recording if active
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.warn('Warning: Could not stop MediaRecorder:', error);
        }
      }
      
      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn('Warning: Could not stop media track:', error);
          }
        });
        streamRef.current = null;
      }
      
      // Stop VAD
      if (vadRef.current) {
        try {
          vadRef.current.stop();
        } catch (error) {
          console.warn('Warning: Could not stop VAD:', error);
        }
      }
      
      // Clear timeouts
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      
      // Reset states
      setIsRecording(false);
      setIsProcessing(false);
      setIsSpeaking(false);
      setError(null);
      
      // Clear audio chunks
      audioChunksRef.current = [];
      
      console.log('✅ VoiceRecorder: Recording stopped successfully');
    },
    pauseVAD: async () => {
      console.log('⏸️ VoiceRecorder: Pausing VAD');
      if (vadRef.current) {
        try {
          await vadRef.current.pause();
        } catch (error) {
          console.warn('Warning: Could not pause VAD:', error);
        }
      }
    },
    resumeVAD: async () => {
      console.log('▶️ VoiceRecorder: Resuming VAD');
      if (vadRef.current) {
        try {
          await vadRef.current.resume();
        } catch (error) {
          console.warn('Warning: Could not resume VAD:', error);
        }
      }
    },
    checkMicrophonePermission,
    requestMicrophonePermission
  }), [isRecording, checkMicrophonePermission, requestMicrophonePermission]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      // Convert webm to wav for better compatibility
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // eslint-disable-next-line no-console
      console.log('📝 Sending audio for transcription...');

      const response = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const result = await response.json();
      
      if (result.success && result.text) {
        // eslint-disable-next-line no-console
        console.log('✅ Transcription received:', result.text);
        onTranscriptionReceived(result.text);
      } else {
        throw new Error('No transcription text received');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.error('❌ Transcription error:', error);
      setError(`Transcription failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscriptionReceived, setError, setIsProcessing]);

  // VAD callback handlers
  const handleSpeechStart = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('🗣️ VAD: Speech started');
    setIsSpeaking(true);
    // Clear any existing auto-stop timeout
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, []);

  const handleSpeechPause = useCallback(() => {
    console.log('⏸️ VAD: Speech paused - checking MediaRecorder state');
    console.log('📊 MediaRecorder state:', mediaRecorderRef.current?.state);
    setIsSpeaking(false);
    
    // Only check MediaRecorder state, not React state (which can be out of sync)
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.log('⚠️ MediaRecorder not recording, ignoring speech pause');
      return;
    }
    
    // Check if we have a minimum recording duration (at least 1 second)
    const now = Date.now();
    const minRecordingDuration = 1000; // 1 second minimum
    
    if (recordingStartTime && (now - recordingStartTime) < minRecordingDuration) {
      console.log('⚠️ Recording too short, waiting for minimum duration...');
      return;
    }
    
    // Auto-stop recording when speech detection ends (VAD is the primary controller)
    console.log('🛑 VAD stopping recording after speech pause');
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsSpeaking(false);
  }, [recordingStartTime]);

  const handleSpeechEnd = useCallback(() => {
    console.log('🤫 VAD: Speech ended after silence timeout (backup)');
    console.log('📊 MediaRecorder state:', mediaRecorderRef.current?.state);
    setIsSpeaking(false);
    
    // Only check MediaRecorder state, not React state
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.log('⚠️ MediaRecorder not recording, ignoring speech end');
      return;
    }
    
    // Backup stop - VAD timeout reached
    console.log('🛑 VAD backup: Stopping recording after silence timeout');
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsSpeaking(false);
  }, []);

  const handleVADMisfire = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('⚠️ VAD: Misfire detected');
  }, []);

  // Initialize VAD on component mount
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('🔧 VAD useEffect triggered, enableVAD:', enableVAD, 'isVADSupported:', isVADSupported());
    setVadSupported(isVADSupported());
    
    if (enableVAD && isVADSupported()) {
      // eslint-disable-next-line no-console
      console.log('🎯 Creating VAD instance...');
      vadRef.current = createVAD({
        onSpeechStart: handleSpeechStart,
        onSpeechPause: handleSpeechPause,
        onSpeechEnd: handleSpeechEnd,
        onVADMisfire: handleVADMisfire,
        // Optimized settings for interview responses
        positiveSpeechThreshold: 0.7,  // Higher threshold to avoid false positives
        negativeSpeechThreshold: 0.2,  // Lower threshold to avoid cutting off speech
        redemptionFrames: 8,            // Fewer frames for faster response
        minSpeechFrames: 4,             // Fewer frames to start faster
        preSpeechPadFrames: 1           // Less padding for faster detection
      });
      // eslint-disable-next-line no-console
      console.log('✅ VAD instance created successfully');
    } else {
      // eslint-disable-next-line no-console
      console.log('❌ VAD not enabled or not supported');
    }

    return () => {
      // Cleanup VAD on unmount
      // eslint-disable-next-line no-console
      console.log('🧹 Cleaning up VAD...');
      if (vadRef.current) {
        vadRef.current.destroy();
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
    };
  }, [enableVAD, handleSpeechStart, handleSpeechPause, handleSpeechEnd, handleVADMisfire]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      // Create MediaRecorder with Groq-compatible format
      const mediaRecorderOptions: MediaRecorderOptions = {};
      
      // Try different formats in order of preference for Groq compatibility
      // WAV is recommended by Groq for lower latency
      const supportedFormats = [
        'audio/wav',           // Recommended by Groq for lower latency
        'audio/mp4',           // Good compatibility
        'audio/mpeg',          // MP3 format
        'audio/webm',          // WebM is supported but may have issues
        'audio/ogg'            // OGG format
      ];
      
      for (const format of supportedFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mediaRecorderOptions.mimeType = format;
          console.log(`🎤 Using recording format: ${format}`);
          break;
        }
      }
      
      // Fallback to default if no supported format found
      if (!mediaRecorderOptions.mimeType) {
        console.warn('⚠️ No preferred format supported, using default');
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Store stream reference for cleanup
      streamRef.current = stream;
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderOptions.mimeType || 'audio/webm' 
        });
        
        // Reset recording state
        setRecordingStartTime(null);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Stop VAD if it's running
        if (vadRef.current) {
          await vadRef.current.stop();
        }
        
        // Check if recording is too small (likely invalid)
        if (audioBlob.size < 1000) { // Less than 1KB
          console.log('⚠️ Recording too small, skipping transcription:', audioBlob.size, 'bytes');
          setError('Recording too short. Please speak for at least 1 second.');
          return;
        }
        
        // Notify parent component
        onRecordingComplete(audioBlob);
        
        // Send to speech-to-text API
        await transcribeAudio(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      
      // Set recording state immediately after starting MediaRecorder
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      
      // Mark that we've auto-started if this was triggered by autoStart
      if (autoStartRef.current) {
        setHasAutoStarted(true);
      }
      
      console.log('🎤 MediaRecorder started, state:', mediaRecorder.state);
      
      // Start VAD if enabled and supported
      if (enableVAD && vadRef.current && vadSupported) {
        try {
          await vadRef.current.start();
          console.log('🎤 Recording started with VAD enabled');
        } catch (vadError) {
          console.warn('⚠️ VAD failed to start, continuing without it:', vadError);
          console.log('🎤 Recording started (VAD disabled)');
        }
      } else {
        console.log('🎤 Recording started (VAD disabled)');
      }

    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to start recording:', error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Microphone access denied. Please click the microphone icon in your browser\'s address bar and allow microphone access, then refresh the page.');
        } else if (error.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          setError('Microphone is being used by another application. Please close other apps using the microphone and try again.');
        } else {
          setError(`Microphone error: ${error.message}. Please check your microphone settings and try again.`);
        }
      } else {
        setError('Failed to access microphone. Please check permissions and try again.');
      }
    }
  }, [onRecordingComplete, transcribeAudio, enableVAD, vadSupported, setError]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsSpeaking(false);
      
      // Stop VAD
      if (vadRef.current) {
        await vadRef.current.stop();
      }
      
      // Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // eslint-disable-next-line no-console
      console.log('🛑 Recording stopped');
    }
  }, [isRecording]);

  // Auto-start recording when autoStart prop becomes true (but only once per autoStart cycle)
  useEffect(() => {
    if (autoStart && !isRecording && !disabled && !isProcessing && !hasAutoStarted) {
      console.log('🎤 Auto-starting recording after TTS completion');
      startRecording();
    } else if (!autoStart && hasAutoStarted) {
      // Reset the auto-start flag when autoStart becomes false
      setHasAutoStarted(false);
    }
  }, [autoStart, isRecording, disabled, isProcessing, hasAutoStarted, startRecording]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Recording Button */}
      <div className="relative">
        <div className="relative h-16 w-16">
          {/* Background behavior icon */}
          <div 
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-200 cursor-pointer",
              "bg-cover bg-center bg-no-repeat",
              isRecording 
                ? isSpeaking
                  ? "opacity-90 scale-110 animate-pulse" 
                  : "opacity-80 scale-105"
                : "opacity-70 hover:opacity-90 hover:scale-105",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
            style={{
              backgroundImage: `url('/behavior.svg')`,
              filter: isRecording 
                ? isSpeaking 
                  ? 'hue-rotate(120deg) brightness(1.2)' // Green tint when speaking
                  : 'hue-rotate(60deg) brightness(1.1)'   // Yellow tint when recording
                : 'brightness(1.0)' // Normal when idle
            }}
            onClick={disabled || isProcessing ? undefined : (isRecording ? stopRecording : startRecording)}
          />
          
          {/* Foreground icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : isRecording ? (
              <Square className="h-6 w-6 fill-current text-white drop-shadow-lg" />
            ) : (
              <Mic className="h-6 w-6 text-white drop-shadow-lg" />
            )}
          </div>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className={cn(
            "absolute -top-1 -right-1 h-4 w-4 rounded-full animate-pulse",
            isSpeaking ? "bg-green-500" : "bg-yellow-500"
          )} />
        )}
        
        {/* VAD indicator */}
        {enableVAD && vadSupported && (
          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-purple-500 rounded-full">
            <Zap className="h-2 w-2 text-white m-0.5" />
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center space-y-1">
        {isProcessing ? (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Processing speech...
          </p>
        ) : isRecording ? (
          <>
            <p className={cn(
              "text-sm font-medium",
              isSpeaking 
                ? "text-green-600 dark:text-green-400" 
                : "text-yellow-600 dark:text-yellow-400"
            )}>
              {isSpeaking ? "Speaking detected..." : "Listening for speech..."}
            </p>
            {enableVAD && vadSupported && (
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Auto-stop enabled • Will stop when you finish speaking
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to start recording
            </p>
            {enableVAD && vadSupported && (
              <p className="text-xs text-purple-600 dark:text-purple-400">
                ⚡ Smart recording with auto-stop
              </p>
            )}
            {enableVAD && !vadSupported && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                VAD not supported in this browser
              </p>
            )}
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-md p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-700"
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
});

// Set display name for debugging
VoiceRecorder.displayName = 'VoiceRecorder';
