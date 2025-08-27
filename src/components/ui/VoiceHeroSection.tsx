'use client';

import { memo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Globe = dynamic(() => import('./globe'), { ssr: false });
import { useCentralizedIntersection } from '@/hooks/ui/use-centralized-intersection';

interface VoiceHeroSectionProps {
  title: string;
  description: string;
}

function VoiceHeroSection({
  description
}: VoiceHeroSectionProps) {
  const { ref: sectionRef, isVisible: isInView, mounted } = useCentralizedIntersection({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    once: true
  });

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    function start() { setShowMap(true) }

    // Guard against SSR
    if (typeof window === 'undefined') return

    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(start, { timeout: 1000 })
      return undefined
    }

    const id = setTimeout(start, 500)
    return () => clearTimeout(id)
  }, []);



  // Show loading state during SSR
  if (!mounted) {
    return (
      <div className="relative bg-transparent overflow-hidden min-h-[80vh] flex flex-col opacity-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center justify-center min-h-[80vh] py-4 sm:py-6 md:py-8 lg:py-12">
            <div className="relative z-10 px-4 sm:px-6 md:px-8 text-center">
              <div className="max-w-4xl mx-auto">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-6"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
            <div className="relative w-full max-w-6xl mt-12 h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={sectionRef}
      className={`relative bg-transparent overflow-hidden min-h-[80vh] flex flex-col transition-all duration-700 delay-700 ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Split layout - Text left, Globe right */}
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh] py-4 sm:py-6 md:py-8 lg:py-12">
          
          {/* Text Content Section - Left Side with matching padding */}
          <div className={`relative z-10 text-center lg:text-left lg:flex-1 lg:pr-8 px-3 sm:px-4 md:px-6 ml-0 sm:ml-4 md:ml-8 lg:ml-12 transition-all duration-700 delay-150 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="max-w-2xl lg:max-w-none">
              <h1 className="text-3xl font-editorial font-light leading-[110%] tracking-[-1.8px] text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                <span className="block">
                  <span className="italic">Smarter</span> Conversations, Simplified.
                </span>
              </h1>
              
              <p className={`mt-4 text-base text-gray-500 dark:text-gray-300 sm:mt-6 sm:text-lg md:text-xl lg:text-xl max-w-xl transition-all duration-700 delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {description}
              </p>
            </div>
          </div>

          {/* Globe Section - Right Side */}
          <div className={`relative lg:flex-1 mt-6 sm:mt-8 md:mt-10 lg:mt-0 lg:pl-8 px-3 sm:px-4 md:px-6 mr-0 sm:mr-4 md:mr-8 lg:mr-12 transition-all duration-700 delay-450 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex justify-center lg:justify-end">
              {showMap ? <Globe /> : <LoadingSpinner size="lg" color="muted" centered={true} />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(VoiceHeroSection);