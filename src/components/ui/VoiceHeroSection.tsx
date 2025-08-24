'use client';

import { useMemo, memo } from 'react';
import { WorldMap } from './map';
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

  // Memoize sample data for WorldMap to prevent unnecessary re-renders
  const mapDots = useMemo(() => [
    {
      start: { lat: 40.7128, lng: -74.0060, label: "New York" },
      end: { lat: 51.5074, lng: -0.1278, label: "London" }
    },
    {
      start: { lat: 37.7749, lng: -122.4194, label: "San Francisco" },
      end: { lat: 35.6762, lng: 139.6503, label: "Tokyo" }
    },
    {
      start: { lat: 52.5200, lng: 13.4050, label: "Berlin" },
      end: { lat: -33.8688, lng: 151.2093, label: "Sydney" }
    },
    {
      start: { lat: 19.0760, lng: 72.8777, label: "Mumbai" },
      end: { lat: 1.3521, lng: 103.8198, label: "Singapore" }
    }
  ], []);

  // Memoize WorldMap props to prevent unnecessary re-renders
  const worldMapProps = useMemo(() => ({
    dots: mapDots,
    lineColor: "#0ea5e9",
    showLabels: true,
    animationDuration: 2,
    loop: true
  }), [mapDots]);

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
      className={`relative bg-transparent overflow-hidden min-h-[80vh] flex flex-col transition-all duration-700 ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Centered content layout */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] py-4 sm:py-6 md:py-8 lg:py-12">
          
          {/* Text Content Section - Centered */}
          <div className={`relative z-10 text-center transition-all duration-700 delay-150 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-editorial font-light leading-[110%] tracking-[-1.8px] text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                <span className="block">
                  <span className="italic">Smarter</span> Conversations, Simplified.
                </span>
              </h1>
              
              <p className={`mt-4 text-base text-gray-500 dark:text-gray-300 sm:mt-6 sm:text-lg md:text-xl lg:text-xl max-w-2xl mx-auto transition-all duration-700 delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {description}
              </p>
            </div>
          </div>

          {/* WorldMap Section - Full width with negative margins for end-to-end */}
          <div className={`relative w-full max-w-7xl mt-6 sm:mt-8 md:mt-10 lg:mt-12 transition-all duration-700 delay-450 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="mx-auto max-w-full">
              <WorldMap {...worldMapProps} />
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(VoiceHeroSection);