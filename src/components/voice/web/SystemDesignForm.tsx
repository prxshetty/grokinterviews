'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';
import { Play, Target, List, X, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const systemTypes = [
  'Social Media Platform (Twitter/Facebook)',
  'E-commerce System (Amazon/eBay)',
  'Chat/Messaging System (WhatsApp/Slack)',
  'Video Streaming (YouTube/Netflix)',
  'Ride Sharing App (Uber/Lyft)', 
  'Food Delivery Service (DoorDash/UberEats)',
  'URL Shortener (bit.ly)',
  'Search Engine (Google)',
  'File Storage System (Dropbox/Google Drive)',
];

const scaleOptions = [
  '100K users',
  '1M users', 
  '10M users',
  '100M users',
  '1B+ users'
];

const scaleLabels = ['100K', '1M', '10M', '100M', '1B+'];

const focusAreaOptions = [
  'Architecture',
  'Scalability',
  'Database Design',
  'Caching',
  'Load Balancing',
  'Microservices',
  'API Design',
  'Security',
  'Monitoring',
  'Performance'
];

// Utility function for className merging
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

interface SystemDesignFormProps {
  config: InterviewModeConfig;
  onConfigChange: (config: InterviewModeConfig) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  isInterviewActive: boolean;
  isProcessingAI: boolean;
  rateLimited: boolean;
  onStartInterview: () => Promise<void>;
}

export default function SystemDesignForm({
  config,
  onConfigChange,
  errors,
  disabled = false,
  isInterviewActive,
  isProcessingAI,
  rateLimited,
  onStartInterview
}: SystemDesignFormProps) {
  
  const [showSystemTypeDropdown, setShowSystemTypeDropdown] = useState(false);
  const [showFocusAreasDropdown, setShowFocusAreasDropdown] = useState(false);
  const systemTypeDropdownRef = useRef<HTMLDivElement>(null);
  const focusAreasDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (systemTypeDropdownRef.current && !systemTypeDropdownRef.current.contains(event.target as Node)) {
        setShowSystemTypeDropdown(false);
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

  const handleSystemTypeChange = (systemType: string) => {
    handleInputChange('systemType', systemType);
    setShowSystemTypeDropdown(false);
  };

  const handleScaleChange = (scale: string) => {
    handleInputChange('scale', scale);
  };

  if (isInterviewActive) {
    return null;
  }

  const canStart = config.systemType && config.systemType.trim().length > 0 && config.targetRole && config.targetRole.trim().length > 0;

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

          {/* Actions Row */}          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-0 pt-2">
            
            {/* Left Side - Configuration Options */}            <div className="flex items-center gap-1">
              
              {/* System Type Selector */}              <div className="relative" ref={systemTypeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowSystemTypeDropdown(!showSystemTypeDropdown)}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
                    config.systemType
                      ? "bg-blue-500/15 border-blue-500 text-blue-500"
                      : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{ scale: config.systemType ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    >
                      <Target className="w-4 h-4" />
                    </motion.div>
                  </div>
                  {config.systemType ? (
                    <>
                      <span className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0 max-w-20">
                        {config.systemType.replace(' (', '\n(').split('\n')[0]}
                      </span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInputChange('systemType', '');
                        }}
                        className="w-4 h-4 flex items-center justify-center text-current hover:text-destructive transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Platform
                    </span>
                  )}
                </button>

                {/* System Type Dropdown */}                {showSystemTypeDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 md:right-auto w-56 md:w-64 bg-background border border-border rounded-xl shadow-xl z-20 py-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground"
                  >
                    {systemTypes.map(systemType => (
                      <button
                        key={systemType}
                        onClick={() => handleSystemTypeChange(systemType)}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                          config.systemType === systemType ? 'font-semibold text-blue-500' : 'text-muted-foreground'
                        )}
                      >
                        {systemType}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="relative h-6 w-[1.5px] mx-1">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-border to-transparent rounded-full" />
              </div>

              {/* Focus Areas Selector */}              <div className="relative" ref={focusAreasDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFocusAreasDropdown(!showFocusAreasDropdown)}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
                    (config.focusAreas && config.focusAreas.length > 0)
                      ? "bg-blue-500/15 border-blue-500 text-blue-500"
                      : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{ scale: (config.focusAreas && config.focusAreas.length > 0) ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    >
                      <List className="w-4 h-4" />
                    </motion.div>
                  </div>
                  {config.focusAreas && config.focusAreas.length > 0 ? (
                    <span className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0 max-w-20">
                      {config.focusAreas.length} areas
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Areas
                    </span>
                  )}
                </button>

                {/* Focus Areas Dropdown */}                {showFocusAreasDropdown && (
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

              {/* Scale Selector */}              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-2 py-1 border border-transparent rounded-full">
                  <span className="text-xs text-muted-foreground">Scale:</span>
                </div>
                
                {/* Scale Counter */}                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const currentIndex = config.scale ? scaleOptions.indexOf(config.scale) : 0;
                      const newIndex = Math.max(0, currentIndex - 1);
                      if (scaleOptions[newIndex]) {
                        handleScaleChange(scaleOptions[newIndex]);
                      }
                    }}
                    disabled={config.scale === scaleOptions[0]}
                    className="h-6 w-6 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3 text-foreground" />
                  </button>
                  <span className="text-sm text-foreground min-w-[3rem] text-center">
                    {config.scale ? scaleLabels[scaleOptions.indexOf(config.scale)] : '-'}
                  </span>
                  <button
                    onClick={() => {
                      const currentIndex = config.scale ? scaleOptions.indexOf(config.scale) : 0;
                      const newIndex = Math.min(scaleOptions.length - 1, currentIndex + 1);
                      if (scaleOptions[newIndex]) {
                        handleScaleChange(scaleOptions[newIndex]);
                      }
                    }}
                    disabled={config.scale === scaleOptions[scaleOptions.length - 1]}
                    className="h-6 w-6 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3 text-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Start Interview Button */}            <button
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