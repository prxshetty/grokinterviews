'use client';

import { Monitor, Phone, Mic, Video, MessageCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface VoiceHeroSectionProps {
  title: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function VoiceHeroSection({
  title,
  description,
  primaryButtonText,
  secondaryButtonText,
  onSecondaryClick,
}: VoiceHeroSectionProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          // Once animation is triggered, we can disconnect the observer
          observer.disconnect();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the component is visible
        rootMargin: '0px 0px -50px 0px' // Start animation slightly before fully visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
    <div 
      ref={sectionRef}
      className={`relative bg-transparent overflow-hidden min-h-screen flex flex-col lg:min-h-0 transition-all duration-700 ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Mobile/Tablet: Stack content vertically, Desktop: Side by side */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:min-h-[600px]">
          
          {/* Text Content Section */}
          <div className={`relative z-10 flex-1 px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:py-20 lg:pr-8 transition-all duration-700 delay-150 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <h1 className="text-3xl tracking-tight font-normal text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="block">{title}</span>
              </h1>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-300 sm:mt-6 sm:text-lg md:text-xl lg:text-xl max-w-xl mx-auto lg:mx-0">
                {description}
              </p>
              
              {/* Buttons - Hidden on mobile/tablet, shown on desktop */}
              <div className={`mt-6 sm:mt-8 hidden lg:flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center lg:justify-start transition-all duration-700 delay-300 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <Link
                  href="/voice"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-3xl text-white bg-gray-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 transition-all duration-300 shadow-md border border-gray-700/50 dark:border-white/20 touch-manipulation active:scale-95 sm:px-8 sm:py-4 sm:text-lg"
                >
                  {primaryButtonText}
                </Link>
                {secondaryButtonText && (
                  <button
                    onClick={onSecondaryClick}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 transition-all duration-300 touch-manipulation active:scale-95 sm:px-8 sm:py-4 sm:text-lg"
                  >
                    {secondaryButtonText}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mockup Section */}
          <div className={`relative flex-1 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[600px] px-4 sm:px-6 md:px-8 lg:px-0 transition-all duration-700 delay-300 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="relative w-full h-full flex lg:justify-start lg:pl-8">
              
              {/* Mobile/Tablet: Show simplified single mockup */}
              <div className={`block lg:hidden w-full max-w-sm mx-auto transition-all duration-700 delay-450 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                {/* Single Phone Mockup for Mobile/Tablet */}
                <div className="relative mx-auto">
                  {/* iPhone-style frame with gradient */}
                  <div className="w-64 h-[500px] sm:w-72 sm:h-[560px] bg-gradient-to-b from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-[3rem] p-1 shadow-2xl border border-gray-700/50 mx-auto">
                    {/* iPhone screen with notch */}
                    <div className="w-full h-full bg-black rounded-[2.7rem] overflow-hidden relative">
                      {/* iPhone notch */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 sm:w-28 h-6 sm:h-7 bg-black rounded-b-2xl z-10"></div>
                      
                      {/* Screen content */}
                        <div className="w-full h-full bg-white dark:bg-gray-950 rounded-[1.5rem] overflow-hidden">
                        {/* Status bar with iPhone-style elements */}
                        <div className="bg-white dark:bg-gray-950 px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center text-sm sm:text-base pt-8 sm:pt-9">
                          <span className="font-semibold text-black dark:text-white">{currentTime}</span>
                          <div className="flex items-center space-x-1">
                            {/* Signal bars */}
                            <div className="flex items-end space-x-0.5">
                              <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
                              <div className="w-1 h-2 bg-black dark:bg-white rounded-full"></div>
                              <div className="w-1 h-3 bg-black dark:bg-white rounded-full"></div>
                              <div className="w-1 h-4 bg-black dark:bg-white rounded-full"></div>
                            </div>
                            {/* Battery */}
                            <div className="w-6 h-3 border border-black dark:border-white rounded-sm relative">
                              <div className="w-5 h-2.5 bg-green-500 rounded-sm absolute left-0.25"></div>
                              <div className="w-0.5 h-1.5 bg-black dark:bg-white rounded-r-sm absolute top-0.5 -right-1"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Call interface */}
                        <div className="flex-1 flex flex-col justify-between p-6 h-full">
                          {/* Top section with call info */}
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <h3 className="text-xl sm:text-2xl font-medium mb-2 text-black dark:text-white">Gia</h3>
                              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Interview Call</p>
                              <p className="text-sm sm:text-base text-green-600 mt-2">Active • 05:23</p>
                            </div>
                          </div>
                          
                          {/* Call controls - iPhone style */}
                          <div className="flex justify-center space-x-4 sm:space-x-6 pb-16">
                            <button className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 ease-in-out touch-manipulation">
                              <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
                            </button>
                            <button className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 ease-in-out touch-manipulation">
                              <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-white transform rotate-[135deg]" />
                            </button>
                            <button className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 ease-in-out touch-manipulation">
                              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Primary Button below phone for Mobile/Tablet */}
                <div className={`mt-8 flex justify-center transition-all duration-700 delay-600 ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <Link
                    href="/voice"
                    className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-3xl text-white bg-gray-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 transition-all duration-300 shadow-md border border-gray-700/50 dark:border-white/20 touch-manipulation active:scale-95"
                  >
                    {primaryButtonText}
                  </Link>
                </div>
              </div>

              {/* Desktop: Show iMac mockup */}
              <div className={`hidden lg:block relative w-full max-w-4xl transition-all duration-700 delay-450 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                {/* iMac Desktop Mockup */}
                <div className={`relative z-20 w-full max-w-2xl mx-auto transition-all duration-700 delay-500 ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  {/* iMac Screen */}
                  <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[16px] rounded-t-xl h-[294px] max-w-[512px]">
                    <div className="rounded-xl overflow-hidden h-[262px] bg-gradient-to-br from-background to-background/90">
                      {/* Screen Content */}
                      <div className="h-full p-6 flex flex-col">
                        {/* Browser Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="text-xs text-muted-foreground">grokinterviews.com</div>
                          <div className="w-12"></div>
                        </div>
                        
                        {/* Interview Interface */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Grok Interviews</h3>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600">Live</span>
                            </div>
                          </div>
                          
                          {/* Interview Controls */}
                          <div className="flex justify-center items-center space-x-4 py-3">
                            <button className="w-8 h-8 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200">
                              <Mic className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                            </button>
                            <button className="w-8 h-8 bg-red-500/80 backdrop-blur-xl border border-red-400/50 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200">
                              <Video className="w-3 h-3 text-white" />
                            </button>
                            <button className="w-8 h-8 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200">
                              <MessageCircle className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                            </button>
                          </div>
                          
                          {/* Live transcript preview */}
                          <div className="bg-background/40 rounded-lg p-3 border border-border/20 flex-1">
                            <div className="text-xs text-muted-foreground mb-2">Live Transcript</div>
                            <div className="text-xs space-y-1">
                              <p><span className="font-medium">AI:</span> Tell me about your experience with React...</p>
                              <p><span className="font-medium">You:</span> I've been working with React for over 3 years...</p>
                              <p><span className="font-medium">AI:</span> That's great! Can you walk me through...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* iMac Base */}
                  <div className="relative mx-auto bg-gray-900 dark:bg-gray-700 rounded-b-xl h-[42px] max-w-[512px]"></div>
                  <div className="relative mx-auto bg-gray-800 rounded-b-xl h-[95px] max-w-[142px]"></div>
                </div>

                {/* Phone Interview Mockup - Desktop only */}
                <div className={`absolute bottom-0 right-0 z-30 transform translate-y-8 transition-all duration-700 delay-600 ${
                  isInView ? 'opacity-100 translate-y-8' : 'opacity-0 translate-y-12'
                }`}>
                  {/* iPhone-style frame with more realistic proportions */}
                  <div className="w-40 h-[320px] xl:w-48 xl:h-[380px] bg-gradient-to-b from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-[2.7rem] p-1 shadow-2xl border border-gray-700/50">
                    {/* iPhone screen with notch */}
                    <div className="w-full h-full bg-black rounded-[2.7rem] overflow-hidden relative">
                      {/* iPhone notch */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 xl:w-24 h-6 xl:h-6 bg-black rounded-b-2xl z-10"></div>
                      
                      {/* Screen content */}
                      <div className="w-full h-full bg-white dark:bg-gray-950 rounded-[2.7rem] overflow-hidden">
                        {/* Status bar with iPhone-style elements */}
                        <div className="bg-white dark:bg-gray-950 px-4 xl:px-5 py-3 xl:py-4 flex justify-between items-center text-xs xl:text-sm pt-8 xl:pt-9">
                          <span className="font-semibold text-black dark:text-white">{currentTime}</span>
                          <div className="flex items-center space-x-1">
                            {/* Signal bars */}
                            <div className="flex items-end space-x-0.5">
                              <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
                              <div className="w-1 h-2 bg-black dark:bg-white rounded-full"></div>
                              <div className="w-1 h-3 bg-black dark:bg-white rounded-full"></div>
                              <div className="w-1 h-4 bg-black dark:bg-white rounded-full"></div>
                            </div>
                            {/* Battery */}
                            <div className="w-6 h-3 border border-black dark:border-white rounded-sm relative">
                              <div className="w-5 h-2.5 bg-green-500 rounded-sm absolute left-0.25"></div>
                              <div className="w-0.5 h-1.5 bg-black dark:bg-white rounded-r-sm absolute top-0.5 -right-1"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Call interface */}
                        <div className="flex-1 flex flex-col justify-between p-4 xl:p-5 h-full pb-8 xl:pb-12">
                          {/* Top section with call info */}
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <h3 className="text-lg xl:text-xl font-medium mb-1 text-black dark:text-white">Gia</h3>
                              <p className="text-xs xl:text-sm text-gray-600 dark:text-gray-400">Interview Call</p>
                              <p className="text-xs xl:text-sm text-green-600 mt-2">Active • 05:23</p>
                            </div>
                          </div>
                          
                          {/* Call controls - iPhone style */}
                          <div className="flex justify-center items-center space-x-2 xl:space-x-3 pb-4 xl:pb-12">
                            <button className="w-10 h-10 xl:w-9 xl:h-9 flex-shrink-0 aspect-square bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ease-in-out">
                              <Mic className="w-3 h-3 xl:w-4 xl:h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                            <button className="w-10 h-10 xl:w-9 xl:h-9 flex-shrink-0 aspect-square bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ease-in-out">
                              <Phone className="w-3 h-3 xl:w-4 xl:h-4 text-white transform rotate-[135deg]" />
                            </button>
                            <button className="w-10 h-10 xl:w-9 xl:h-9 flex-shrink-0 aspect-square bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ease-in-out">
                              <MessageCircle className="w-3 h-3 xl:w-4 xl:h-4 text-gray-700 dark:text-gray-300" />
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
      </div>
    </div>
  );
}