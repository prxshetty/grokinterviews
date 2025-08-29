'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';
import { Play, Code, Target, Plus, Minus, X } from 'lucide-react';
import { motion } from 'framer-motion';

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

// Utility function for className merging
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

interface TechnicalInterviewFormProps {
  config: InterviewModeConfig;
  onConfigChange: (config: InterviewModeConfig) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  isInterviewActive: boolean;
  isProcessingAI: boolean;
  rateLimited: boolean;
  onStartInterview: () => Promise<void>;
}

export default function TechnicalInterviewForm({
  config,
  onConfigChange,
  errors,
  disabled = false,
  isInterviewActive,
  isProcessingAI,
  rateLimited,
  onStartInterview
}: TechnicalInterviewFormProps) {
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showFocusAreasDropdown, setShowFocusAreasDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const focusAreasDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (focusAreasDropdownRef.current && !focusAreasDropdownRef.current.contains(event.target as Node)) {
        setShowFocusAreasDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (field: keyof InterviewModeConfig, value: string | string[] | number) => {
    onConfigChange({ ...config, [field]: value });
  };

  const handleFocusAreaToggle = (area: string) => {
    const currentAreas = config.focusAreas || [];
    const newAreas = currentAreas.includes(area)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area];
    handleInputChange('focusAreas', newAreas);
  };

  const currentDifficultyIndex = config.difficulty ? difficultyOptions.indexOf(config.difficulty) : -1;
  
  const handleDifficultyChange = (direction: 'up' | 'down') => {
    const currentIndex = config.difficulty ? difficultyOptions.indexOf(config.difficulty) : -1;
    
    if (direction === 'up') {
      if (currentIndex === -1 || !config.difficulty) {
        handleInputChange('difficulty', 'Easy');
      } else {
        const newIndex = Math.min(currentIndex + 1, difficultyOptions.length - 1);
        const newDifficulty = difficultyOptions[newIndex];
        if (newDifficulty) {
          handleInputChange('difficulty', newDifficulty);
        }
      }
    } else if (direction === 'down') {
      if (currentIndex <= 0) {
        handleInputChange('difficulty', '');
      } else {
        const newIndex = Math.max(currentIndex - 1, 0);
        const newDifficulty = difficultyOptions[newIndex];
        if (newDifficulty) {
          handleInputChange('difficulty', newDifficulty);
        }
      }
    }
  };

  if (isInterviewActive) {
    return null;
  }

  const canStart = config.programmingLanguage && config.programmingLanguage.trim().length > 0 && config.targetRole && config.targetRole.trim().length > 0 && config.difficulty;

  return (
    <div className="flex flex-col items-center space-y-4 px-0 w-full">
      {/* Main Prompt Box */}
      <div className="w-full max-w-[380px] md:max-w-[500px] lg:max-w-[700px] mx-auto">
        <div className="rounded-3xl border border-border bg-background p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300">
          
          {/* Input Field - keeping the text field for target role */}
          <div className="relative">
            <input
              type="text"
              value={config.targetRole || ''}
              onChange={(e) => handleInputChange('targetRole', e.target.value)}
              disabled={disabled}
              placeholder="What role are you interviewing for?"
              className="flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              maxLength={100}
            />
            {errors.targetRole && (
              <p className="text-destructive text-xs font-medium ml-3 mt-1">{errors.targetRole}</p>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-0 pt-2">
            
            {/* Left Side - Configuration Options */}
            <div className="flex items-center gap-1">
              
              {/* Programming Language Selector */}
              <div className="relative" ref={languageDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 h-8",
                    config.programmingLanguage
                      ? "text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{ scale: config.programmingLanguage ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    >
                      <Code className="w-4 h-4" />
                    </motion.div>
                  </div>
                  {config.programmingLanguage ? (
                    <>
                      <span className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0 max-w-20">
                        {config.programmingLanguage}
                      </span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInputChange('programmingLanguage', '');
                        }}
                        className="w-4 h-4 flex items-center justify-center text-current hover:text-destructive transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Language</span>
                  )}
                </button>

                {/* Language Dropdown */}
                {showLanguageDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 w-48 bg-background border border-border rounded-xl shadow-xl z-20 py-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground"
                  >
                    {programmingLanguages.map(language => (
                      <button
                        key={language}
                        onClick={() => {
                          handleInputChange('programmingLanguage', language);
                          setShowLanguageDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                          config.programmingLanguage === language ? 'font-semibold text-blue-500' : 'text-muted-foreground'
                        )}
                      >
                        {language}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="relative h-6 w-[1.5px] mx-1">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-border to-transparent rounded-full" />
              </div>

              {/* Focus Areas Selector */}
              <div className="relative" ref={focusAreasDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFocusAreasDropdown(!showFocusAreasDropdown)}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 h-8",
                    (config.focusAreas && config.focusAreas.length > 0)
                      ? "text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{ scale: (config.focusAreas && config.focusAreas.length > 0) ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    >
                      <Target className="w-4 h-4" />
                    </motion.div>
                  </div>
                  {config.focusAreas && config.focusAreas.length > 0 ? (
                    <span className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0 max-w-20">
                      {config.focusAreas.length} areas
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Focus</span>
                  )}
                </button>

                {/* Focus Areas Dropdown */}
                {showFocusAreasDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 md:right-auto w-56 md:w-64 bg-background border border-border rounded-xl shadow-xl z-20 py-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground"
                  >
                    {focusAreaOptions.map(area => {
                      const isSelected = (config.focusAreas || []).includes(area);
                      return (
                        <button
                          key={area}
                          onClick={() => handleFocusAreaToggle(area)}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2",
                            isSelected ? 'font-semibold text-blue-500 bg-blue-500/10' : 'text-muted-foreground'
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded border transition-colors",
                            isSelected 
                              ? "bg-blue-500 border-blue-500" 
                              : "border-muted-foreground/50"
                          )}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {area}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              <div className="relative h-6 w-[1.5px] mx-1">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-border to-transparent rounded-full" />
              </div>

              {/* Difficulty Counter */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-0 md:px-2 py-1 border border-transparent rounded-full">
                  <Target className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDifficultyChange('down')}
                    disabled={!config.difficulty || currentDifficultyIndex <= 0}
                    className="h-6 w-6 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3 text-foreground" />
                  </button>
                  <span className="text-sm text-foreground min-w-[3rem] md:min-w-[4rem] text-center">{config.difficulty || '-'}</span>
                  <button
                    onClick={() => handleDifficultyChange('up')}
                    disabled={currentDifficultyIndex >= difficultyOptions.length - 1}
                    className="h-6 w-6 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3 text-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Start Interview Button */}
            <button
              onClick={onStartInterview}
              disabled={!canStart || isProcessingAI || rateLimited}
              className={cn(
                "h-7 w-7 md:h-8 md:w-8 rounded-full transition-all duration-200 hidden md:flex items-center justify-center",
                canStart && !isProcessingAI && !rateLimited
                  ? "bg-primary hover:bg-primary/80 text-primary-foreground"
                  : "bg-transparent border border-border text-muted-foreground cursor-not-allowed opacity-50"
              )}
              title="Start Interview"
            >
              <Play className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Start Button */}
      <div className="w-full max-w-[380px] mx-auto px-4 md:px-0">
        <button
          onClick={onStartInterview}
          disabled={!canStart || isProcessingAI || rateLimited}
          className={cn(
            "w-full md:hidden flex items-center justify-center gap-2 rounded-full py-3 text-base font-semibold transition-all duration-200",
            canStart && !isProcessingAI && !rateLimited
              ? "bg-primary hover:bg-primary/80 text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Start Interview
          <Play className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}