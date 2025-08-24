'use client';

import React, { useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/ui';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

// Resource data with logos and information
const resources = [
  {
    name: 'YouTube',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    className: 'h-7 w-auto dark:brightness-[.8] dark:contrast-[1.2]',
    description: 'Video tutorials and lectures'
  },
  {
    name: 'GitHub',
    logo: 'https://html.tailus.io/blocks/customers/github.svg',
    className: 'h-7 w-auto dark:invert',
    description: 'Code repositories and projects'
  },
  {
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    className: 'h-7 w-32 dark:brightness-[.8] dark:contrast-[1.2]',
    description: 'Research papers and documentation'
  },
  {
    name: 'GeeksforGeeks',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg',
    className: 'h-8 w-auto dark:brightness-[.8] dark:contrast-[1.2]',
    description: 'Programming tutorials and practice'
  },
  {
    name: 'Stack Overflow',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Stack_Overflow_icon.svg',
    className: 'h-8 w-auto dark:invert',
    description: 'Q&A and problem solving'
  },
  {
    name: 'NVIDIA',
    logo: 'https://html.tailus.io/blocks/customers/nvidia.svg',
    className: 'h-8 w-auto dark:invert',
    description: 'AI and GPU computing resources'
  },
  {
    name: 'OpenAI',
    logo: 'https://html.tailus.io/blocks/customers/openai.svg',
    className: 'h-8 w-auto dark:invert',
    description: 'AI research and tools'
  },
  {
    name: 'arXiv',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/ArXiv_logo_2022.svg',
    className: 'h-8 w-auto dark:invert',
    description: 'Academic papers and preprints'
  },
  {
    name: 'Medium',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Medium_logo_Monogram.svg',
    className: 'h-8 w-auto dark:invert',
    description: 'Technical articles and insights'
  },
  {
    name: 'Hugging Face',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Hf-logo-with-title.svg',
    className: 'h-8 w-auto dark:invert',
    description: 'ML papers with implementation'
  },
  {
    name: 'Bing',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Bing_Fluent_Logo.svg',
    className: 'h-8 w-auto dark:brightness-[.8] dark:contrast-[1.2]',
    description: 'Search and research tools'
  },
  {
    name: 'LeetCode',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png',
    className: 'h-8 w-auto dark:invert',
    description: 'Coding practice and interviews'
  },
  {
    name: 'Reddit',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Reddit_logo.svg',
    className: 'h-8 w-auto dark:brightness-[2] dark:contrast-[0.8]',
    description: 'Programming communities and discussions'
  },
  {
    name: 'Wikipedia',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Wikipedia-logo-v2.svg',
    className: 'h-8 w-auto dark:invert',
    description: 'Knowledge base and references'
  }
];

export default function ResourceCarousel() {
  const { ref, isVisible, mounted } = useScrollAnimation();
  useEffect(() => {
    // Add animation styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scroll-left {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      
      @keyframes scroll-right {
        0% { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }
      
      .animate-scroll-left {
        display: flex;
        animation: scroll-left 40s linear infinite;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: translate3d(0, 0, 0);
        contain: content;
        min-width: 100%;
      }
      
      .animate-scroll-right {
        display: flex;
        animation: scroll-right 40s linear infinite;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: translate3d(0, 0, 0);
        contain: content;
        min-width: 100%;
      }
      
      .animate-scroll-left:hover,
      .animate-scroll-right:hover {
        animation-play-state: paused;
      }
      
      @media (max-width: 640px) {
        .animate-scroll-left,
        .animate-scroll-right {
          animation-duration: 60s;
        }
      }
      
      @media (max-width: 768px) {
        .animate-scroll-left,
        .animate-scroll-right {
          animation-duration: 50s;
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

  // Show invisible placeholder during SSR to prevent layout shift
  if (!mounted) {
    return (
      <div className="mt-12 sm:mt-16 md:mt-20 transition-all duration-1000 w-full">
        {/* Title and Subtitle Placeholder */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-3 sm:px-4 md:px-6">
          <div className="h-8 sm:h-10 md:h-12 lg:h-14 w-64 sm:w-80 md:w-96 mx-auto opacity-0 mb-4 sm:mb-6" /> {/* Invisible title placeholder */}
          <div className="h-4 sm:h-5 md:h-6 w-48 sm:w-64 md:w-80 mx-auto opacity-0" /> {/* Invisible subtitle placeholder */}
        </div>
        <div className="group w-full overflow-hidden relative max-w-[100vw]">
          <div className="relative py-2 sm:py-3 w-full overflow-hidden">
            {/* Row 1 skeleton */}
            <div className="flex whitespace-nowrap mb-0 sm:mb-3">
              {[...Array(14)].map((_, index) => (
                <div
                  key={`row1-${index}`}
                  className="flex flex-col items-center justify-center mx-2 sm:mx-3 md:mx-4 lg:mx-6 xl:mx-8 w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32 opacity-0 flex-shrink-0"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 mb-3 sm:mb-4" />
                </div>
              ))}
            </div>
            {/* Row 2 skeleton */}
            <div className="flex whitespace-nowrap">
              {[...Array(7)].map((_, index) => (
                <div
                  key={`row2-${index}`}
                  className="flex flex-col items-center justify-center mx-2 sm:mx-3 md:mx-4 lg:mx-6 xl:mx-8 w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32 opacity-0 flex-shrink-0"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 mb-3 sm:mb-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`mt-12 sm:mt-16 md:mt-20 transition-all duration-1000 w-full ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {/* Title and Subtitle Section */}
      <div className="text-center mb-8 sm:mb-12 md:mb-16 px-3 sm:px-4 md:px-6">
        <h2 className="text-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-editorial font-extralight leading-[110%] tracking-[-1.8px] mb-4 sm:mb-6">
          Powered by <span className="italic">Millions</span> of Resources
        </h2>
        <p className="max-w-2xl mx-auto text-balance text-sm sm:text-base md:text-lg text-muted-foreground">
          Our AI aggregates knowledge from top platforms, research papers, and developer communities to provide you with comprehensive interview preparation.
        </p>
      </div>
      
      <div className="group w-full overflow-hidden relative">
        {/* Gradient masks removed for cleaner look */}
        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
          <Link
            href="/about"
            className="block text-xs sm:text-sm duration-150 hover:opacity-75 bg-white/30 dark:bg-black/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
          >
            <span>Explore All Resources</span>
            <ChevronRight className="ml-1 inline-block size-3" />
          </Link>
        </div>
        {/* Container with padding to ensure smooth transition */}
        <div className="relative py-3 sm:py-4 md:py-6 w-full overflow-hidden">


          {/* Row 1: All companies scrolling left */}
          <div className="flex whitespace-nowrap animate-scroll-left w-max">
            {/* Duplicate resources for infinite scroll effect */}
            {[...resources, ...resources].map((resource, index) => (
              <div
                key={`${resource.name}-row1-${index}`}
                className="flex flex-col items-center justify-center mx-3 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-10 w-20 sm:w-24 md:w-28 lg:w-32 xl:w-36 opacity-80 hover:opacity-100 transition-all duration-300 group/item flex-shrink-0"
              >
                {/* Logo container - Fixed sizing for perfect fit */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 transform transition-transform duration-300 ease-in-out mb-3 sm:mb-4 flex items-center justify-center group-hover/item:scale-110 bg-white/5 dark:bg-black/5 rounded-lg backdrop-blur-sm">
                   <Image
                    src={resource.logo}
                    alt={`${resource.name} Logo`}
                    className={`${resource.className} max-h-[70%] max-w-[70%] object-contain`}
                    width={120}
                    height={120}
                    unoptimized
                    priority={index < resources.length} // Prioritize first set for LCP
                  />
                </div>
                {/* Description tooltip */}
                <div className="absolute top-full mt-2 sm:mt-3 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/80 text-white dark:text-black text-xs sm:text-sm px-3 py-1 sm:py-1.5 rounded opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 backdrop-blur-sm">
                  {resource.description}
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: Half companies scrolling right */}
          <div className="flex whitespace-nowrap animate-scroll-right w-max">
            {/* Use half the resources for second row */}
            {[...resources.slice(0, Math.ceil(resources.length / 2)), ...resources.slice(0, Math.ceil(resources.length / 2))].map((resource, index) => (
              <div
                key={`${resource.name}-row2-${index}`}
                className="flex flex-col items-center justify-center mx-3 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-10 w-20 sm:w-24 md:w-28 lg:w-32 xl:w-36 opacity-80 hover:opacity-100 transition-all duration-300 group/item flex-shrink-0"
              >
                {/* Logo container - Fixed sizing for perfect fit */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 transform transition-transform duration-300 ease-in-out mb-3 sm:mb-4 flex items-center justify-center group-hover/item:scale-110 bg-white/5 dark:bg-black/5 rounded-lg backdrop-blur-sm">
                   <Image
                    src={resource.logo}
                    alt={`${resource.name} Logo`}
                    className={`${resource.className} max-h-[70%] max-w-[70%] object-contain`}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
                {/* Description tooltip */}
                <div className="absolute top-full mt-2 sm:mt-3 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/80 text-white dark:text-black text-xs sm:text-sm px-3 py-1 sm:py-1.5 rounded opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 backdrop-blur-sm">
                  {resource.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
