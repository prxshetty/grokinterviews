import React from 'react';
import { InterviewType } from './InterviewAvatar';
import TechnicalInterviewForm from './TechnicalInterviewForm';
import SystemDesignForm from './SystemDesignForm';
import { InterviewModeConfig } from '@/app/api/voice/types';

interface InterviewConfigPanelProps {
  selectedType: InterviewType;
  config: InterviewModeConfig;
  onConfigChange: (config: InterviewModeConfig) => void;
  errors: Record<string, string>;
  isInterviewActive: boolean;
  isProcessingAI: boolean;
  rateLimited: boolean;
}

const getBehavioralDefaults = (): InterviewModeConfig => ({
  customTopics: 'Leadership, teamwork, problem-solving, conflict resolution, adaptability, communication skills, time management, decision-making under pressure',
  questionFormat: 'Open-ended Discussion',
  difficulty: 'Medium'
});

const getTechnicalDefaults = (): InterviewModeConfig => ({
  customTopics: 'Data structures, algorithms, system design, coding best practices, debugging, performance optimization, software architecture',
  questionFormat: 'Coding Challenges',
  difficulty: 'Medium'
});

const getSystemDesignDefaults = (): InterviewModeConfig => ({
  customTopics: 'Scalable systems, database design, microservices, load balancing, caching strategies, API design, distributed systems',
  questionFormat: 'Case Studies',
  difficulty: 'Hard'
});

export const InterviewConfigPanel: React.FC<InterviewConfigPanelProps> = ({
  selectedType,
  config,
  onConfigChange,
  errors,
  rateLimited,
}) => {
  // Use a ref to track the previous type to avoid infinite loops
  const prevTypeRef = React.useRef<InterviewType | null>(null);
  
  // Set defaults when interview type changes
  React.useEffect(() => {
    // Only update if the type actually changed
    if (prevTypeRef.current === selectedType) {
      return;
    }
    
    prevTypeRef.current = selectedType;
    
    let defaults: InterviewModeConfig;
    
    switch (selectedType) {
      case 'behavioral':
        defaults = getBehavioralDefaults();
        break;
      case 'technical':
        defaults = getTechnicalDefaults();
        break;
      case 'system-design':
        defaults = getSystemDesignDefaults();
        break;
      case 'custom':
        defaults = { customTopics: '', questionFormat: '', difficulty: '' };
        break;
      default:
        defaults = getBehavioralDefaults();
    }
    
    onConfigChange(defaults);
  }, [selectedType]); // Remove onConfigChange from deps

  const getTitle = () => {
    switch (selectedType) {
      case 'behavioral':
        return 'Behavioral Interview Configuration';
      case 'technical':
        return 'Technical Interview Configuration';
      case 'system-design':
        return 'System Design Interview Configuration';
      case 'custom':
        return 'Custom Interview Configuration';
      default:
        return 'Interview Configuration';
    }
  };

  const getDescription = () => {
    switch (selectedType) {
      case 'behavioral':
        return 'Practice common behavioral questions focusing on your experiences, leadership, and soft skills.';
      case 'technical':
        return 'Test your coding skills with algorithm challenges and technical problem-solving questions.';
      case 'system-design':
        return 'Design scalable systems and demonstrate your understanding of architecture principles.';
      case 'custom':
        return 'Create a personalized interview experience tailored to your specific needs and interests.';
      default:
        return 'Configure your interview settings below.';
    }
  };

  const isReadOnly = selectedType === 'behavioral';

  // Render appropriate form based on interview type
  const renderInterviewForm = () => {
    switch (selectedType) {
      case 'technical':
        return (
          <TechnicalInterviewForm
            config={config}
            onConfigChange={onConfigChange}
            errors={errors}
            disabled={isReadOnly}
          />
        );
      case 'system-design':
        return (
          <SystemDesignForm
            config={config}
            onConfigChange={onConfigChange}
            errors={errors}
            disabled={isReadOnly}
          />
        );
      case 'behavioral':
      case 'custom':
      default:
        return (
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Ready to start {selectedType === 'custom' ? 'custom' : 'behavioral'} interview</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white/80 dark:bg-black/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800/70 h-full min-h-[500px] flex flex-col shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-sans font-bold text-foreground mb-2">
          {getTitle()}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {getDescription()}
        </p>
      </div>

      <div className="flex-1 space-y-6">
        {renderInterviewForm()}
        
        {isReadOnly && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Pre-configured settings:</strong> These settings are optimized for {selectedType} interviews. 
                  These fields are read-only for behavioral interviews.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {rateLimited && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg p-4 mt-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Rate Limited:</strong> You've reached the rate limit. Please wait before starting another interview.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewConfigPanel;
