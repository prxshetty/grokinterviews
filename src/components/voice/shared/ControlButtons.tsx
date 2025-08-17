import React from 'react';
import { Mic, Square, MessageCircle, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom Play Icon Component
const PlayIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 12 12" className={className}>
    <path fill="currentColor" d="M4.496 1.994A1 1 0 0 0 3 2.862v6.277a1 1 0 0 0 1.496.868l5.492-3.139a1 1 0 0 0 0-1.736L4.496 1.994Z"/>
  </svg>
);

// Custom Stop Icon Component - Clean and minimalistic
const StopIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
  </svg>
);

interface ControlButtonsProps {
  isInterviewActive: boolean;
  isProcessingAI: boolean;
  rateLimited: boolean;
  selectedInterviewType?: string;
  onStartInterview: () => Promise<void>;
  onEndInterview: () => Promise<void>;
  // Recording functionality
  isRecording?: boolean;
  isSpeaking?: boolean;
  isRecordingProcessing?: boolean;
  enableVAD?: boolean;
  vadSupported?: boolean;
  onStartRecording?: () => Promise<void>;
  onStopRecording?: () => Promise<void>;
  recordingError?: string | null;
  onDismissRecordingError?: () => void;
  // Chat toggle functionality
  showChat?: boolean;
  onToggleChat?: () => void;
}

export default function ControlButtons({
  isInterviewActive,
  isProcessingAI,
  rateLimited,
  selectedInterviewType,
  onStartInterview,
  onEndInterview,
  // Recording functionality
  isRecording = false,
  isSpeaking = false,
  isRecordingProcessing = false,
  enableVAD = true,
  vadSupported = false,
  onStartRecording,
  onStopRecording,
  recordingError,
  onDismissRecordingError,
  // Chat toggle functionality
  showChat = true,
  onToggleChat
}: ControlButtonsProps) {

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Recording Error Display */}
      {recordingError && (
        <div className="max-w-md p-4 backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-100">{recordingError}</p>
            {onDismissRecordingError && (
              <button
                onClick={onDismissRecordingError}
                className="ml-2 text-red-200 hover:text-red-100 text-sm font-medium"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons - Individual Spacing */}
      <div className="flex items-center justify-center space-x-8">
        {!isInterviewActive ? (
          <div className="relative">
            {selectedInterviewType === 'custom' ? (
              <div className="px-6 py-3 backdrop-blur-xl bg-gray-200/40 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 text-gray-700 dark:text-white rounded-full transition-all duration-300 shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-medium">Coming Soon</div>
                </div>
              </div>
            ) : (
              <button
                onClick={onStartInterview}
                disabled={isProcessingAI || rateLimited}
                className="w-16 h-16 backdrop-blur-xl bg-gray-200/40 hover:bg-gray-200/60 disabled:bg-gray-300/50 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-300/50 dark:border-white/20 text-gray-700 dark:text-white rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center group hover:scale-105"
                title="Start Interview"
              >
                <PlayIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={onEndInterview}
              className="w-16 h-16 backdrop-blur-xl bg-red-500/20 hover:bg-red-500/30 dark:bg-red-500/20 dark:hover:bg-red-500/30 border border-red-500/40 dark:border-red-500/40 text-red-600 dark:text-red-400 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center group hover:scale-105"
              title="End Interview"
            >
              <StopIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
        
        {/* Recording Toggle Button */}
        {isInterviewActive && (
          <div className="relative">
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isProcessingAI || rateLimited || isRecordingProcessing}
              className={cn(
                "w-16 h-16 backdrop-blur-xl bg-gray-200/40 hover:bg-gray-200/60 disabled:bg-gray-300/50 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-300/50 dark:border-white/20 text-gray-700 dark:text-white rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center group relative hover:scale-105",
                isRecordingProcessing && "opacity-50 cursor-not-allowed"
              )}
              title={
                isRecordingProcessing
                  ? "Processing..."
                  : isRecording
                  ? isSpeaking
                    ? "Speaking..."
                    : "Listening..."
                  : "Record"
              }
            >
              {isRecordingProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <Square className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              ) : (
                <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
              )}
            </button>
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full animate-pulse border-2 border-gray-400/60 dark:border-white/50 backdrop-blur-sm bg-gray-200/40 dark:bg-white/20" />
            )}
            
            {/* VAD indicator */}
            {enableVAD && vadSupported && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-gray-200/40 dark:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-gray-400/60 dark:border-white/50">
                <Zap className="h-2.5 w-2.5 text-gray-700 dark:text-white" />
              </div>
            )}
          </div>
        )}
        
        {/* Chat Toggle Button */}
        {isInterviewActive && onToggleChat && (
          <div className="relative">
            <button
              onClick={onToggleChat}
              className={cn(
                "w-16 h-16 backdrop-blur-xl border rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center group hover:scale-105",
                showChat
                  ? 'bg-gray-300/60 hover:bg-gray-300/80 dark:bg-white/20 dark:hover:bg-white/30 border-gray-400/60 dark:border-white/30 text-gray-700 dark:text-white'
                  : 'bg-gray-200/40 hover:bg-gray-200/60 dark:bg-white/10 dark:hover:bg-white/20 border-gray-300/50 dark:border-white/20 text-gray-600 dark:text-white/70 hover:text-gray-700 dark:hover:text-white'
              )}
              title={showChat ? 'Hide Chat' : 'Show Chat'}
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}