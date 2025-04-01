'use client';

import dynamic from 'next/dynamic';

// Import the TopicCarousel with no SSR since it uses client-side features
const TopicCarousel = dynamic(() => import('./TopicCarousel'), { ssr: false });

export default function TopicCarouselWrapper() {
  return <TopicCarousel />;
} 