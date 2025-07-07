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
      @keyframes scroll {
        0% { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(calc(-50%), 0, 0); }
      }
      
      .animate-scroll-smooth {
        animation: scroll 30s linear infinite;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      
      @media (max-width: 768px) {
        .animate-scroll-smooth {
          animation: scroll 40s linear infinite;
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
      <div className="relative m-auto max-w-5xl px-6 mb-8">
        <h2 className="text-2xl md:text-3xl font-normal text-center">
          Curated Resources for Engineers
        </h2>
      </div>
      <div className="group w-full overflow-hidden relative">
        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
          <Link
            href="/about"
            className="block text-sm duration-150 hover:opacity-75 bg-white/90 dark:bg-black/90 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
          >
            <span>Explore All Resources</span>
            <ChevronRight className="ml-1 inline-block size-3" />
          </Link>
        </div>
        {/* Container with padding to ensure smooth transition */}
        <div className="relative py-2">

          {/* Gradient mask for smoother fade effect at the edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10"></div>

          {/* Main carousel with animation */}
          <div className="flex whitespace-nowrap animate-scroll-smooth group-hover:blur-sm transition-all duration-500" style={{ transform: 'translateZ(0)' }}>
            {/* Duplicate resources for infinite scroll effect */}
            {[...resources, ...resources].map((resource, index) => (
              <div
                key={`${resource.name}-${index}`}
                className="flex flex-col items-center justify-center mx-4 sm:mx-6 md:mx-10 w-24 sm:w-28 md:w-32 opacity-80 hover:opacity-100 transition-all duration-300 group/item"
              >
                {/* Logo container */}
                <div className="w-16 h-16 transform transition-transform duration-300 ease-in-out mb-3 flex items-center justify-center group-hover/item:scale-110">
                  <Image
                    src={resource.logo}
                    alt={`${resource.name} Logo`}
                    className={resource.className}
                    width={64}
                    height={64}
                    unoptimized
                    priority={index < resources.length} // Prioritize first set for LCP
                  />
                </div>
                {/* Resource Name - Commented out for now */}
                {/* <p className="text-sm font-sans text-gray-600 dark:text-gray-400 whitespace-nowrap text-center group-hover/item:text-gray-900 dark:group-hover/item:text-gray-100 transition-colors">
                  {resource.name}
                </p> */}
                {/* Description tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black/90 dark:bg-white/90 text-white dark:text-black text-xs px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {resource.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


