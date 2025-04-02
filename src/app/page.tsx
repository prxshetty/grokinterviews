import { loadAllTopicTrees } from '@/utils/markdownParser';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import StatsSection from './components/StatsSection';
import TopicCarouselWrapper from './components/TopicCarouselWrapper';
import RotatingTopics from './components/RotatingTopics';

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
      
      <div className="absolute top-8 left-8 text-xs text-gray-500 dark:text-gray-400">
        <p>grokinterviews</p>
        <p>change starts within.</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-16 md:mt-8">
        
        <div className="w-full md:w-7/12 mb-8 md:mb-0">
          <h1 className="text-5xl md:text-7xl font-bold uppercase leading-none tracking-tight mb-4">
            IT'S ABOUT<br />
            DAMN TIME<br />
            TO GET GOOD<br />
            AT SOMETHING.
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
            Browse interview questions by topic and find relevant<br /> 
            questions for specific job roles.
          </p>
        </div>

        <div className="w-full md:w-4/12 flex justify-center md:justify-end items-center">
          <RotatingTopics />
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
