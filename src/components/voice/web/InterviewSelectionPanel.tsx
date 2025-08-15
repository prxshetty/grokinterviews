import React, { useMemo } from 'react';
import { InterviewAvatar, InterviewType } from './InterviewAvatar';
import { InterviewFeatures } from './InterviewFeatures';
import { InterviewModeConfig } from '@/app/api/voice/types';

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
  return (
    <div className="flex flex-col items-center">
      {/* AI Avatar with Carousel */}
      <InterviewAvatar
        isInterviewActive={isInterviewActive}
        isPlayingTTS={isPlayingTTS}
        isRecordingActive={isRecordingActive}
        isSpeakingDetected={isSpeakingDetected}
        selectedType={selectedType}
        onTypeChange={onTypeChange}
      />
      
      {/* Interview Features positioned below Avatar */}
        {!isInterviewActive && (
          <div className="w-full mt-8">
            <InterviewFeatures
              selectedType={selectedType}
              customConfig={customConfig || DEFAULT_CUSTOM_CONFIG}
              onCustomConfigChange={stableOnCustomConfigChange}
              customConfigErrors={customConfigErrors || DEFAULT_CUSTOM_CONFIG_ERRORS}
            />
          </div>
        )}
    </div>
  );
};

export default InterviewSelectionPanel;