import React, { useState } from 'react';

type InterviewType = 'behavioral' | 'technical' | 'system-design' | 'custom';

interface AvatarConfig {
  src: string;
  alt: string;
  title: string;
  description: string;
}

const avatarConfigs: Record<InterviewType, AvatarConfig> = {
  behavioral: {
    src: '/behavior.svg',
    alt: 'AI Behavioral Interview Assistant',
    title: 'Behavioral Interview',
    description: 'Practice behavioral questions and soft skills'
  },
  technical: {
    src: '/techAI.svg',
    alt: 'AI Technical Interview Assistant',
    title: 'Technical Interview',
    description: 'Practice coding and technical questions'
  },
  'system-design': {
    src: '/sdAI.svg',
    alt: 'AI System Design Interview Assistant',
    title: 'System Design Interview',
    description: 'Practice system architecture and design'
  },
  custom: {
    src: '/customAI.svg',
    alt: 'AI Custom Interview Assistant',
    title: 'Custom Interview',
    description: 'Practice custom topics and questions'
  }
};

interface InterviewAvatarProps {
  isInterviewActive: boolean;
  isPlayingTTS: boolean;
  isRecordingActive: boolean;
  isSpeakingDetected: boolean;
  selectedType?: InterviewType;
  onTypeChange?: (type: InterviewType) => void;
}

export const InterviewAvatar: React.FC<InterviewAvatarProps> = ({
  isInterviewActive,
  isPlayingTTS,
  isRecordingActive,
  isSpeakingDetected,
  selectedType = 'behavioral',
  onTypeChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(
    Object.keys(avatarConfigs).indexOf(selectedType)
  );
  
  const interviewTypes = Object.keys(avatarConfigs) as InterviewType[];
  const currentType = interviewTypes[currentIndex] || selectedType;
  const currentConfig = avatarConfigs[currentType];

  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + interviewTypes.length) % interviewTypes.length;
    setCurrentIndex(newIndex);
    const newType = interviewTypes[newIndex];
    if (newType) {
      onTypeChange?.(newType);
    }
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % interviewTypes.length;
    setCurrentIndex(newIndex);
    const newType = interviewTypes[newIndex];
    if (newType) {
      onTypeChange?.(newType);
    }
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="relative">
        {/* Carousel Navigation - Only show when interview is not active */}
        {!isInterviewActive && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-[-60px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={handleNext}
              className="absolute right-[-60px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

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
            src={currentConfig.src} 
            alt={currentConfig.alt} 
            className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain transition-all duration-300 ${
              isInterviewActive 
                ? isPlayingTTS 
                  ? '' 
                  : isRecordingActive && isSpeakingDetected 
                    ? '' 
                    : isRecordingActive 
                      ? '' 
                      : 'opacity-50'
                : ''
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

        {/* Interview Type Display removed to prevent duplication */}

        {/* Carousel Indicators - Hidden to prevent interference with names */}
      </div>
    </div>
  );
};

export default InterviewAvatar;
export type { InterviewType };