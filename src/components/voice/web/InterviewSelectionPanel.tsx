import React, { useMemo } from 'react'
import { InterviewAvatar, InterviewType } from './InterviewAvatar'
import { InterviewModeConfig } from '@/app/api/voice/types'
import TechnicalInterviewForm from './TechnicalInterviewForm'
import SystemDesignForm from './SystemDesignForm'
import BehaviorInterviewForm from './BehaviorInterviewForm'

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
}) => {
  // Memoize the callback to prevent re-renders
  const stableOnCustomConfigChange = useMemo(
    () => onCustomConfigChange || (() => {}),
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
        return <TechnicalInterviewForm {...commonProps} />
      case 'system-design':
        return <SystemDesignForm {...commonProps} />
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
    <div className="font-pp-editorial font-light flex flex-col gap-8 items-center">
      {/* Top Section: AI Avatar with Carousel */}
      <div className="flex flex-col items-center">
        <InterviewAvatar
          isInterviewActive={isInterviewActive}
          isPlayingTTS={isPlayingTTS}
          isRecordingActive={isRecordingActive}
          isSpeakingDetected={isSpeakingDetected}
          selectedType={selectedType}
          onTypeChange={onTypeChange}
        />
      </div>
      
      {/* Bottom Section: Interview Configuration Forms */}
      <div className="w-full">
        {renderInterviewForm()}
      </div>
    </div>
  );
};

export default InterviewSelectionPanel;