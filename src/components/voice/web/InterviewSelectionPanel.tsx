import React, { useMemo } from 'react';
import { InterviewAvatar, InterviewType } from './InterviewAvatar';
import { InterviewModeConfig } from '@/app/api/voice/types';
import { InterviewFeatures } from './InterviewFeatures';

// Default objects to prevent re-renders
const DEFAULT_CUSTOM_CONFIG: InterviewModeConfig = {
  customTopics: '',
  questionFormat: '',
  difficulty: ''
};

const DEFAULT_CUSTOM_CONFIG_ERRORS: Record<string, string> = {};

interface InterviewSelectionPanelProps {
  selectedType: InterviewType;
  onTypeChange: (type: InterviewType) => void;
  isInterviewActive: boolean;
  isPlayingTTS: boolean;
  isRecordingActive: boolean;
  isSpeakingDetected: boolean;
  customConfig?: InterviewModeConfig;
  onCustomConfigChange?: (config: InterviewModeConfig) => void;
  customConfigErrors?: Record<string, string>;
}

export const InterviewSelectionPanel: React.FC<InterviewSelectionPanelProps> = ({
  selectedType,
  onTypeChange,
  isInterviewActive,
  isPlayingTTS,
  isRecordingActive,
  isSpeakingDetected,
  customConfig,
  onCustomConfigChange,
  customConfigErrors,
}) => {
  // Memoize the callback to prevent re-renders
  const stableOnCustomConfigChange = useMemo(
    () => onCustomConfigChange || (() => {}),
    [onCustomConfigChange]
  );

  // Render appropriate form based on interview type
  const renderInterviewForm = () => {
    if (isInterviewActive) return null;
    
    switch (selectedType) {
      case 'technical':
        return (
          <InterviewFeatures
            selectedType={selectedType}
            config={customConfig || DEFAULT_CUSTOM_CONFIG}
            onConfigChange={stableOnCustomConfigChange}
            errors={customConfigErrors || DEFAULT_CUSTOM_CONFIG_ERRORS}
          />
        );
      case 'system-design':
        return (
          <InterviewFeatures
            selectedType={selectedType}
            config={customConfig || DEFAULT_CUSTOM_CONFIG}
            onConfigChange={stableOnCustomConfigChange}
            errors={customConfigErrors || DEFAULT_CUSTOM_CONFIG_ERRORS}
          />
        );
      case 'behavioral':
        return (
          <InterviewFeatures
            selectedType={selectedType}
            config={customConfig || DEFAULT_CUSTOM_CONFIG}
            onConfigChange={stableOnCustomConfigChange}
            errors={customConfigErrors || DEFAULT_CUSTOM_CONFIG_ERRORS}
          />
        );
      // Commented out custom case - uncomment to restore custom interview option
      /* case 'custom':
        return (
          <InterviewFeatures
            selectedType={selectedType}
            config={customConfig || DEFAULT_CUSTOM_CONFIG}
            onConfigChange={stableOnCustomConfigChange}
            errors={customConfigErrors || DEFAULT_CUSTOM_CONFIG_ERRORS}
          />
        );
      */
      // Remove the custom case but keep the default case for safety
      default:
        return (
          <InterviewFeatures
            selectedType="behavioral"
            config={customConfig || DEFAULT_CUSTOM_CONFIG}
            onConfigChange={stableOnCustomConfigChange}
            errors={customConfigErrors || DEFAULT_CUSTOM_CONFIG_ERRORS}
          />
        );
    }
  };

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