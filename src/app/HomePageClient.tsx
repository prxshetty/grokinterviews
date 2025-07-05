'use client';

import { HeroSection } from '@/components/ui/hero-section-1';
import CompanyList from '@/components/home/CompanyList';
import StatsSection from '@/components/home/StatsSection';
import TopicCarousel from '@/components/home/TopicCarousel';
import { FeatureSection } from '@/components/home/FeatureSection';
// import { StaggerTestimonials } from '@/components/ui/stagger-testimonials';
import { useScrollAnimation } from '@/hooks/ui';

// ExploreTopicsSection component with scroll animations
function ExploreTopicsSection() {
  const { ref, isVisible, mounted } = useScrollAnimation();

  if (!mounted) {
    return (
      <div className="mt-24 mb-0 opacity-0">
        {/* Skeleton content */}
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
        <TopicCarousel />
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
      {/* Hero Section - Full viewport height */}
      <div className="mb-16">
        <HeroSection />
      </div>

      {/* Company List Section */}
      <div className="mt-16">
        <CompanyList />
      </div>

      {/* Stats Section - Full width without padding wrapper */}
      <div className="mt-16 md:mt-24">
        <StatsSection />
      </div>

      <div className="px-8 md:px-12">
        {/* Topic Carousel Section */}
        <ExploreTopicsSection />

        {/* Feature Section */}
        <div className="mt-0 mb-24">
          <FeatureSection />
        </div>
      </div>

      {/* Testimonials Section - Hidden for now */}
      {/* <TestimonialsSection /> */}
    </div>
  );
} 