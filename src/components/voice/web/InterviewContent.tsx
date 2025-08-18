'use client';

import React, { useCallback } from 'react';
import VoiceRecorderHeadless, { type VoiceRecorderHeadlessRef } from './VoiceRecorderHeadless';
import { VoicePlayer, type VoicePlayerRef } from '@/components/voice/shared/VoicePlayer';
import { RecentTranscriptDisplay } from '@/components/voice/shared';
import ErrorDisplay from './ErrorDisplay';
import InterviewReport from './InterviewReport';
import { type VoiceOption } from '@/types';
import { type TerminationReason } from '@/services/interviewService';

interface InterviewContentProps {
  // Session state
  sessionId: string | null;
  isActive: boolean;
  isCompleted: boolean;
  currentQuestion: string;
  conversationHistory: Array<{type: 'ai' | 'user', text: string}>;
  interviewReport: any;
  
  // Voice state
  voiceState: {
    isRecordingActive: boolean;
    isSpeakingDetected: boolean;
    isPlayingTTS: boolean;
    isProcessingAI: boolean;
    shouldAutoStartRecording: boolean;
    aiResponseKey: number;
    recordingError: string | null;
    ttsError: string | null;
    vadSupported: boolean;
  };
  
  // Rate limit state
  rateLimitState: {
    isRateLimited: boolean;
    rateLimitMessage: string;
  };
  
  // Transcript data
  allTranscripts: Array<{
    id: string;
    session_id: string;
    transcript_text: string;
    interaction_type: 'user_response' | 'ai_response';
    created_at: string;
    conversation_order: number;
  }>;
  isLoadingTranscripts: boolean;
  showChat: boolean;
  
  // Voice settings
  selectedVoice: VoiceOption;
  micEnabled: boolean; // New prop for microphone toggle
  
  // Refs for external control
  voicePlayerRef: React.RefObject<VoicePlayerRef | null>;
  voiceRecorderRef: React.RefObject<VoiceRecorderHeadlessRef | null>;
  voicePageVisualizerRef: React.RefObject<any>;
  
  // Event handlers
  onTranscriptionReceived: (text: string) => Promise<void>;
  onRecordingStateChange: (isRecording: boolean, isSpeaking: boolean) => void;
  onRecordingError: (error: any) => void;
  onTtsError: (error: any) => void;
  onDismissRecordingError: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onAudioData: (audioData: Float32Array) => void;
  onPlaybackComplete: () => void;
  onTerminateInterview: (reason: TerminationReason) => Promise<void>;
  
  // State setters
  setAutoStartRecording: (value: boolean) => void;
  setSessionActive: (value: boolean) => void;
}

export default function InterviewContent({
  isActive,
  isCompleted,
  currentQuestion,
  interviewReport,
  voiceState,
  rateLimitState,
  allTranscripts,
  isLoadingTranscripts,
  showChat,
  selectedVoice,
  micEnabled,
  voicePlayerRef,
  voiceRecorderRef,
  onTranscriptionReceived,
  onRecordingStateChange,
  onRecordingError,
  onTtsError,
  onDismissRecordingError,
  onPlayStateChange,
  onAudioData,
  onPlaybackComplete,
  onTerminateInterview,
  setAutoStartRecording,
  setSessionActive,
}: InterviewContentProps) {
  
  // Handle recording completion
  const handleRecordingComplete = useCallback((_audioBlob: Blob) => {
    setAutoStartRecording(false);
  }, [setAutoStartRecording]);

  // Handle transcription with automatic interview start
  const handleTranscriptionReceived = useCallback(async (text: string) => {
    // Automatically start interview when user first responds
    if (!isActive) {
      setSessionActive(true);
    }
    
    await onTranscriptionReceived(text);
  }, [isActive, setSessionActive, onTranscriptionReceived]);

  // Enhanced error handling with interview termination
  const handleRecordingError = useCallback((error: any) => {
    onRecordingError(error);
    
    // Check for critical errors that should terminate the interview
    const errorMessage = error?.toString().toLowerCase() || '';
    
    if (errorMessage.includes('microphone') || 
        errorMessage.includes('permission') || 
        errorMessage.includes('not allowed') ||
        errorMessage.includes('access denied')) {
      onTerminateInterview({
        type: 'microphone_error',
        message: 'Interview terminated due to microphone access issues',
        details: error
      });
    } else if (errorMessage.includes('network') || 
              errorMessage.includes('connection') ||
              errorMessage.includes('timeout')) {
      onTerminateInterview({
        type: 'network_error',
        message: 'Interview terminated due to network connectivity issues',
        details: error
      });
    } else if (errorMessage.includes('rate limit') || 
              errorMessage.includes('429') ||
              errorMessage.includes('quota')) {
      onTerminateInterview({
        type: 'rate_limit',
        message: 'Interview terminated due to service rate limits',
        details: error
      });
    }
  }, [onRecordingError, onTerminateInterview]);

  // Enhanced TTS error handling
  const handleTtsError = useCallback((error: any) => {
    onTtsError(error);
    
    const errorMessage = error?.toString() || '';
    const isRateLimitError = errorMessage.includes('rate limit') || 
                           errorMessage.includes('429') || 
                           errorMessage.includes('Rate limit exceeded');
    
    if (isRateLimitError && isActive) {
      onTerminateInterview({
        type: 'rate_limit',
        message: 'Interview terminated due to TTS service rate limits',
        details: error
      });
    }
  }, [onTtsError, isActive, onTerminateInterview]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Error Display */}
      <ErrorDisplay
        ttsError={voiceState.ttsError}
        recordingError={voiceState.recordingError}
        rateLimited={rateLimitState.isRateLimited}
        rateLimitMessage={rateLimitState.rateLimitMessage}
        onDismissRecordingError={onDismissRecordingError}
      />

      {/* Headless Voice Recorder */}
      <VoiceRecorderHeadless
        ref={voiceRecorderRef}
        onRecordingComplete={handleRecordingComplete}
        onTranscriptionReceived={handleTranscriptionReceived}
        onRecordingStateChange={onRecordingStateChange}
        onError={handleRecordingError}
        disabled={voiceState.isProcessingAI || rateLimitState.isRateLimited}
        enableVAD={isActive && !isCompleted}
        micEnabled={micEnabled}
        autoStart={voiceState.shouldAutoStartRecording && !rateLimitState.isRateLimited}
      />

      {/* Interview Content */}
      <div className="space-y-6">
        {/* Hidden VoicePlayer for audio functionality */}
        <div className="hidden">
          <VoicePlayer 
            ref={voicePlayerRef}
            key={voiceState.aiResponseKey}
            text={currentQuestion} 
            voice={selectedVoice}
            autoPlay={isActive && !isCompleted && !voiceState.isProcessingAI && !rateLimitState.isRateLimited}
            onPlayStateChange={onPlayStateChange}
            onAudioData={onAudioData}
            onError={handleTtsError}
            onPlaybackComplete={onPlaybackComplete}
          />
        </div>

        {/* Recent Transcript Display */}
        <RecentTranscriptDisplay 
          allTranscripts={allTranscripts}
          isLoadingTranscripts={isLoadingTranscripts}
          isInterviewActive={isActive}
          showChat={showChat}
          selectedVoice={selectedVoice}
        />
      </div>

      {/* Interview Report */}
      {isCompleted && interviewReport && (
        <div className="mt-8">
          <InterviewReport report={interviewReport} />
        </div>
      )}
      
      {/* Debug: Show completion state */}
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-50">
        isCompleted: {isCompleted.toString()}, hasReport: {!!interviewReport}
      </div>
    </div>
  );
}