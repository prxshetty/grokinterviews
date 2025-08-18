'use client';

import React from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';

const industryOptions = [
  'Technology',
  'Healthcare', 
  'Finance',
  'Consulting',
  'Marketing',
  'Sales',
  'Operations',
  'Product Management',
  'Design',
  'Education'
];

interface BehaviorInterviewFormProps {
  config: InterviewModeConfig;
  onConfigChange: (config: InterviewModeConfig) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export default function BehaviorInterviewForm({
  config,
  onConfigChange,
  errors,
  disabled = false
}: BehaviorInterviewFormProps) {
  
  const handleInputChange = (field: keyof InterviewModeConfig, value: string | number) => {
    onConfigChange({ ...config, [field]: value });
  };

  const minYears = config.minYearsExperience ?? 0;
  const maxYears = config.maxYearsExperience ?? 5;

  const handleMinYearsChange = (value: number) => {
    const newMin = Math.min(value, maxYears);
    handleInputChange('minYearsExperience', newMin);
  };

  const handleMaxYearsChange = (value: number) => {
    const newMax = Math.max(value, minYears);
    handleInputChange('maxYearsExperience', newMax);
  };

  return (
    <>
      {/* Header Section */}
      <div className="px-8 pt-8 pb-4">
        <h3 className="text-2xl font-light text-slate-800 dark:text-white/90 mb-1">Interview Setup</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 opacity-80">Configure your behavioral interview preferences</p>
      </div>

      {/* Industry and Role Fields */}
      <div className="px-8 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Industry
            </label>
            <div className="relative">
              <select
                value={config.industry || 'Technology'}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer text-sm"
              >
                {industryOptions.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.industry && (
              <p className="text-red-500 text-xs font-medium ml-1">{errors.industry}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Target Role
            </label>
            <input
              type="text"
              value={config.targetRole || ''}
              onChange={(e) => handleInputChange('targetRole', e.target.value)}
              disabled={disabled}
              placeholder="Senior Software Engineer"
              className="w-full px-4 py-3.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-2xl text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            {errors.targetRole && (
              <p className="text-red-500 text-xs font-medium ml-1">{errors.targetRole}</p>
            )}
          </div>
        </div>
      </div>

      {/* Experience Range Section */}
      <div className="px-8 pb-8 space-y-6">
        <div className="text-center">
          <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Experience Range</h4>
          <div className="text-3xl font-light text-slate-700 dark:text-slate-200">
            {minYears} - {maxYears} <span className="text-base text-slate-500 dark:text-slate-400">years</span>
          </div>
        </div>
        
        {/* Sliders Container */}
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-600/20">
          
          {/* Minimum Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Minimum</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white bg-white/50 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                {minYears} yrs
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={minYears}
              onChange={(e) => handleMinYearsChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer range-slider disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20+</span>
            </div>
          </div>

          {/* Maximum Slider */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Maximum</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white bg-white/50 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                {maxYears} yrs
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={maxYears}
              onChange={(e) => handleMaxYearsChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer range-slider disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20+</span>
            </div>
          </div>
        </div>
        
        {(errors.minYearsExperience || errors.maxYearsExperience) && (
          <p className="text-red-500 text-sm font-medium text-center">
            {errors.minYearsExperience || errors.maxYearsExperience}
          </p>
        )}
      </div>

      <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #64748b, #475569);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        
        .range-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #64748b, #475569);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        .range-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .dark .range-slider::-webkit-slider-thumb {
          background: linear-gradient(135deg, #94a3b8, #cbd5e1);
        }
        
        .dark .range-slider::-moz-range-thumb {
          background: linear-gradient(135deg, #94a3b8, #cbd5e1);
        }
      `}</style>
    </>
  );
}
