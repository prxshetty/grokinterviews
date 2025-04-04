'use client';

import React from 'react';
import { companies } from '@/data/companies';

export default function CompanyList() {
  return (
    <div className="mt-20 mb-16">
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
