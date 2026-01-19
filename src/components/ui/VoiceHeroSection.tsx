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
      ; (window as any).requestIdleCallback(start, { timeout: 1000 })
      return undefined
    }

    const id = setTimeout(start, 500)
    return () => clearTimeout(id)
  }, []);

  // Always render the same structure to avoid hydration mismatch
  const shouldAnimate = mounted && isInView;

  return (
    <div
      ref={sectionRef}
      className={`relative bg-transparent overflow-hidden flex flex-col transition-all duration-700 ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Split layout - Text left, Globe right */}
        <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between pt-2 pb-0 lg:pb-1">

          {/* Text Content Section - Left Side with matching padding */}
          <div className={`relative z-10 text-center lg:text-left lg:flex-1 lg:pr-8 px-3 sm:px-4 md:px-6 ml-0 sm:ml-4 md:ml-8 lg:ml-12 transition-all duration-700 delay-150 ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <div className="max-w-2xl lg:max-w-none">
              <h1 className="text-3xl font-editorial font-light leading-[110%] tracking-[-1.8px] text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                <span className="block">
                  <span className="italic">Smarter</span> Conversations, Simplified.
                </span>
              </h1>

              <p className={`mt-4 text-base text-gray-500 dark:text-gray-300 sm:mt-6 sm:text-lg md:text-xl lg:text-xl max-w-xl transition-all duration-700 delay-300 ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {description}
              </p>
            </div>
          </div>

          {/* Globe Section - Right Side */}
          <div className={`relative lg:flex-1 mt-4 sm:mt-6 md:mt-8 lg:mt-0 lg:pl-8 px-3 sm:px-4 md:px-6 mr-0 sm:mr-4 md:mr-8 lg:mr-12 transition-all duration-700 delay-450 ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <div className="flex justify-center lg:justify-end">
              {showMap ? <Globe /> : <LoadingSpinner size="lg" color="muted" centered={true} />}
            </div>
          </div>

        </div>

        {/* Stats Section - Below everything */}
        <div className={`mt-4 pt-12 px-3 sm:px-4 md:px-6 lg:px-12 transition-all duration-700 delay-600 ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 w-full">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white">3</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Interview Modes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white">~0.6s</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Voice Latency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white">81K+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Practice Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white">Live</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI Feedback</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(VoiceHeroSection);