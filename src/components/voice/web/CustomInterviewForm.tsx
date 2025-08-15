'use client';

import React from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';

const questionFormats = [
  'Open-ended Discussion',
  'Multiple Choice',
  'Coding Challenges',
  'Case Studies', 
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
  disabled = false
}: CustomInterviewFormProps) {
  const handleInputChange = (field: keyof InterviewModeConfig, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <>
      {/* Custom Topics */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Topics to Cover *
        </label>
        <textarea
          value={config.customTopics || ''}
          onChange={(e) => handleInputChange('customTopics', e.target.value)}
          placeholder="Describe the topics, skills, or areas you want to practice. Be as specific as possible..."
          rows={4}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {errors.customTopics && <p className="text-red-500 text-sm mt-1">{errors.customTopics}</p>}
      </div>

      {/* Question Format */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Question Format *
        </label>
        <select
          value={config.questionFormat || ''}
          onChange={(e) => handleInputChange('questionFormat', e.target.value)}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select format...</option>
          {questionFormats.map(format => (
            <option key={format} value={format}>{format}</option>
          ))}
        </select>
        {errors.questionFormat && <p className="text-red-500 text-sm mt-1">{errors.questionFormat}</p>}
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Difficulty Level *
        </label>
        <select
          value={config.difficulty || ''}
          onChange={(e) => handleInputChange('difficulty', e.target.value)}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select difficulty...</option>
          {difficultyOptions.map(diff => (
            <option key={diff} value={diff}>{diff}</option>
          ))}
        </select>
        {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty}</p>}
      </div>
    </>
  );
}