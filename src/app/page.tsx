import Link from 'next/link';
import { StatsSection, TopicCarousel, CompanyList, ProjectsSection, RandomHeadline } from './components';

export default async function Home() {

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full pt-4 px-8 md:px-12 relative font-sans">
      {/* Background for Hero Section */}
      <div className="absolute inset-0 w-full h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-white dark:bg-black">
          {/* Light mode SVG background */}
          <div className="absolute inset-0 block dark:hidden opacity-20">
            <img
              src="/bg/complete-bg.svg"
              alt="Background Pattern"
              className="absolute top-0 left-0 w-full h-full object-contain"
            />
          </div>
          {/* Dark mode - Subtle radial gradient for depth */}
          <div className="absolute inset-0 bg-gradient-radial from-gray-900 to-black opacity-30 hidden dark:block"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-section relative z-10 flex flex-col md:flex-row justify-between items-center mt-24 md:mt-16">
        <div className="w-full md:w-5/12 mb-8 md:mb-0">
          <h1 className="text-3xl md:text-4xl mb-6 font-normal tracking-tight">Grok Interviews</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Browse interview questions by topic and find relevant questions for specific job roles.
          </p>
          <Link
            href="/topics"
            className="group inline-block mt-2 text-sm text-black dark:text-white relative"
          >
            <span className="relative inline-block">
              Explore topics →
              {/* Single underline */}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
        </div>

        <div className="w-full md:w-7/12 flex justify-center md:justify-end items-center">
          <div className="text-right">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-black dark:text-white">
              <div>THE WAIT IS</div>
              <div>OVER.</div>
              <div>DOMINATE</div>
              <div className="mt-4">NOW</div>
            </h1>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-32 md:mt-40">
        <StatsSection />
      </div>

      {/* Company List Section */}
      <div className="mt-16">
        <CompanyList />
      </div>

      {/* Topic Carousel Section */}
      <div className="mt-24 mb-24 overflow-hidden">
        <h2 className="text-2xl md:text-3xl mb-8 text-center font-normal">Explore Topics</h2>
        <div className="-mx-8 md:-mx-12 lg:-mx-16 -mt-4">
          <TopicCarousel />
        </div>
      </div>

      {/* Projects Section */}
      <div className="mt-16 mb-24">
        <ProjectsSection />
      </div>

    </div>
  );
}
