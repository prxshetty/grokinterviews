'use client';

import { useState, useEffect, useRef } from 'react';
import { WorldMap } from './map';

interface VoiceHeroSectionProps {
  title: string;
  description: string;
}

export default function VoiceHeroSection({
  description
}: VoiceHeroSectionProps) {
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

  // Sample data for WorldMap
  const mapDots = [
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
  ];

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
          <div className={`relative z-10 px-4 sm:px-6 md:px-8 text-center transition-all duration-700 delay-150 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-editorial font-extralight leading-[110%] tracking-[-1.8px] text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                <span className="block">
                  <span className="italic">Smarter</span> Conversations, Simplified.
                </span>
              </h1>
              
              <p className={`mt-4 text-base text-gray-500 dark:text-gray-300 sm:mt-6 sm:text-lg md:text-xl lg:text-xl max-w-2xl mx-auto transition-all duration-700 delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {description}
              </p>
            </div>
          </div>

          {/* WorldMap Section */}
          <div className={`relative w-full max-w-6xl mt-6 sm:mt-8 md:mt-10 lg:mt-12 transition-all duration-700 delay-450 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <WorldMap 
              dots={mapDots}
              lineColor="#0ea5e9"
              showLabels={true}
              animationDuration={2}
              loop={true}
            />
          </div>



        </div>
      </div>
    </div>
  );
}