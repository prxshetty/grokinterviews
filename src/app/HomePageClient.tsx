'use client';

import { HeroSection } from '@/components/ui/hero-section-1';
import CompanyList from '@/components/home/CompanyList';
import { Suspense, lazy } from 'react';
import { useCentralizedIntersection } from '@/hooks/ui';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import VoiceHeroSection from '@/components/ui/VoiceHeroSection';



// Lazy load non-critical components that are below the fold
const FeatureSection = lazy(() => import('@/components/home/FeatureSection').then(module => ({ default: module.FeatureSection })));



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




// Loading skeleton components



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

function FeatureSectionWrapper() {
  const { ref, isVisible, mounted } = useCentralizedIntersection({
    threshold: 0.05,
    rootMargin: '800px',
    once: true
  })

  if (!mounted) {
    return (
      <div className="mt-0 mb-16 sm:mb-20 md:mb-24 opacity-0">
        <FeatureSkeleton />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`mt-0 mb-16 sm:mb-20 md:mb-24 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {isVisible ? (
        <Suspense fallback={<FeatureSkeleton />}>
          <FeatureSection />
        </Suspense>
      ) : (
        <FeatureSkeleton />
      )}
    </div>
  )
}

export default function HomePageClient() {
  return (
    <div className="min-h-[100dvh] w-full relative font-sans animate-fade-in">
      {/* Hero Section */}
      <div>
        <HeroSection />
      </div>

      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl md:text-6xl font-editorial font-light leading-[110%] tracking-[-1.8px]">
              <span className="italic font-extralight">Maestro</span> of interviews
            </h1>
          </>
        }
        images={[
          { 
            src: "/images/domain.webp", 
            srcDark: "/images/domain_dark.webp", 
            alt: "Domain Expertise Interface" 
          },
          { 
            src: "/images/transcripts.webp", 
            srcDark: "/images/transcripts_dark.webp", 
            alt: "Transcripts Interface" 
          },
          { 
            src: "/images/voice.webp", 
            srcDark: "/images/voice_dark.webp", 
            alt: "Voice Interview Interface" 
          },
          { 
            src: "/images/qa.webp", 
            srcDark: "/images/qa_dark.webp", 
            alt: "Q&A Interview Interface" 
          },
          { 
            src: "/images/bookmark.webp", 
            srcDark: "/images/bookmark_dark.webp", 
            alt: "Bookmark Interview Interface" 
          },
        ]}
      />

      {/* Company List Section */}
      <div className="mt-32 sm:mt-20 md:mt-24 lg:mt-28 w-full">
        <CompanyList />
      </div>


      {/* Voice Hero Section */}
      <div className="mt-16 sm:mt-16 md:mt-20 lg:mt-24 mb-12 sm:mb-16 md:mb-20">
        <VoiceHeroSection title="Voice Interview" description="Seamlessly connect through the web or a real-time AI voice call—wherever you are." />
      </div>
      {/* Feature Section - Lazy loaded */}
      <FeatureSectionWrapper />

      {/* Testimonials Section - Hidden for now */}
      {/* <TestimonialsSection /> */}
    </div>
  );
}