import React from 'react';
import { InterviewType } from './InterviewAvatar';
import { InterviewModeConfig } from '@/app/api/voice/types';
import TechnicalInterviewForm from './TechnicalInterviewForm';
import SystemDesignForm from './SystemDesignForm';
import BehaviorInterviewForm from './BehaviorInterviewForm';

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
      // Commented out custom case - uncomment to restore custom interview option
      /* case 'custom':
        return {
          title: 'Custom Interview',
        };
      */
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
      // Commented out custom case - uncomment to restore custom interview option
      /* case 'custom':
        return (
          <CustomInterviewForm
            config={config}
            onConfigChange={onConfigChange}
            errors={errors}
            disabled={isReadOnly}
          />
        );
      */
      case 'behavioral':
      default:
        return (
          <BehaviorInterviewForm
            config={config}
            onConfigChange={onConfigChange}
            errors={errors}
            disabled={isReadOnly}
          />
        );
    }
  };

  const content = getFeatureContent();

  return (
    <div className="mb-8 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-editorial font-light text-foreground mb-4 tracking-tight">
          {content.title}
        </h1>
      </div>
      
        {renderInterviewForm()}
    </div>
  );
};

export default InterviewFeatures;
