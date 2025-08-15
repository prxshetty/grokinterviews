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

const difficultyColors = {
  'Easy': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  'Medium': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  'Hard': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
};

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-foreground mb-2">Custom Interview Setup</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Configure your personalized interview experience
        </p>
      </div>

      {/* Topics Card */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-lg font-semibold text-foreground mb-2">
              Topics to Cover *
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Describe the topics, skills, or areas you want to practice. Be as specific as possible.
            </p>
            <textarea
              value={config.customTopics || ''}
              onChange={(e) => handleInputChange('customTopics', e.target.value)}
              placeholder="e.g., React hooks, system design, data structures, behavioral questions..."
              rows={4}
              disabled={disabled}
              className="w-full p-4 border-0 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 resize-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-relaxed"
            />
            {errors.customTopics && (
              <div className="flex items-center space-x-2 mt-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-500 text-sm">{errors.customTopics}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Format & Difficulty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Question Format Card */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-lg font-semibold text-foreground mb-2">
                Question Format *
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Choose your preferred interview style
              </p>
              <select
                value={config.questionFormat || ''}
                onChange={(e) => handleInputChange('questionFormat', e.target.value)}
                disabled={disabled}
                className="w-full p-4 border-0 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-foreground focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
              >
                <option value="">Select format...</option>
                {questionFormats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
              {errors.questionFormat && (
                <div className="flex items-center space-x-2 mt-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-500 text-sm">{errors.questionFormat}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Difficulty Level Card */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-lg font-semibold text-foreground mb-2">
                Difficulty Level *
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Set the challenge level
              </p>
              <div className="space-y-2">
                {difficultyOptions.map(diff => (
                  <label key={diff} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="difficulty"
                      value={diff}
                      checked={config.difficulty === diff}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      disabled={disabled}
                      className="w-4 h-4 text-blue-600 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 group-hover:scale-105 ${
                      config.difficulty === diff 
                        ? difficultyColors[diff as keyof typeof difficultyColors]
                        : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50'
                    }`}>
                      {diff}
                    </span>
                  </label>
                ))}
              </div>
              {errors.difficulty && (
                <div className="flex items-center space-x-2 mt-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-500 text-sm">{errors.difficulty}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}