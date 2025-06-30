'use client';

import React, { useEffect } from 'react';
import { companies } from '@/data/companies';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export default function CompanyList() {
  const { ref, isVisible, mounted } = useScrollAnimation();
  useEffect(() => {
    // Add animation styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(calc(-50%)); }
      }
      
      .animate-scroll-smooth {
        animation: scroll 30s linear infinite;
      }
      
      @media (max-width: 768px) {
        .animate-scroll-smooth {
          animation: scroll 60s linear infinite;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Clean up the style tag when component unmounts
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
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
      ref={ref}
      className={`mt-20 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <h2 className="text-2xl md:text-3xl font-normal text-center mb-8">
        Practice with Curated Questions from Top Tech Companies
      </h2>
      <div className="w-full overflow-hidden">
        {/* Container with padding to ensure smooth transition */}
        <div className="relative py-2">

          {/* Gradient mask for smoother fade effect at the edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>

          {/* Main carousel with animation */}
          <div className="flex whitespace-nowrap animate-scroll-smooth">
            {/* Duplicate companies for infinite scroll effect */}
            {[...companies, ...companies].map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="flex flex-col items-center justify-center mx-4 sm:mx-6 md:mx-10 w-24 sm:w-28 md:w-32 opacity-80 hover:opacity-100 transition-opacity"
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


