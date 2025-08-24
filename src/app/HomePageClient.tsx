'use client';

import { HeroSection } from '@/components/ui/hero-section-1';
import CompanyList from '@/components/home/CompanyList';
import { Suspense, lazy } from 'react';
import { useCentralizedIntersection } from '@/hooks/ui';


// Lazy load non-critical components that are below the fold
const StatsSection = lazy(() => import('@/components/home/StatsSection'));
const TopicCarousel = lazy(() => import('@/components/home/TopicCarousel'));
const FeatureSection = lazy(() => import('@/components/home/FeatureSection').then(module => ({ default: module.FeatureSection })));
const VoiceHeroSection = lazy(() => import('@/components/ui/VoiceHeroSection'));

function TopicCarouselSkeleton() {
  return (
    <div className="py-8 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-8"></div>
      <div className="flex space-x-4 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-none w-64 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

function FeatureSkeleton() {
  return (
    <div className="py-16 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 border rounded-lg">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VoiceHeroSkeleton() {
  return (
    <div className="relative bg-transparent overflow-hidden min-h-[80vh] flex flex-col animate-pulse">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center min-h-[80vh] py-4 sm:py-6 md:py-8 lg:py-12">
          <div className="relative z-10 px-4 sm:px-6 md:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mt-6"></div>
            </div>
          </div>
          <div className="relative w-full max-w-6xl mt-6 sm:mt-8 md:mt-10 lg:mt-12">
            <div className="w-full aspect-[2/1] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ExploreTopicsSection component with centralized scroll animations
function ExploreTopicsSection() {
  const { ref, isVisible, mounted } = useCentralizedIntersection({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    once: true
  });

  if (!mounted) {
    return (
      <div className="mt-24 mb-0 opacity-0">
        <TopicCarouselSkeleton />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`mt-24 mb-0 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="mx-[-1rem] sm:mx-[-1.5rem] md:mx-[-2rem] lg:mx-[-3rem] -mt-4 overflow-x-hidden">
        <Suspense fallback={<TopicCarouselSkeleton />}>
          <TopicCarousel />
        </Suspense>
      </div>
    </div>
  );
}


// Loading skeleton components
function StatsSkeleton() {
  return (
    <div className="py-16 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// TestimonialsSection component with scroll animations
// function TestimonialsSection() {
//   const { ref, isVisible, mounted } = useScrollAnimation();

//   if (!mounted) {
//     return (
//       <div className="mt-0 mb-24 opacity-0">
//         {/* Skeleton content */}
//       </div>
//     );
//   }

//   return (
//     <div
//       ref={ref}
//       className={`mt-0 mb-24 transition-all duration-1000 ${
//         isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
//       }`}
//     >
//       <h2 className="text-2xl md:text-3xl mb-8 text-center font-normal">
//         What Our Users Say
//       </h2>
//       <StaggerTestimonials />
//     </div>
//   );
// }

export default function HomePageClient() {
  return (
    <div className="min-h-[100dvh] w-full relative font-sans animate-fade-in">
      {/* Hero Section */}
      <div>
        <HeroSection />
      </div>

      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Topic Carousel Section - Lazy loaded */}
        <ExploreTopicsSection />
      </div>

      {/* Company List Section */}
      <div className="mt-48 sm:mt-20 md:mt-24 lg:mt-32 w-full">
        <CompanyList />
      </div>

      {/* Stats Section - Lazy loaded */}
      <div className="mt-12 sm:mt-16 md:mt-24">
        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection />
        </Suspense>
      </div>

      {/* Voice Hero Section */}
      <div className="mt-28 sm:mt-24 md:mt-24 mb-16 sm:mb-20 md:mb-24">
        <Suspense fallback={<VoiceHeroSkeleton />}>
          <VoiceHeroSection 
            title="Smarter Conversations, Simplified."
            description="Seamlessly connect through the web or a real-time AI voice call—wherever you are."
          />
        </Suspense>
      </div>
      
      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Feature Section - Lazy loaded */}
        <div className="mt-0 mb-16 sm:mb-20 md:mb-24">
          <Suspense fallback={<FeatureSkeleton />}>
            <FeatureSection />
          </Suspense>
        </div>
      </div>

      {/* Testimonials Section - Hidden for now */}
      {/* <TestimonialsSection /> */}
    </div>
  );
}