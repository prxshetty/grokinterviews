'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  StatsSection,
  TopicCarousel,
  CompanyList,
  FeatureSection,
} from '@/components/home';
import { BackgroundPathsOnly } from '@/components/home/background';
import { LoadingSpinner } from '@/components/ui';

export default function HomePageClient() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for 1.5 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-black">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full pt-4 relative font-sans animate-fade-in">
      {/* Hero Section */}
      <div className="hero-section relative z-10 flex flex-col justify-center items-start min-h-screen pt-24 md:pt-32 overflow-hidden">
        {/* Background Paths */}
        <div className="absolute inset-0 -z-10">
          <BackgroundPathsOnly />
        </div>
        
        <div className="w-full relative z-10 px-8 md:px-12">
          <h2 className="text-2xl md:text-3xl text-gray-600 dark:text-gray-400 font-light tracking-wide">
            GrokInterviews
          </h2>
          <h1 className="text-3xl sm:text-5xl md:text-7xl mt-2 font-light tracking-tight leading-tight text-black dark:text-white">
            Ace Your Tech Interview.
          </h1>
          <div className="mt-6 md:mt-12">
            <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 mb-2">
              Explore
            </p>
            <div className="flex flex-wrap gap-1 max-w-[500px] max-h-[3.5rem] overflow-hidden">
              {['ML', 'Web Dev','System Design', 'DSA'].map((domain) => (
                <Link
                  key={domain}
                  href={`/topics/${domain.toLowerCase().replace(' ', '-')}`}
                  className="group relative overflow-hidden rounded-full border border-blue-500 px-2.5 py-1 md:px-5 md:py-2 text-[10px] md:text-sm font-medium hover:bg-blue-500 dark:border-blue-400 dark:hover:bg-blue-400 transition-colors duration-200"
                >
                  <div className="flex flex-col h-[14px] md:h-[20px] leading-[14px] md:leading-[20px]">
                    <span className="text-blue-500 dark:text-blue-400 group-hover:hidden">{domain}</span>
                    <span className="text-white dark:text-black hidden group-hover:inline">{domain}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Company List Section */}
      <div className="mt-16">
          <CompanyList />
        </div>

      <div className="px-8 md:px-12">
        {/* Stats Section */}
        <div className="mt-16 md:mt-24">
          <StatsSection />
        </div>

        
        {/* Topic Carousel Section */}
        <div className="mt-24 mb-0">
          <h2 className="text-2xl md:text-3xl mb-8 text-center font-normal">Explore Topics</h2>
          <div className="-mx-8 md:-mx-12 lg:-mx-16 -mt-4">
            <TopicCarousel />
          </div>
        </div>

        {/* Feature Section */}
        <div className="mt-0 mb-24">
          <FeatureSection />
        </div>
      </div>
    </div>
  );
} 