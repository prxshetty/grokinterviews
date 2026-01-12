'use client';

import { useState, useRef, useEffect } from 'react';
import { InterviewModeConfig } from '@/app/api/voice/types';
import { Play, Building2, Briefcase, Plus, Minus, X } from 'lucide-react';
import { motion } from 'framer-motion';

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

// Utility function for className merging
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

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

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const industryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setShowIndustryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (field: keyof InterviewModeConfig, value: string | number) => {
    onConfigChange({ ...config, [field]: value });
  };

  const { minYearsExperience: minYears, maxYearsExperience: maxYears } = config;

  const handleMinYearsChange = (value: number) => {
    const newMin = Math.max(0, Math.min(value, maxYears ?? 20));
    handleInputChange('minYearsExperience', newMin);
  };

  const handleMaxYearsChange = (value: number) => {
    const newMax = Math.max(minYears ?? 0, Math.min(value, 20));
    handleInputChange('maxYearsExperience', newMax);
  };

  if (isInterviewActive) {
    return null;
  }

  const canStart = config.targetRole && config.targetRole.trim().length > 0 && config.industry && config.minYearsExperience != null && config.maxYearsExperience != null;

  return (
    <div className="flex flex-col items-center space-y-4 px-0 w-full">
      {/* Main Prompt Box */}
      <div className="w-full max-w-[380px] md:max-w-[500px] lg:max-w-[700px] mx-auto">
        <div className="rounded-3xl border border-border bg-background p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300">

          {/* Input Field */}
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

              {/* Industry Selector */}
              <div className="relative" ref={industryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 h-8",
                    config.industry
                      ? "text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{ scale: config.industry ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    >
                      <Building2 className="w-4 h-4" />
                    </motion.div>
                  </div>
                  {config.industry ? (
                    <>
                      <span className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0 max-w-20">
                        {config.industry}
                      </span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInputChange('industry', '');
                        }}
                        className="w-4 h-4 flex items-center justify-center text-current hover:text-destructive transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Industry</span>
                  )}
                </button>

                {/* Industry Dropdown */}
                {showIndustryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 w-48 bg-background border border-border rounded-xl shadow-xl z-20 py-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground"
                  >
                    {industryOptions.map(industry => (
                      <button
                        key={industry}
                        onClick={() => {
                          handleInputChange('industry', industry);
                          setShowIndustryDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                          config.industry === industry ? 'font-semibold text-blue-500' : 'text-muted-foreground'
                        )}
                      >
                        {industry}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="relative h-6 w-[1.5px] mx-1">
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-border to-transparent rounded-full" />
              </div>

              {/* Experience Range */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-2 py-1 border border-transparent rounded-full">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Min Years */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMinYearsChange(Math.max(0, (minYears ?? 1) - 1))}
                    disabled={minYears != null && minYears <= 0}
                    className="h-6 w-6 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3 text-foreground" />
                  </button>
                  <span className="text-sm text-foreground min-w-[2rem] text-center">{minYears != null ? `${minYears}y` : '-'}</span>
                  <button
                    onClick={() => handleMinYearsChange((minYears ?? 0) + 1)}
                    disabled={minYears != null && maxYears != null && minYears >= maxYears}
                    className="h-6 w-6 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3 text-foreground" />
                  </button>
                </div>

                <span className="text-xs text-muted-foreground">-</span>

                {/* Max Years */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMaxYearsChange(Math.max(minYears ?? 0, (maxYears ?? 1) - 1))}
                    disabled={maxYears != null && minYears != null && maxYears <= minYears}
                    className="h-6 w-6 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3 text-foreground" />
                  </button>
                  <span className="text-sm text-foreground min-w-[2rem] text-center">{maxYears != null ? `${maxYears}y` : '-'}</span>
                  <button
                    onClick={() => handleMaxYearsChange(Math.min(20, (maxYears ?? 0) + 1))}
                    disabled={maxYears != null && maxYears >= 20}
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
