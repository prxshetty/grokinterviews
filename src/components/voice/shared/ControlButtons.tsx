import React, { useState } from 'react';
import { Mic, Square, Settings, Zap } from 'lucide-react';
import { VoiceSettingsPanel } from './VoiceSettingsPanel';
import { VoiceOption } from './VoiceSelector';
import { cn } from '@/lib/utils';

interface ControlButtonsProps {
  isInterviewActive: boolean;
  isProcessingAI: boolean;
  rateLimited: boolean;
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  onStartInterview: () => Promise<void>;
  onEndInterview: () => void;
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
}

export default function ControlButtons({
  isInterviewActive,
  isProcessingAI,
  rateLimited,
  selectedVoice,
  onVoiceChange,
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
  onDismissRecordingError
}: ControlButtonsProps) {
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Recording Error Display */}
      {recordingError && (
        <div className="max-w-md p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-400">{recordingError}</p>
            {onDismissRecordingError && (
              <button
                onClick={onDismissRecordingError}
                className="ml-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Voice Settings Panel */}
      {showVoiceSettings && (
        <VoiceSettingsPanel
          selectedVoice={selectedVoice}
          onVoiceChange={onVoiceChange}
        />
      )}
      
      {/* Control Buttons */}
      <div className="flex items-center space-x-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 dark:border-gray-700">
      {!isInterviewActive ? (
        <button
          onClick={onStartInterview}
          disabled={isProcessingAI || rateLimited}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg"
        >
          <Mic className="w-5 h-5" />
          <span>Start Interview</span>
        </button>
      ) : (
        <button
          onClick={onEndInterview}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg"
        >
          <Square className="w-5 h-5" />
          <span>End Interview</span>
        </button>
      )}
      
      {/* Recording Toggle Button */}
      {isInterviewActive && (
        <div className="relative">
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isProcessingAI || rateLimited || isRecordingProcessing}
            className={cn(
              "flex items-center space-x-2 px-4 py-3 rounded-full font-medium transition-all duration-200 shadow-lg relative",
              isRecording
                ? isSpeaking
                  ? "bg-green-600 hover:bg-green-700 text-white animate-pulse"
                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white",
              isRecordingProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            {isRecordingProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : isRecording ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span>
              {isRecordingProcessing
                ? "Processing..."
                : isRecording
                ? isSpeaking
                  ? "Speaking..."
                  : "Listening..."
                : "Record"}
            </span>
          </button>
          
          {/* Recording indicator */}
          {isRecording && (
            <div className={cn(
              "absolute -top-1 -right-1 h-3 w-3 rounded-full animate-pulse",
              isSpeaking ? "bg-green-400" : "bg-yellow-400"
            )} />
          )}
          
          {/* VAD indicator */}
          {enableVAD && vadSupported && (
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-purple-500 rounded-full flex items-center justify-center">
              <Zap className="h-2 w-2 text-white" />
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={() => setShowVoiceSettings(!showVoiceSettings)}
        className={`flex items-center space-x-2 px-4 py-3 rounded-full font-medium transition-colors shadow-lg ${
          showVoiceSettings
            ? 'bg-orange-600 hover:bg-orange-700 text-white'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </button>
      </div>
    </div>
  );
}