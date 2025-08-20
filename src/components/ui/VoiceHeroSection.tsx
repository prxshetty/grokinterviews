'use client';

import { Phone, Mic, Video, MessageCircle } from 'lucide-react';
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
              
              {/* CTA Buttons - Hidden on mobile, shown on desktop */}
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

          {/* Unified mockup with responsive scaling */}
          <div className={`relative flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] px-2 sm:px-4 md:px-6 lg:px-0 transition-all duration-700 delay-300 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="relative w-full h-full flex justify-center lg:justify-start lg:pl-8">
              
              {/* iMac Desktop Mockup */}
              <div className={`relative w-full max-w-[80%] sm:max-w-[70%] md:max-w-[60%] lg:max-w-4xl scale-75 sm:scale-90 md:scale-100 lg:scale-100 transition-all duration-700 delay-450 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                {/* iMac Screen */}
                <div className={`relative z-20 w-full max-w-[80%] sm:max-w-[90%] md:max-w-full lg:max-w-2xl mx-auto transition-all duration-700 delay-500 ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  {/* Screen with border */}
                  <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] sm:border-[10px] md:border-[12px] lg:border-[16px] rounded-t-xl h-[147px] sm:h-[196px] md:h-[245px] lg:h-[294px] max-w-[256px] sm:max-w-[341px] md:max-w-[426px] lg:max-w-[512px]">
                    <div className="rounded-xl overflow-hidden h-[131px] sm:h-[175px] md:h-[218px] lg:h-[262px] bg-gradient-to-br from-background to-background/90">
                      {/* Screen Content */}
                      <div className="h-full p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col">
                        {/* Browser Header */}
                        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-3 lg:mb-4">
                          <div className="flex items-center space-x-1 sm:space-x-1 md:space-x-1.5 lg:space-x-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 bg-red-500 rounded-full"></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs text-muted-foreground">grokinterviews.com</div>
                          <div className="w-6 sm:w-8 md:w-10 lg:w-12"></div>
                        </div>
                        
                        {/* Interview Interface */}
                        <div className="flex-1 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[7px] sm:text-[9px] md:text-[12px] lg:text-sm font-semibold">Grok Interviews</h3>
                            <div className="flex items-center space-x-0.5 sm:space-x-0.5 md:space-x-0.75 lg:space-x-1">
                              <div className="w-0.75 h-0.75 sm:w-1 sm:h-1 md:w-1.25 md:h-1.25 lg:w-1.5 lg:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs text-green-600">Live</span>
                            </div>
                          </div>
                          
                          {/* Control Buttons */}
                          <div className="flex justify-center items-center space-x-2 sm:space-x-2.5 md:space-x-3 lg:space-x-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3">
                            <button className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200">
                              <Mic className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 text-gray-700 dark:text-gray-300" />
                            </button>
                            <button className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-red-500/80 backdrop-blur-xl border border-red-400/50 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200">
                              <Video className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 text-white" />
                            </button>
                            <button className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-gray-200/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200">
                              <MessageCircle className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 text-gray-700 dark:text-gray-300" />
                            </button>
                          </div>
                          
                          {/* Live Transcript */}
                          <div className="bg-background/40 rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 border border-border/20 flex-1">
                            <div className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs text-muted-foreground mb-1 sm:mb-1.5 md:mb-1.5 lg:mb-2">Live Transcript</div>
                            <div className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs space-y-0.5 sm:space-y-0.5 md:space-y-0.75 lg:space-y-1">
                              <p><span className="font-medium">AI:</span> Tell me about your experience with React...</p>
                              <p><span className="font-medium">You:</span> I've been working with React for over 3 years...</p>
                              <p><span className="font-medium">AI:</span> That's great! Can you walk me through...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* iMac Stand */}
                  <div className="relative mx-auto bg-gray-900 dark:bg-gray-700 rounded-b-xl h-[21px] sm:h-[28px] md:h-[35px] lg:h-[42px] max-w-[256px] sm:max-w-[341px] md:max-w-[426px] lg:max-w-[512px]"></div>
                  <div className="relative mx-auto bg-gray-800 rounded-b-xl h-[47.5px] sm:h-[63.33px] md:h-[79.17px] lg:h-[95px] max-w-[71px] sm:max-w-[94.67px] md:max-w-[118.33px] lg:max-w-[142px]"></div>
                </div>

                {/* Phone Interview Mockup */}
                <div className={`absolute bottom-0 right-0 z-30 transform translate-y-4 sm:translate-y-5 md:translate-y-7 lg:translate-y-8 transition-all duration-700 delay-600 ${
                  isInView ? 'opacity-100 translate-y-4 sm:translate-y-5 md:translate-y-7 lg:translate-y-8' : 'opacity-0 translate-y-6 sm:translate-y-7 md:translate-y-10 lg:translate-y-12'
                }`}>
                  <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[5px] sm:border-[6.67px] md:border-[8.33px] lg:border-[10px] rounded-[1.25rem] sm:rounded-[1.67rem] md:rounded-[2.08rem] lg:rounded-[2.5rem] h-[160px] sm:h-[213.33px] md:h-[266.67px] lg:h-[320px] w-[80px] sm:w-[106.67px] md:w-[133.33px] lg:w-[160px] xl:h-[380px] xl:w-[190px] shadow-xl">
                    <div className="w-[37px] h-[4.5px] sm:w-[49.33px] sm:h-[6px] md:w-[61.67px] md:h-[7.5px] lg:w-[74px] lg:h-[9px] bg-gray-800 top-0 rounded-b-[0.5rem] sm:rounded-b-[0.67rem] md:rounded-b-[0.83rem] lg:rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                    <div className="h-[11.5px] w-[0.75px] sm:h-[15.33px] sm:w-[1px] md:h-[19.17px] md:w-[1.25px] lg:h-[23px] lg:w-[1.5px] bg-gray-800 absolute -start-[-5px] sm:-start-[-6.67px] md:-start-[-8.33px] lg:-start-[-10px] top-[31px] sm:top-[41.33px] md:top-[51.67px] lg:top-[62px] rounded-s-[0.25rem] sm:rounded-s-[0.33rem] md:rounded-s-[0.42rem] lg:rounded-s-lg"></div>
                    <div className="h-[11.5px] w-[0.75px] sm:h-[15.33px] sm:w-[1px] md:h-[19.17px] md:w-[1.25px] lg:h-[23px] lg:w-[1.5px] bg-gray-800 absolute -start-[-5px] sm:-start-[-6.67px] md:-start-[-8.33px] lg:-start-[-10px] top-[44.5px] sm:top-[59.33px] md:top-[74.17px] lg:top-[89px] rounded-s-[0.25rem] sm:rounded-s-[0.33rem] md:rounded-s-[0.42rem] lg:rounded-s-lg"></div>
                    <div className="h-[11.5px] w-[0.75px] sm:h-[15.33px] sm:w-[1px] md:h-[19.17px] md:w-[1.25px] lg:h-[23px] lg:w-[1.5px] bg-gray-800 absolute -end-[-5px] sm:-end-[-6.67px] md:-end-[-8.33px] lg:-end-[-10px] top-[35.5px] sm:top-[47.33px] md:top-[59.17px] lg:top-[71px] rounded-es-[0.25rem] sm:rounded-es-[0.33rem] md:rounded-es-[0.42rem] lg:rounded-es-lg"></div>
                    <div className="rounded-[1rem] sm:rounded-[1.33rem] md:rounded-[1.67rem] lg:rounded-[2rem] overflow-hidden w-[70px] h-[150px] sm:w-[93.33px] sm:h-[200px] md:w-[116.67px] md:h-[250px] lg:w-[140px] lg:h-[300px] xl:w-[170px] xl:h-[351px] bg-white dark:bg-gray-800">
                      {/* Phone Status Bar */}
                      <div className="bg-white dark:bg-gray-950 px-2 sm:px-2.67 md:px-3.33 lg:px-4 xl:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 flex justify-between items-center text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs xl:text-sm pt-4 sm:pt-5.33 md:pt-6.67 lg:pt-8 xl:pt-9">
                        <span className="font-semibold text-black dark:text-white">{currentTime}</span>
                        <div className="flex items-center space-x-0.5 sm:space-x-0.67 md:space-x-0.83 lg:space-x-1">
                          {/* Signal bars */}
                          <div className="flex items-end space-x-0.25 sm:space-x-0.33 md:space-x-0.42 lg:space-x-0.5">
                            <div className="w-0.5 h-0.5 sm:w-0.67 sm:h-0.67 md:w-0.83 md:h-0.83 lg:w-1 lg:h-1 bg-black dark:bg-white rounded-full"></div>
                            <div className="w-0.5 h-1 sm:w-0.67 sm:h-1.33 md:w-0.83 md:h-1.67 lg:w-1 lg:h-2 bg-black dark:bg-white rounded-full"></div>
                            <div className="w-0.5 h-1.5 sm:w-0.67 sm:h-2 md:w-0.83 md:h-2.5 lg:w-1 lg:h-3 bg-black dark:bg-white rounded-full"></div>
                            <div className="w-0.5 h-2 sm:w-0.67 sm:h-2.67 md:w-0.83 md:h-3.33 lg:w-1 lg:h-4 bg-black dark:bg-white rounded-full"></div>
                          </div>
                          {/* Battery */}
                          <div className="w-3 h-1.5 sm:w-4 sm:h-2 md:w-5 md:h-2.5 lg:w-6 lg:h-3 border border-black dark:border-white rounded-[0.25rem] sm:rounded-[0.33rem] md:rounded-[0.42rem] lg:rounded-sm relative">
                            <div className="w-2.5 h-1.25 sm:w-3.33 sm:h-1.67 md:w-4.17 md:h-2.08 lg:w-5 lg:h-2.5 bg-green-500 rounded-[0.25rem] sm:rounded-[0.33rem] md:rounded-[0.42rem] lg:rounded-sm absolute left-0.125 sm:left-0.167 md:left-0.208 lg:left-0.25"></div>
                            <div className="w-0.25 h-0.75 sm:w-0.33 sm:h-1 md:w-0.42 md:h-1.25 lg:w-0.5 lg:h-1.5 bg-black dark:bg-white rounded-r-[0.125rem] sm:rounded-r-[0.167rem] md:rounded-r-[0.208rem] lg:rounded-r-sm absolute top-0.25 sm:top-0.333 md:top-0.417 lg:top-0.5 -right-0.5 sm:-right-0.667 md:-right-0.833 lg:-right-1"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Phone Call Interface */}
                      <div className="flex-1 flex flex-col justify-between p-2 sm:p-2.67 md:p-3.33 lg:p-4 xl:p-5 h-full pb-4 sm:pb-5.33 md:pb-6.67 lg:pb-8 xl:pb-12">
                        {/* Call Info */}
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <h3 className="text-[9px] sm:text-[12px] md:text-[15px] lg:text-lg xl:text-xl font-medium mb-0.5 sm:mb-0.67 md:mb-0.83 lg:mb-1 text-black dark:text-white">Gia</h3>
                            <p className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs xl:text-sm text-gray-600 dark:text-gray-400">Interview Call</p>
                            <p className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs xl:text-sm text-green-600 mt-1 sm:mt-1.33 md:mt-1.67 lg:mt-2">Active • 05:23</p>
                          </div>
                        </div>
                        
                        {/* Call Controls */}
                        <div className="flex justify-center items-center space-x-1 sm:space-x-1.33 md:space-x-1.67 lg:space-x-2 xl:space-x-3 pb-2 sm:pb-2.67 md:pb-3.33 lg:pb-4 xl:pb-12">
                          <button className="w-5 h-5 sm:w-6.67 sm:h-6.67 md:w-8.33 md:h-8.33 lg:w-10 lg:h-10 xl:w-9 xl:h-9 flex-shrink-0 aspect-square bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ease-in-out">
                            <Mic className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-4 xl:h-4 text-gray-700 dark:text-gray-300" />
                          </button>
                          <button className="w-5 h-5 sm:w-6.67 sm:h-6.67 md:w-8.33 md:h-8.33 lg:w-10 lg:h-10 xl:w-9 xl:h-9 flex-shrink-0 aspect-square bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ease-in-out">
                            <Phone className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-4 xl:h-4 text-white transform rotate-[135deg]" />
                          </button>
                          <button className="w-5 h-5 sm:w-6.67 sm:h-6.67 md:w-8.33 md:h-8.33 lg:w-10 lg:h-10 xl:w-9 xl:h-9 flex-shrink-0 aspect-square bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ease-in-out">
                            <MessageCircle className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-4 xl:h-4 text-gray-700 dark:text-gray-300" />
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
  );
}