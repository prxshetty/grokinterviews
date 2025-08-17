'use client';

import React from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';

const programmingLanguages = [
  'JavaScript',
  'Python', 
  'Java',
  'C++',
  'Go',
  'Rust',
  'TypeScript',
  'C#'
];

const focusAreaOptions = [
  'Data Structures',
  'Algorithms',
  'System Design',
  'Web Development',
  'API Design',
  'Database Design',
  'Performance Optimization',
  'Testing',
  'Security',
  'DevOps'
];

const difficultyOptions = ['Easy', 'Medium', 'Hard'];

interface TechnicalInterviewFormProps {
  config: InterviewModeConfig;
  onConfigChange: (config: InterviewModeConfig) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export default function TechnicalInterviewForm({
  config,
  onConfigChange,
  errors,
  disabled = false
}: TechnicalInterviewFormProps) {
  
  const handleInputChange = (field: keyof InterviewModeConfig, value: string | string[]) => {
    onConfigChange({ ...config, [field]: value });
  };

  const handleFocusAreaToggle = (area: string) => {
    const currentAreas = config.focusAreas || [];
    const newAreas = currentAreas.includes(area)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area];
    handleInputChange('focusAreas', newAreas);
  };

  return (
    <div className="space-y-4">
      {/* Top Row: Programming Language and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Programming Language *
          </label>
          <select
            value={config.programmingLanguage || 'JavaScript'}
            onChange={(e) => handleInputChange('programmingLanguage', e.target.value)}
            disabled={disabled}
            className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {programmingLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          {errors.programmingLanguage && (
            <p className="text-red-500 text-xs">{errors.programmingLanguage}</p>
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

      {/* Focus Areas */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Focus Areas *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {focusAreaOptions.map(area => {
            const isSelected = (config.focusAreas || ['Data Structures', 'Algorithms']).includes(area);
            return (
              <label key={area} className="flex items-center space-x-1 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleFocusAreaToggle(area)}
                  disabled={disabled}
                  className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-foreground truncate">
                  {area}
                </span>
              </label>
            );
          })}
        </div>
        {errors.focusAreas && (
          <p className="text-red-500 text-xs">{errors.focusAreas}</p>
        )}
      </div>
    </div>
  );
}