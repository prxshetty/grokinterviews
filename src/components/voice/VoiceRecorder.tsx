'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionReceived: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onTranscriptionReceived, 
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        
        // Notify parent component
        onRecordingComplete(audioBlob);
        
        // Send to speech-to-text API
        await transcribeAudio(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      console.log('🎤 Recording started');

    } catch (error: any) {
      console.error('❌ Failed to start recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('🛑 Recording stopped');
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      // Convert webm to wav for better compatibility
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

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
        console.log('✅ Transcription received:', result.text);
        onTranscriptionReceived(result.text);
      } else {
        throw new Error('No transcription text received');
      }

    } catch (error: any) {
      console.error('❌ Transcription error:', error);
      setError(`Transcription failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
              ? "bg-red-600 hover:bg-red-700 animate-pulse" 
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
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        {isProcessing ? (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Processing speech...
          </p>
        ) : isRecording ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Recording... Click to stop
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click to start recording
          </p>
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
