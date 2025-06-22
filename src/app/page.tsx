import Link from 'next/link';
import {
  StatsSection,
  TopicCarousel,
  CompanyList,
  FeatureSection,
} from '@/components/home';
import { BackgroundPathsOnly } from '@/components/home/background';

export default async function Home() {

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full pt-4 relative font-sans">
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
          <h1 className="text-5xl md:text-7xl mt-2 font-light tracking-tight leading-tight text-black dark:text-white">
            Ace Your Tech Interview.
          </h1>
          <div className="mt-12 flex items-center gap-4">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Explore
            </p>
            <div className="flex flex-wrap gap-1">
              {['ML', 'Web Dev','System Design', 'DSA'].map((domain) => (
                <Link
                  key={domain}
                  href={`/topics/${domain.toLowerCase().replace(' ', '-')}`}
                  className="group relative overflow-hidden rounded-full border border-blue-500 px-5 py-2 text-sm font-medium hover:bg-blue-500 dark:border-blue-400 dark:hover:bg-blue-400 transition-colors duration-200"
                >
                  <div className="flex flex-col h-[20px] leading-[20px]">
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
