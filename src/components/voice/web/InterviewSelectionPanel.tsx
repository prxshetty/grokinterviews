import React, { useMemo, useState, useEffect } from 'react'
import { InterviewAvatar, InterviewType } from './InterviewAvatar'
import { InterviewModeConfig } from '@/app/api/voice/types'
import TechnicalInterviewForm from './TechnicalInterviewForm'
import SystemDesignForm from './SystemDesignForm'
import BehaviorInterviewForm from './BehaviorInterviewForm'
import { VoiceSelection, type VoiceType } from '@/components/voice/VoiceSelection'

// Default objects to prevent re-renders
const DEFAULT_CUSTOM_CONFIG: InterviewModeConfig = {
  customTopics: '',
  questionFormat: '',
  difficulty: ''
};

const DEFAULT_CUSTOM_CONFIG_ERRORS: Record<string, string> = {};

interface InterviewSelectionPanelProps {
  selectedType: InterviewType
  onTypeChange: (type: InterviewType) => void
  isInterviewActive: boolean
  isPlayingTTS: boolean
  isRecordingActive: boolean
  isSpeakingDetected: boolean
  isProcessingAI: boolean
  rateLimited: boolean
  onStartInterview: () => Promise<void>
  customConfig?: InterviewModeConfig
  onCustomConfigChange?: (config: InterviewModeConfig) => void
  customConfigErrors?: Record<string, string>
  selectedVoice?: VoiceType | null
  onVoiceChange?: (voice: VoiceType) => void
}

export const InterviewSelectionPanel: React.FC<InterviewSelectionPanelProps> = ({
  selectedType,
  onTypeChange,
  isInterviewActive,
  isPlayingTTS,
  isRecordingActive,
  isSpeakingDetected,
  isProcessingAI,
  rateLimited,
  onStartInterview,
  customConfig,
  onCustomConfigChange,
  customConfigErrors,
  selectedVoice,
  onVoiceChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [previousType, setPreviousType] = useState(selectedType);

  // Track when the type changes to trigger animations
  useEffect(() => {
    if (previousType !== selectedType) {
      setPreviousType(selectedType);
      setIsVisible(false);
      const timer = setTimeout(() => setIsVisible(true), 60);
      return () => clearTimeout(timer);
    }
    return;
  }, [selectedType]);

  // Initial animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Memoize the callback to prevent re-renders
  const stableOnCustomConfigChange = useMemo(
    () => onCustomConfigChange || (() => { }),
    [onCustomConfigChange]
  );

  // Render interview configuration form based on selected type
  const renderInterviewForm = () => {
    if (isInterviewActive) return null

    const commonProps = {
      config: customConfig || DEFAULT_CUSTOM_CONFIG,
      onConfigChange: stableOnCustomConfigChange,
      errors: customConfigErrors || DEFAULT_CUSTOM_CONFIG_ERRORS,
      disabled: isInterviewActive
    } as const

    switch (selectedType) {
      case 'technical':
        return (
          <TechnicalInterviewForm
            {...commonProps}
            isInterviewActive={isInterviewActive}
            isProcessingAI={isProcessingAI}
            rateLimited={rateLimited}
            onStartInterview={onStartInterview}
          />
        )
      case 'system-design':
        return (
          <SystemDesignForm
            {...commonProps}
            isInterviewActive={isInterviewActive}
            isProcessingAI={isProcessingAI}
            rateLimited={rateLimited}
            onStartInterview={onStartInterview}
          />
        )
      case 'behavioral':
      default:
        return (
          <BehaviorInterviewForm
            {...commonProps}
            isInterviewActive={isInterviewActive}
            isProcessingAI={isProcessingAI}
            rateLimited={rateLimited}
            onStartInterview={onStartInterview}
          />
        )
    }
  }

  return (
    <div className="font-pp-editorial font-light flex flex-col gap-4 items-center w-full pt-20 md:pt-24">
      {/* Top Section: AI Avatar with Carousel */}
      <div className={`flex flex-col items-center transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
        <InterviewAvatar
          isInterviewActive={isInterviewActive}
          isPlayingTTS={isPlayingTTS}
          isRecordingActive={isRecordingActive}
          isSpeakingDetected={isSpeakingDetected}
          selectedType={selectedType}
          onTypeChange={onTypeChange}
        />
      </div>

      {/* Interview Title */}
      {!isInterviewActive && (
        <div
          key={selectedType}
          className={`transition-all duration-700 ease-out transform-gpu ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
            }`}
          style={{ transitionDelay: isVisible ? '150ms' : '0ms' }}>
          <h2 className="font-editorial font-light text-3xl md:text-4xl text-center mt-2 transform">
            {(() => {
              switch (selectedType) {
                case 'technical':
                  return 'Technical Interview'
                case 'system-design':
                  return 'System Design Interview'
                case 'behavioral':
                default:
                  return 'Behavioral Interview'
              }
            })()}
          </h2>
        </div>
      )}

      {/* Bottom Section: Interview Configuration Forms */}
      <div className={`w-full transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: isVisible ? '200ms' : '0ms' }}>
        {renderInterviewForm()}

        {/* Voice Selection - shown when not in active interview */}
        {!isInterviewActive && onVoiceChange && (
          <div className="mt-6">
            <VoiceSelection
              selectedVoice={selectedVoice || null}
              onVoiceChange={onVoiceChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSelectionPanel;