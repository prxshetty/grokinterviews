import React from 'react';
import { InterviewType } from './InterviewAvatar';
import { InterviewModeConfig } from '@/app/api/voice/types';
import TechnicalInterviewForm from './TechnicalInterviewForm';
import SystemDesignForm from './SystemDesignForm';
import CustomInterviewForm from './CustomInterviewForm';

interface InterviewFeaturesProps {
  selectedType?: InterviewType;
  config?: InterviewModeConfig;
  onConfigChange?: (config: InterviewModeConfig) => void;
  errors?: Record<string, string>;
  isReadOnly?: boolean;
}

export const InterviewFeatures: React.FC<InterviewFeaturesProps> = ({
  selectedType = 'behavioral',
  config = {},
  onConfigChange = () => {},
  errors = {},
  isReadOnly = false,
}) => {
  const getFeatureContent = () => {
    switch (selectedType) {
      case 'behavioral':
        return {
          title: 'Behavioral Interview',
        };
      case 'technical':
        return {
          title: 'Technical Interview',
        };
      case 'system-design':
        return {
          title: 'System Design Interview',
        };
      case 'custom':
        return {
          title: 'Custom Interview',
        };
      default:
        return {
          title: 'Behavioral Interview',
        };
    }
  };

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
      case 'custom':
        return (
          <CustomInterviewForm
            config={config}
            onConfigChange={onConfigChange}
            errors={errors}
            disabled={false} // Custom form is never read-only
          />
        );
      case 'behavioral':
      default:
        return (
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Ready to start behavioral interview</span>
            </div>
          </div>
        );
    }
  };

  const content = getFeatureContent();

  return (
    <div className="mb-8 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
          {content.title}
        </h1>
      </div>
      
      <div className="w-full bg-gradient-to-br from-slate-100/80 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
        {renderInterviewForm()}
      </div>
    </div>
  );
};

export default InterviewFeatures;
