'use client';

import dynamic from 'next/dynamic';

// Import components with no SSR since they use client-side features
const TopicCarousel = dynamic(() => import('./TopicCarousel'), { ssr: false });
const CompanyList = dynamic(() => import('./CompanyList'), { ssr: false });
const ProjectsSection = dynamic(() => import('./ProjectsSection'), { ssr: false });

export default function TopicCarouselWrapper() {
  return (
    <div className="py-16">
      <TopicCarousel />
      <CompanyList />
      <ProjectsSection />
    </div>
  );
}