'use client';


import { InterviewModeConfig } from '@/app/api/voice/types';

const topicOptions = [
  'Leadership',
  'Problem Solving',
  'Communication',
  'Technical Skills',
  'Project Management',
  'Team Collaboration',
  'Innovation',
  'Customer Focus',
  'Data Analysis',
  'Strategic Thinking'
];

const questionFormatOptions = [
  'Behavioral Questions',
  'Scenario-Based',
  'Case Studies',
  'Technical Deep-Dive',
  'Mixed Format'
];

const difficultyOptions = ['Easy', 'Medium', 'Hard'];

interface CustomInterviewFormProps {
  config: InterviewModeConfig;
  onConfigChange: (config: InterviewModeConfig) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export default function CustomInterviewForm({
  config,
  onConfigChange,
  errors,
  disabled = true // Always disabled for now since it's coming soon
}: CustomInterviewFormProps) {

  const handleInputChange = (field: keyof InterviewModeConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  const handleTopicToggle = (topic: string) => {
    const currentTopics = config.customTopics?.split(', ') || ['Leadership', 'Problem Solving'];
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter(t => t !== topic)
      : [...currentTopics, topic];
    handleInputChange('customTopics', newTopics.join(', '));
  };

  return (
    <div className="space-y-4 relative">

      {/* Top Row: Question Format and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Question Format *
          </label>
          <select
            value={config.questionFormat || 'Behavioral Questions'}
            onChange={(e) => handleInputChange('questionFormat', e.target.value)}
            disabled={disabled}
            className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {questionFormatOptions.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
          {errors.questionFormat && (
            <p className="text-red-500 text-xs">{errors.questionFormat}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Difficulty Level *
          </label>
          <div className="flex space-x-3">
            {difficultyOptions.map(diff => (
              <label key={diff} className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value={diff}
                  checked={(config.difficulty || 'Medium') === diff}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  disabled={disabled}
                  className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-foreground">
                  {diff}
                </span>
              </label>
            ))}
          </div>
          {errors.difficulty && (
            <p className="text-red-500 text-xs">{errors.difficulty}</p>
          )}
        </div>
      </div>

      {/* Focus Topics */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Focus Topics *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {topicOptions.map(topic => {
            const currentTopics = config.customTopics?.split(', ') || ['Leadership', 'Problem Solving'];
            const isSelected = currentTopics.includes(topic);
            return (
              <label key={topic} className="flex items-center space-x-1 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleTopicToggle(topic)}
                  disabled={disabled}
                  className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-foreground truncate">
                  {topic}
                </span>
              </label>
            );
          })}
        </div>
        {errors.customTopics && (
          <p className="text-red-500 text-xs">{errors.customTopics}</p>
        )}
      </div>

      {/* Custom Instructions */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Additional Instructions
        </label>
        <textarea
          value={config.additionalInstructions || ''}
          onChange={(e) => handleInputChange('additionalInstructions', e.target.value)}
          disabled={disabled}
          placeholder="Any specific topics, requirements, or preferences for your interview..."
          className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm resize-none"
          rows={3}
        />
        {errors.additionalInstructions && (
          <p className="text-red-500 text-xs">{errors.additionalInstructions}</p>
        )}
      </div>
    </div>
  );
}