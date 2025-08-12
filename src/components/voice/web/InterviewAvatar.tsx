import React from 'react';

interface InterviewAvatarProps {
  isInterviewActive: boolean;
  isPlayingTTS: boolean;
  isRecordingActive: boolean;
  isSpeakingDetected: boolean;
}

export const InterviewAvatar: React.FC<InterviewAvatarProps> = ({
  isInterviewActive,
  isPlayingTTS,
  isRecordingActive,
  isSpeakingDetected,
}) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative">
        {/* Main Avatar with Responsive Animations */}
        <div className={`relative transition-all duration-700 ease-in-out ${
          isInterviewActive 
            ? isPlayingTTS 
              ? 'scale-150' 
              : isRecordingActive 
                ? 'scale-130' 
                : 'scale-125'
            : 'scale-100'
        }`}>
          <img 
            src="/behavior.svg" 
            alt="AI Behavioral Interview Assistant" 
            className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain transition-all duration-300 ${
              isInterviewActive 
                ? isPlayingTTS 
                  ? '' 
                  : isRecordingActive && isSpeakingDetected 
                    ? '' 
                    : isRecordingActive 
                      ? '' 
                      : 'animate-pulse opacity-50'
                : 'animate-pulse'
            }`}
            style={{
              animationDuration: isInterviewActive && !isPlayingTTS && !isRecordingActive ? '3s' : undefined
            }}
          />
        </div>
        
        {/* Dynamic Glow Effect - Only visible during interview */}
        {isInterviewActive && (
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isPlayingTTS 
              ? 'bg-blue-400/30 blur-xl scale-125' 
              : isRecordingActive 
                ? '' 
                : 'bg-gray-400/20 blur-lg scale-100 animate-pulse'
          }`} 
          style={{
            animationDuration: !isPlayingTTS && !isRecordingActive ? '3s' : undefined
          }}
          />
        )}
        
        {/* Status Indicators - Only visible during interview */}
        {isInterviewActive && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              isPlayingTTS 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                : isRecordingActive 
                  ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {isPlayingTTS 
                ? 'Speaking...' 
                : isRecordingActive 
                  ? 'Listening...' 
                  : 'Thinking...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewAvatar;