import { loadAllTopicTrees } from '@/utils/markdownParser';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import StatsSection from './components/StatsSection';
import TopicCarouselWrapper from './components/TopicCarouselWrapper';

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

        <div className="w-full md:w-auto flex justify-end">
           <Link href="/topics" className="bg-red-600 text-white p-6 rounded-lg flex flex-col items-start justify-between w-full md:w-48 h-48 transform transition-transform hover:scale-105">
             <div>
               <p className="text-xs uppercase font-semibold mb-1">Topics</p>
               <h2 className="text-xl font-bold leading-tight">EXPLORE ALL INTERVIEW TOPICS</h2>
             </div>
             <div className="flex justify-between items-end w-full mt-auto">
               <ArrowRightIcon className="h-8 w-8" />
               <span className="text-4xl font-bold">{numTopics}</span>
             </div>
          </Link>
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
