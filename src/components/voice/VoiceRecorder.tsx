'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceActivityDetector, createVAD, isVADSupported } from '@/utils/vadUtils';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionReceived: (text: string) => void;
  disabled?: boolean;
  enableVAD?: boolean; // Enable Voice Activity Detection
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onTranscriptionReceived, 
  disabled = false,
  enableVAD = true 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vadSupported, setVadSupported] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // eslint-disable-next-line no-console
    console.log('⏸️ VAD: Speech paused - checking recording state');
    // eslint-disable-next-line no-console
    console.log('📊 Current state - mediaRecorderRef:', !!mediaRecorderRef.current, 'isRecording:', isRecording);
    setIsSpeaking(false);
    // Auto-stop recording immediately when speech detection ends
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // eslint-disable-next-line no-console
      console.log('🛑 Stopping recording via VAD speech pause');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsSpeaking(false);
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠️ Cannot stop recording - mediaRecorder not in recording state');
    }
  }, [isRecording]);

  const handleSpeechEnd = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('🤫 VAD: Speech ended after silence timeout (backup)');
    // eslint-disable-next-line no-console
    console.log('📊 Backup state - mediaRecorderRef:', !!mediaRecorderRef.current, 'isRecording:', isRecording);
    // This is now a backup in case onSpeechPause didn't trigger
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // eslint-disable-next-line no-console
      console.log('🛑 Stopping recording via VAD backup timeout');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsSpeaking(false);
    }
  }, [isRecording]);

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
        onVADMisfire: handleVADMisfire
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

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Stop VAD if it's running
        if (vadRef.current) {
          await vadRef.current.stop();
        }
        
        // Notify parent component
        onRecordingComplete(audioBlob);
        
        // Send to speech-to-text API
        await transcribeAudio(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start VAD if enabled and supported
      if (enableVAD && vadRef.current && vadSupported) {
        try {
          await vadRef.current.start();
          // eslint-disable-next-line no-console
          console.log('🎤 Recording started with VAD enabled');
        } catch (vadError) {
          // eslint-disable-next-line no-console
          console.warn('⚠️ VAD failed to start, continuing without it:', vadError);
          // eslint-disable-next-line no-console
          console.log('🎤 Recording started (VAD disabled)');
        }
      } else {
        // eslint-disable-next-line no-console
        console.log('🎤 Recording started (VAD disabled)');
      }

    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to start recording:', error);
      setError('Failed to access microphone. Please check permissions.');
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
      
      // eslint-disable-next-line no-console
      console.log('🛑 Recording stopped');
    }
  }, [isRecording]);


  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Recording Button */}
      <div className="relative">
        <Button
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-200",
            isRecording 
              ? isSpeaking
                ? "bg-green-600 hover:bg-green-700 animate-pulse" 
                : "bg-yellow-600 hover:bg-yellow-700"
              : "bg-blue-600 hover:bg-blue-700",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          ) : isRecording ? (
            <Square className="h-6 w-6 fill-current" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

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
}
