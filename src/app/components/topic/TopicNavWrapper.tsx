"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import TopicNav from './TopicNav';

export default function TopicNavWrapper() {
  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);
  const pathname = usePathname();

  // Check if we're on the topics page
  const isTopicsPage = pathname === '/topics';

  // Listen for reset navigation events
  useEffect(() => {
    const handleResetNavigation = () => {
      setSelectedMainTopic(null);
    };

    window.addEventListener('resetNavigation', handleResetNavigation);

    return () => {
      window.removeEventListener('resetNavigation', handleResetNavigation);
    };
  }, []);

  const handleTopicSelect = (topicId: string) => {
    console.log(`TopicNavWrapper - handleTopicSelect called with topicId: ${topicId}`);

    // Set the selected topic
    setSelectedMainTopic(topicId);

    // Use a custom event to communicate with the page component
    window.dispatchEvent(new CustomEvent('topicChange', { detail: topicId }));
  };

  return (
    <div className={`topic-navigation w-full ${isTopicsPage ? 'sticky top-12 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-0 mt-0' : 'bg-transparent'}`}>
      <div className="w-full">
        <TopicNav onTopicSelect={handleTopicSelect} selectedTopic={selectedMainTopic} />
      </div>
    </div>
  );
}