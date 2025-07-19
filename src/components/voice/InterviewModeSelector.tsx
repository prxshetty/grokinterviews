'use client';

import React from 'react';
import Image from 'next/image';
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
      image: '/images/webcall.jpg',
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
      image: '/images/phonecall.jpg',
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
    <div className={cn("space-y-6 w-full", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-normal text-black dark:text-white">
          Choose Your Interview Mode
        </h2>
        <p className="text-muted-foreground lg:text-lg">
          Select how you'd like to practice your behavioral interview
        </p>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-6">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          
          return (
            <div
              key={mode.id}
              className={cn(
                "relative border-2 rounded-xl cursor-pointer transition-all duration-300 transform flex flex-col md:flex-row flex-1",
                "h-auto md:h-[480px]",
                "hover:scale-[1.02] hover:shadow-lg",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg"
                  : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-600",
                disabled && "opacity-50 cursor-not-allowed transform-none hover:scale-100"
              )}
              onClick={() => !disabled && onModeChange(mode.id)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}

              {/* Image with overlay text */}
              <div className="relative w-full md:w-1/2 h-48 md:h-full rounded-t-xl md:rounded-l-xl md:rounded-t-none overflow-hidden">
                <Image
                  src={mode.image}
                  alt={mode.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center p-4 md:p-6">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-2 md:mb-3">
                    {mode.title}
                  </h3>
                  <p className="text-sm md:text-base opacity-90">
                    {mode.subtitle}
                  </p>
                  {mode.id === 'phone' && (
                    <div className="mt-2 px-2 py-1 border border-amber-300 text-amber-100 text-xs rounded-full">
                      US only
                    </div>
                  )}
                </div>
                {/* Blur transition to content */}
                <div className="absolute bottom-0 md:top-0 md:right-0 h-8 md:h-full w-full md:w-8 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-white/20 backdrop-blur-sm"></div>
              </div>

              {/* Content area */}
              <div className="flex-1 p-4 md:p-9 flex flex-col justify-between">
                <div>
                  {/* Recommended badge */}
                  <div className={cn(
                    "inline-block px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium rounded-full mb-4 md:mb-6",
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {mode.recommended}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                    {mode.features.map((feature, index) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <div key={index} className="flex items-center space-x-2 md:space-x-3">
                          <FeatureIcon className={cn(
                            "h-5 w-5 md:h-6 md:w-6",
                            isSelected
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-sm md:text-base",
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
                </div>

                {/* Empty space for future settings */}
                <div className="min-h-[100px] md:min-h-[150px] flex items-center justify-center text-muted-foreground text-sm md:text-base">
                  {/* Settings will be added here */}
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
        <p>International phone interview support coming soon.</p>
      </div>
    </div>
  );
}