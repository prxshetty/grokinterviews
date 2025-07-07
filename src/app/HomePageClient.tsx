'use client';

import { HeroSection } from '@/components/ui/hero-section-1';
import { Suspense, lazy } from 'react';
import { useScrollAnimation } from '@/hooks/ui';

// Lazy load non-critical components that are below the fold
const StatsSection = lazy(() => import('@/components/home/StatsSection'));
const TopicCarousel = lazy(() => import('@/components/home/TopicCarousel'));
const FeatureSection = lazy(() => import('@/components/home/FeatureSection').then(module => ({ default: module.FeatureSection })));

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

// ExploreTopicsSection component with scroll animations
function ExploreTopicsSection() {
  const { ref, isVisible, mounted } = useScrollAnimation();

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
      <h2 className="text-2xl md:text-3xl mb-8 text-center font-normal">
        Explore Topics
      </h2>
      <div className="-mx-8 md:-mx-12 lg:-mx-16 -mt-4">
        <Suspense fallback={<TopicCarouselSkeleton />}>
          <TopicCarousel />
        </Suspense>
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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full relative font-sans animate-fade-in">
      {/* Hero Section with integrated CompanyList */}
      <div className="mb-32">
        <HeroSection />
      </div>

      {/* Stats Section - Lazy loaded */}
      <div className="mt-16 md:mt-24">
        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection />
        </Suspense>
      </div>

      <div className="px-8 md:px-12">
        {/* Topic Carousel Section - Lazy loaded */}
        <ExploreTopicsSection />

        {/* Feature Section - Lazy loaded */}
        <div className="mt-0 mb-24">
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