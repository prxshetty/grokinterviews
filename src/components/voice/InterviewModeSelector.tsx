'use client';

import React, { useState } from 'react';
import { Laptop, Phone, Zap, Clock, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InterviewMode = 'web' | 'phone';

interface InterviewModeSelectorProps {
  selectedMode: InterviewMode;
  onModeChange: (mode: InterviewMode) => void;
  disabled?: boolean;
  className?: string;
}

export default function InterviewModeSelector({
  selectedMode,
  onModeChange,
  disabled = false,
  className
}: InterviewModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<InterviewMode | null>(null);

  const modes = [
    {
      id: 'web' as InterviewMode,
      title: 'Web Interview',
      subtitle: 'Practice on your computer',
      icon: Laptop,
      features: [
        { icon: Zap, text: 'Instant start' },
        { icon: Clock, text: 'Real-time feedback' },
        { icon: Users, text: 'Visual interface' }
      ],
      pros: [
        'No phone required',
        'Visual feedback and controls',
        'Instant transcription display',
        'Easy to pause and resume'
      ],
      cons: [
        'Less realistic interview experience',
        'Requires computer microphone'
      ],
      recommended: 'Best for first-time practice'
    },
    {
      id: 'phone' as InterviewMode,
      title: 'Phone Interview',
      subtitle: 'Receive a real phone call',
      icon: Phone,
      features: [
        { icon: Phone, text: 'Real phone call' },
        { icon: Shield, text: 'Authentic experience' },
        { icon: Clock, text: '10-15 minutes' }
      ],
      pros: [
        'Most realistic interview experience',
        'Practice phone interview skills',
        'Professional call quality',
        'Can take the call anywhere'
      ],
      cons: [
        'Requires valid phone number',
        'Less control during interview',
        'May incur small charges'
      ],
      recommended: 'Best for realistic practice'
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose Your Interview Mode
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select how you'd like to practice your behavioral interview
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const isHovered = hoveredMode === mode.id;
          
          return (
            <div
              key={mode.id}
              className={cn(
                "relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform",
                "hover:scale-105 hover:shadow-lg",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600",
                disabled && "opacity-50 cursor-not-allowed transform-none hover:scale-100"
              )}
              onClick={() => !disabled && onModeChange(mode.id)}
              onMouseEnter={() => setHoveredMode(mode.id)}
              onMouseLeave={() => setHoveredMode(null)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div className={cn(
                  "p-3 rounded-lg transition-colors",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "text-lg font-semibold transition-colors",
                    isSelected
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-900 dark:text-white"
                  )}>
                    {mode.title}
                  </h3>
                  <p className={cn(
                    "text-sm transition-colors",
                    isSelected
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {mode.subtitle}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-4">
                {mode.features.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <FeatureIcon className={cn(
                        "h-4 w-4",
                        isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      )} />
                      <span className={cn(
                        "text-sm",
                        isSelected
                          ? "text-blue-800 dark:text-blue-200"
                          : "text-gray-700 dark:text-gray-300"
                      )}>
                        {feature.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Recommended badge */}
              <div className={cn(
                "inline-block px-3 py-1 text-xs font-medium rounded-full mb-4",
                isSelected
                  ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              )}>
                {mode.recommended}
              </div>

              {/* Pros and Cons (show on hover or selection) */}
              {(isSelected || isHovered) && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <h4 className={cn(
                      "text-sm font-medium mb-2",
                      isSelected
                        ? "text-green-700 dark:text-green-300"
                        : "text-gray-700 dark:text-gray-300"
                    )}>
                      Advantages:
                    </h4>
                    <ul className="space-y-1">
                      {mode.pros.map((pro, index) => (
                        <li key={index} className={cn(
                          "text-xs flex items-start space-x-1",
                          isSelected
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className={cn(
                      "text-sm font-medium mb-2",
                      isSelected
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-gray-700 dark:text-gray-300"
                    )}>
                      Considerations:
                    </h4>
                    <ul className="space-y-1">
                      {mode.cons.map((con, index) => (
                        <li key={index} className={cn(
                          "text-xs flex items-start space-x-1",
                          isSelected
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          <span className="text-orange-500 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional info */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>Both modes provide the same high-quality behavioral interview practice.</p>
        <p>You can switch between modes anytime to try different experiences.</p>
      </div>
    </div>
  );
}