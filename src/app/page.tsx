import { loadAllTopicTrees } from '@/utils/markdownParser';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import StatsSection from './components/StatsSection';
import TopicCarouselWrapper from './components/TopicCarouselWrapper';
import RandomHeadline from './components/RandomHeadline';
import ThemeToggle from './components/ThemeToggle';
import Navbar from './components/Navbar';

export default async function Home() {
  const topicIds = ['ml', 'sdesign', 'webdev', 'dsa', 'ai'];
  const allTopics = await loadAllTopicTrees(topicIds);
  const topics = topicIds.map(id => ({
    id: id,
    label: allTopics[id]?.label || (id.charAt(0).toUpperCase() + id.slice(1))
  }));
  const numTopics = topics.length;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full p-8 md:p-12 relative font-sans">
      <Navbar />

      <div className="absolute top-8 left-8 text-xs text-gray-500 dark:text-gray-400 hidden">
        <p>grokinterviews</p>
        <p>change starts within.</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-16 md:mt-8">
        <div className="absolute top-8 right-8 hidden">
          <ThemeToggle />
        </div>

        <div className="w-full md:w-7/12 mb-8 md:mb-0">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Browse interview questions by topic and find relevant questions for specific job roles.
          </p>
        </div>

        <div className="w-full md:w-5/12 flex justify-center md:justify-end items-center">
          <RandomHeadline />
        </div>
      </div>

      <hr className="border-gray-300 dark:border-gray-700 my-8 md:my-12" />

      <div>
        <h3 className="text-sm uppercase font-semibold text-gray-600 dark:text-gray-400 mb-4">About</h3>
        <div className="text-sm text-gray-800 dark:text-gray-200">
           <p>Browse interview questions by topic and find relevant questions for specific job roles.</p>
           <p>Click the red box above to explore all topics!</p>
        </div>
      </div>

      <StatsSection />

      {/* Add the Topic Carousel for Q&A section */}
      <TopicCarouselWrapper />

    </div>
  );
}
