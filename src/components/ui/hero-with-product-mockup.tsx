'use client';

import { Monitor, Phone, Mic, Video, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeroSectionProps {
  title: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function HeroSection({
  title,
  description,
  primaryButtonText,
  secondaryButtonText,
  onSecondaryClick,
}: HeroSectionProps) {
  const [currentTime, setCurrentTime] = useState('');

  // Update time every minute for efficiency
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-normal text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                <span className="block xl:inline">{title}</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                {description}
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-xl shadow">
                  <Link
                    href="/voice"
                    className="inline-flex items-center justify-center px-2 py-1.5 text-sm font-medium rounded-3xl text-white bg-gray-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 transition-all duration-300 shadow-md border border-gray-700/50 dark:border-white/20 md:py-3 md:text-base md:px-8"
                  >
                    {primaryButtonText}
                  </Link>
                </div>
                {secondaryButtonText && (
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      onClick={onSecondaryClick}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                    >
                      {secondaryButtonText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full relative">
          {/* Voice Interview Mockups */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-4xl mx-auto px-4">
              {/* Desktop Web Interview Window */}
              <div className="relative z-20 mx-auto w-full max-w-2xl">
                {/* Stacked background windows for depth */}
                <div className="absolute -top-4 -left-4 w-full h-full bg-gradient-to-br from-blue-400/30 to-blue-500/30 rounded-lg backdrop-blur-sm border border-border/20 shadow-lg"></div>
                <div className="absolute -top-2 -left-2 w-full h-full bg-gradient-to-br from-green-400/20 to-green-500/20 rounded-lg backdrop-blur-sm border border-border/20 shadow-lg"></div>
                
                {/* Main desktop window */}
                <div className="relative bg-background/80 backdrop-blur-sm rounded-lg shadow-xl border border-border/30 overflow-hidden">
                  {/* Window header */}
                  <div className="bg-background/60 backdrop-blur-sm border-b border-border/30 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-sm text-muted-foreground">Desktop Web Interview Window</div>
                    <div className="w-16"></div>
                  </div>
                  
                  {/* Browser content */}
                  <div className="p-6">
                    {/* Search bar */}
                    <div className="bg-background/70 backdrop-blur-sm rounded-lg p-3 mb-4 border border-border/20">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Interview Practice</span>
                      </div>
                    </div>
                    
                    {/* Interview interface */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Grok Interviews</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-600">Live Interview</span>
                        </div>
                      </div>
                      
                      {/* Interview Controls */}
                      <div className="flex justify-center items-center space-x-8 py-6">
                        <div className="relative">
                          <button className="w-16 h-16 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-200">
                            <Mic className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                          </button>
                        </div>
                        <div className="relative">
                          <button className="w-16 h-16 bg-red-500/80 backdrop-blur-xl border border-red-400/50 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-200">
                            <Video className="w-6 h-6 text-white" />
                          </button>
                        </div>
                        <div className="relative">
                          <button className="w-16 h-16 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-200">
                            <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Live transcript preview */}
                      <div className="bg-background/40 rounded-lg p-4 border border-border/20">
                        <div className="text-xs text-muted-foreground mb-2">Live Transcript</div>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">AI:</span> Tell me about your experience with React...</p>
                          <p><span className="font-medium">You:</span> I've been working with React for...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Interview Mockup */}
              <div className="absolute bottom-0 right-4 z-30 transform translate-y-2">
                {/* Phone frame */}
                <div className="w-44 h-[350px] bg-white dark:bg-black rounded-[2.5rem] p-2 shadow-2xl border border-border/30">
                  {/* Phone screen */}
                  <div className="w-full h-full bg-white dark:bg-black rounded-[2rem] overflow-hidden border border-border/20">
                    {/* Status bar */}
                    <div className="bg-background/90 backdrop-blur-sm px-3 py-3 flex justify-between items-center text-sm border-b border-border/20">
                      <span className="font-medium">{currentTime}</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                        <span className="text-xs">100%</span>
                      </div>
                    </div>
                    
                    {/* Call interface */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-32">
                      <div className="text-center">
                        <h3 className="text-lg font-normal mb-1">Gia</h3>
                        <p className="text-xs text-muted-foreground">Interview Call</p>
                        <p className="text-xs text-green-600 mt-1">Active • 05:23</p>
                      </div>
                      
                      {/* Call controls */}
                      <div className="flex space-x-2">
                        <button className="w-10 h-10 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-xl hover:scale-110 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-all duration-200 ease-in-out">
                          <Mic className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 hover:bg-red-600 transition-all duration-200 ease-in-out">
                          <Phone className="w-4 h-4 text-white transform rotate-[135deg]" />
                        </button>
                        <button className="w-10 h-10 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-xl hover:scale-110 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-all duration-200 ease-in-out">
                          <MessageCircle className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}