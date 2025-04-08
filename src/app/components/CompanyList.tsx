'use client';

import React, { useState, useEffect, useRef } from 'react';
import { companies } from '@/data/companies';

export default function CompanyList() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Use a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // When the section is 20% visible, trigger the animation
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.2 } // Trigger when 20% of the element is visible
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => {
        if (sectionRef.current) {
          observer.unobserve(sectionRef.current);
        }
      };
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);
  // Don't animate if not mounted yet to prevent hydration issues
  if (!mounted) {
    return (
      <div className="mt-20 mb-16 opacity-0">
        {/* Skeleton content */}
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className={`mt-20 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <h2 className="text-lg md:text-xl font-semibold mb-8 text-center tracking-tight">Companies You Can Join With These Skills</h2>
      <div className="w-full overflow-hidden">
        {/* Container with padding to ensure smooth transition */}
        <div className="relative py-2">
          {/* Gradient mask for smoother fade effect at the edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>

          {/* Main carousel with animation */}
          <div className="flex animate-scroll-smooth">
            {/* Display companies in a fixed order to avoid hydration errors */}
            {(() => {
              // Use a fixed order for server-side rendering compatibility
              // We'll duplicate the array for the scrolling effect
              return [...companies, ...companies].map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="flex flex-col items-center justify-center mx-10 w-32 opacity-80 hover:opacity-100 transition-opacity"
              >
                {/* SVG container with larger dimensions */}
                <div
                  className="w-16 h-16 text-gray-800 dark:text-gray-200 transform transition-transform duration-300 ease-in-out mb-3 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: company.svg }}
                />
                {/* Company Name with better alignment */}
                <p className="text-sm font-sans text-gray-600 dark:text-gray-400 whitespace-nowrap text-center">
                  {company.name}
                </p>
              </div>
            ))
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
