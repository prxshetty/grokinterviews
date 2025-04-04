import { loadAllTopicTrees } from '@/utils/markdownParser';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import StatsSection from './components/StatsSection';
import TopicCarouselWrapper from './components/TopicCarouselWrapper';
import RotatingTopics from './components/RotatingTopics';
import ThemeToggle from './components/ThemeToggle';
import RandomHeadline from './components/RandomHeadline';

export default async function Home() {
  const topicIds = ['ml', 'sdesign', 'webdev', 'dsa', 'ai'];
  const allTopics = await loadAllTopicTrees(topicIds);
  const topics = topicIds.map(id => ({
    id: id,
    label: allTopics[id]?.label || (id.charAt(0).toUpperCase() + id.slice(1))
  }));
  const numTopics = topics.length;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full relative font-sans transition-colors duration-300">

      {/* Navigation */}
      <div className="flex justify-between items-center p-8 md:p-12">
        <div className="text-sm font-medium uppercase tracking-wide">
          <p>grokinterviews</p>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8 text-xs text-gray-400 dark:text-gray-400">
            <span>Services</span>
            <span>About</span>
            <span>Topics</span>
            <span>Resources</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row min-h-[80vh] p-8 md:p-12">
        {/* Left side content */}
        <div className="w-full md:w-1/3 flex flex-col justify-center mb-12 md:mb-0">
          <div className="mb-8">
            <h2 className="text-sm md:text-base font-medium mb-2">Interview preparation</h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Grokinterviews brings together expert knowledge and practical resources to help you excel in technical interviews. Our mission: make candidates more confident through innovative learning solutions.
            </p>
          </div>
          <button className="flex items-center text-xs font-medium border-b border-gray-300 dark:border-gray-700 pb-1 w-fit hover:border-black dark:hover:border-white transition-colors">
            Explore <ArrowRightIcon className="h-3 w-3 ml-2" />
          </button>
        </div>

        {/* Right side large typography */}
        <div className="w-full md:w-2/3 flex items-center justify-end">
          <RandomHeadline />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-black transition-colors duration-300 border-t border-gray-200 dark:border-gray-800 mt-12">
        <StatsSection />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 px-8 md:px-12 pt-12">
        <div className="max-w-screen-xl mx-auto">
          <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-6 tracking-wider">Our Topics</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl mb-12">
            <p className="mb-4">Browse interview questions by topic and find relevant questions for specific job roles. Our curated content helps you prepare for technical interviews at top companies.</p>
            <p>Select a topic below to start exploring.</p>
          </div>
        </div>
      </div>

      {/* Add the Topic Carousel for Q&A section */}
      <div className="bg-white dark:bg-black transition-colors duration-300">
        <TopicCarouselWrapper />
      </div>

    </div>
  );
}
