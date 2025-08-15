import React from 'react';
import { InterviewAvatar, InterviewType } from './InterviewAvatar';

interface InterviewSelectionPanelProps {
  selectedType: InterviewType;
  onTypeChange: (type: InterviewType) => void;
  isInterviewActive: boolean;
  isPlayingTTS: boolean;
  isRecordingActive: boolean;
  isSpeakingDetected: boolean;
}

export const InterviewSelectionPanel: React.FC<InterviewSelectionPanelProps> = ({
  selectedType,
  onTypeChange,
  isInterviewActive,
  isPlayingTTS,
  isRecordingActive,
  isSpeakingDetected,
}) => {
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
      
      {/* Additional info or features can go here */}
      {!isInterviewActive && (
        <div className="text-center max-w-md mt-8">
          <p className="text-muted-foreground text-sm">
            Use the arrows or indicators to switch between different interview types. 
            Configure your settings on the right and start when ready.
          </p>
        </div>
      )}
    </div>
  );
};

export default InterviewSelectionPanel;