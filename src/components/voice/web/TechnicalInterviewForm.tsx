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

const difficultyOptions = [
  { value: 'Easy', label: 'Easy', color: 'from-green-500/20 to-emerald-500/20' },
  { value: 'Medium', label: 'Medium', color: 'from-yellow-500/20 to-orange-500/20' },
  { value: 'Hard', label: 'Hard', color: 'from-red-500/20 to-pink-500/20' }
];

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
    <>
      {/* Header Section */}
      <div className="px-8 pt-8 pb-4">
        <h3 className="text-2xl font-light text-slate-800 dark:text-white/90 mb-1">Interview Setup</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 opacity-80">Configure your technical interview preferences</p>
      </div>
      {/* Programming Language and Difficulty Section */}
      <div className="px-8 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Programming Language
            </label>
            <div className="relative">
              <select
                value={config.programmingLanguage || 'JavaScript'}
                onChange={(e) => handleInputChange('programmingLanguage', e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer text-sm"
              >
                {programmingLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.programmingLanguage && (
              <p className="text-red-500 text-xs font-medium ml-1">{errors.programmingLanguage}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Difficulty Level
            </label>
            <div className="relative">
              <select
                value={config.difficulty || 'Medium'}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer text-sm"
              >
                {difficultyOptions.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.difficulty && (
              <p className="text-red-500 text-xs font-medium ml-1">{errors.difficulty}</p>
            )}
          </div>
        </div>
      </div>

      {/* Focus Areas Section */}
      <div className="px-8 pb-8 space-y-6">
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-600/20">
          <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Focus Areas</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {focusAreaOptions.map(area => {
              const isSelected = (config.focusAreas || ['Data Structures', 'Algorithms']).includes(area);
              return (
                <label 
                  key={area} 
                  className={`group cursor-pointer transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleFocusAreaToggle(area)}
                    disabled={disabled}
                    className="sr-only"
                  />
                  <div className={`
                    relative px-3 py-2.5 rounded-xl text-center transition-all duration-300 
                    ${isSelected 
                      ? 'bg-slate-500/20 border-2 border-slate-400/50 shadow-lg scale-105' 
                      : 'bg-white/60 dark:bg-slate-700/30 border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/50'
                    }
                    backdrop-blur-sm shadow-sm hover:shadow-md group-hover:scale-[1.02]
                  `}>
                    <span className={`
                      text-xs font-medium transition-colors duration-300 
                      ${isSelected 
                        ? 'text-slate-800 dark:text-slate-100' 
                        : 'text-slate-600 dark:text-slate-300'
                      }
                    `}>
                      {area}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-3 h-3 bg-slate-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          {errors.focusAreas && (
            <p className="text-red-500 text-sm font-medium text-center mt-4">{errors.focusAreas}</p>
          )}
        </div>
      </div>
    </>
  );
}