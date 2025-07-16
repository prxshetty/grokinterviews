'use client';

import React from 'react';
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
        <h2 className="text-3xl md:text-4xl font-normal text-black dark:text-white">
          Choose Your Interview Mode
        </h2>
        <p className="text-muted-foreground lg:text-lg">
          Select how you'd like to practice your behavioral interview
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <div
              key={mode.id}
              className={cn(
                "relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform",
                "hover:scale-105 hover:shadow-lg",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg"
                  : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-600",
                disabled && "opacity-50 cursor-not-allowed transform-none hover:scale-100"
              )}
              onClick={() => !disabled && onModeChange(mode.id)}
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
                    : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "text-lg font-normal transition-colors",
                    isSelected
                      ? "text-foreground"
                      : "text-foreground"
                  )}>
                    {mode.title}
                  </h3>
                  <p className={cn(
                    "text-sm transition-colors",
                    isSelected
                      ? "text-muted-foreground"
                      : "text-muted-foreground"
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
                          : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm",
                        isSelected
                          ? "text-foreground"
                          : "text-foreground"
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
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-muted text-muted-foreground"
              )}>
                {mode.recommended}
              </div>

              {/* Pros and Cons (always visible) */}
              <div className="space-y-3">
                <div>
                  <h4 className={cn(
                    "text-sm font-medium mb-2",
                    isSelected
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-foreground"
                  )}>
                    Advantages:
                  </h4>
                  <ul className="space-y-1">
                    {mode.pros.map((pro, index) => (
                      <li key={index} className="text-xs flex items-start space-x-1 text-muted-foreground">
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
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-foreground"
                  )}>
                    Considerations:
                  </h4>
                  <ul className="space-y-1">
                    {mode.cons.map((con, index) => (
                      <li key={index} className="text-xs flex items-start space-x-1 text-muted-foreground">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional info */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Both modes provide the same high-quality behavioral interview practice.</p>
        <p>You can switch between modes anytime to try different experiences.</p>
      </div>
    </div>
  );
}