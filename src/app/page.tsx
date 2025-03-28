"use client";

import { useState, useEffect } from 'react';
import QuestionWithAnswer from './components/QuestionWithAnswer';

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Listen for topic change events from the TopicNav component
  useEffect(() => {
    const handleTopicChange = (event: CustomEvent<string>) => {
      const topicId = event.detail;
      setSelectedTopic(topicId);
    };

    window.addEventListener('topicChange', handleTopicChange as EventListener);
    
    return () => {
      window.removeEventListener('topicChange', handleTopicChange as EventListener);
    };
  }, []);

  return (
    <div className="container mx-auto">
      <div className="w-full">
        {selectedTopic ? (
          <QuestionWithAnswer topicId={selectedTopic} />
        ) : (
          <div className="mt-8 p-6 border border-gray-200 dark:border-gray-800 rounded-lg font-mono">
            <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Welcome to Grokking Interviews</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Select a topic from the navigation bar above to view related questions and answers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
