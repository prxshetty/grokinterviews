'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  isInterviewActive: boolean;
  isProcessingAI: boolean;
  rateLimited: boolean;
  onStartInterview: () => Promise<void>;
}

export default function BehaviorInterviewForm({
  config,
  onConfigChange,
  errors,
  disabled = false,
  isInterviewActive,
  isProcessingAI,
  rateLimited,
  onStartInterview
}: BehaviorInterviewFormProps) {
  
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const industryRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryRef.current && !industryRef.current.contains(event.target as Node)) {
        setShowIndustryModal(false);
      }
      if (experienceRef.current && !experienceRef.current.contains(event.target as Node)) {
        setShowExperienceModal(false);
      }
    };

    if (showIndustryModal || showExperienceModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndustryModal, showExperienceModal]);

  const industrySelected = !!config.industry;
  const experienceSelected = config.minYearsExperience != null || config.maxYearsExperience != null;

  if (isInterviewActive) {
    return null;
  }

  return (
    <>
      {/* Main Search Bar with Start Button */}
      <div className="flex flex-col items-center space-y-6 px-4 w-full">
        <div className="flex items-center w-2/5 space-x-2 sm:space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={config.targetRole || ''}
              onChange={(e) => handleInputChange('targetRole', e.target.value)}
              disabled={disabled}
              placeholder="What role are you interviewing for?"
              className="w-full min-w-0 px-4 py-3 sm:px-6 sm:py-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-full text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            {errors.targetRole && (
              <p className="text-red-500 text-xs font-medium ml-1 mt-1">{errors.targetRole}</p>
            )}
          </div>
          
          <button
            onClick={onStartInterview}
            disabled={isProcessingAI || rateLimited}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xl hover:shadow-2xl transition-transform duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start Interview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Configuration Buttons */}
        <div className="w-2/5">
          <div className="flex items-center space-x-4">
            {/* Industry Dropdown */}
            <div className="relative" ref={industryRef}>
              <button
                onClick={() => setShowIndustryModal(!showIndustryModal)}
                className={`px-4 py-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-full text-slate-800 dark:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200 shadow-sm hover:shadow-md ${
                  industrySelected 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'border border-white/20 dark:border-slate-600/20'
                }`}
                title={`Industry: ${config.industry || 'Not set'}`}
              >
                {industrySelected ? config.industry : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" />
                  </svg>
                )}
              </button>
              {showIndustryModal && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-white/20 dark:border-slate-600/20 rounded-xl shadow-xl z-20 py-2">
                  {industryOptions.map(industry => (
                    <button
                      key={industry}
                      onClick={() => {
                        handleInputChange('industry', industry)
                        setShowIndustryModal(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 ${
                        config.industry === industry ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Experience Dropdown */}
            <div className="relative" ref={experienceRef}>
              <button
                onClick={() => setShowExperienceModal(!showExperienceModal)}
                className={`px-4 py-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-full text-slate-800 dark:text-white font-medium hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200 shadow-sm hover:shadow-md ${
                  experienceSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'border border-white/20 dark:border-slate-600/20'
                }`}
                title={`Experience: ${minYears}-${maxYears} yrs`}
              >
                {experienceSelected ? `${minYears}-${maxYears} yrs` : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                )}
              </button>
              {showExperienceModal && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 border border-white/20 dark:border-slate-600/20 rounded-xl shadow-xl z-20 p-4 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Min: {minYears} yrs</span>
                    </div>
                    <input type="range" min="0" max="20" value={minYears} onChange={e=>handleMinYearsChange(parseInt(e.target.value))} className="w-full range-slider" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Max: {maxYears} yrs</span>
                    </div>
                    <input type="range" min="0" max="20" value={maxYears} onChange={e=>handleMaxYearsChange(parseInt(e.target.value))} className="w-full range-slider" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
        .range-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #64748b, #475569);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
        }
      `}</style>
    </>
  );
}