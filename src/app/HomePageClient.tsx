'use client';

import { HeroSection } from '@/components/ui/hero-section-1';
import {
  StatsSection,
  TopicCarousel,
  CompanyList,
  FeatureSection,
} from '@/components/home';
import { StaggerTestimonials } from '@/components/ui/stagger-testimonials';

export default function HomePageClient() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full pt-4 relative font-sans animate-fade-in">
      <HeroSection />

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
          <h2 className="text-2xl md:text-3xl mb-8 text-center font-normal">
            Explore Topics
          </h2>
          <div className="-mx-8 md:-mx-12 lg:-mx-16 -mt-4">
            <TopicCarousel />
          </div>
        </div>

        {/* Feature Section */}
        <div className="mt-0 mb-24">
          <FeatureSection />
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mt-0 mb-24">
        <h2 className="text-2xl md:text-3xl mb-8 text-center font-normal">
          What Our Users Say
        </h2>
        <StaggerTestimonials />
      </div>
    </div>
  );
} 