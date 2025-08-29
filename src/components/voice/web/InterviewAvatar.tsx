import React, { useState } from 'react';
import Image from 'next/image';

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

// Filter out 'custom' from available interview types
// Uncomment the line below to restore custom interview option
// const interviewTypes: InterviewType[] = ['behavioral', 'technical', 'system-design', 'custom'];

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Filter out the custom interview type as it's still in progress
  const interviewTypes = Object.keys(avatarConfigs).filter(type => type !== 'custom') as InterviewType[];
  // Uncomment the line below and remove the line above to restore custom interview option
  // const interviewTypes = ['behavioral', 'technical', 'system-design', 'custom'] as InterviewType[];
  
  const currentType = interviewTypes[currentIndex] || selectedType;
  const currentConfig = avatarConfigs[currentType];

  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      const newIndex = (currentIndex - 1 + interviewTypes.length) % interviewTypes.length;
      setCurrentIndex(newIndex);
      const newType = interviewTypes[newIndex];
      if (newType) {
        onTypeChange?.(newType);
      }
      setTimeout(() => setIsTransitioning(false), 100);
    }, 150);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      const newIndex = (currentIndex + 1) % interviewTypes.length;
      setCurrentIndex(newIndex);
      const newType = interviewTypes[newIndex];
      if (newType) {
        onTypeChange?.(newType);
      }
      setTimeout(() => setIsTransitioning(false), 100);
    }, 150);
  };

  return (
    <div className="flex justify-center mb-4 pt-4">
      <div className="relative">
        {/* Carousel Navigation - Only show when interview is not active */}
        {!isInterviewActive && (
          <>
            <button
              onClick={handlePrevious}
              disabled={isTransitioning}
              className={`absolute left-[-80px] md:left-[-160px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center border-none bg-transparent hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95 ${
                isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={handleNext}
              disabled={isTransitioning}
              className={`absolute right-[-80px] md:right-[-160px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center border-none bg-transparent hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95 ${
                isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
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
          <div className={`transition-all duration-300 ease-out ${
            isTransitioning 
              ? 'opacity-0 scale-75 rotate-12' 
              : 'opacity-100 scale-100 rotate-0'
          }`}>
            <Image 
              src={currentConfig.src} 
              alt={currentConfig.alt} 
              width={240}
              height={240}
              loading="eager"
              priority
              sizes="(max-width: 768px) 160px, (max-width: 1024px) 208px, 240px"
              className={`w-40 h-40 md:w-52 md:h-52 lg:w-60 lg:h-60 object-contain transition-all duration-300 ${
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