"use client";

import { useEffect, useState } from 'react';

const mainTopics = [
  { id: 'ml', label: 'Machine Learning' },
  { id: 'ai', label: 'Artificial Intelligence' },
  { id: 'webdev', label: 'Web Development' },
  { id: 'system-design', label: 'System Design' },
  { id: 'dsa', label: 'Data Structures & Algorithms' }
];

interface TopicNavProps {
  onTopicSelect: (topicId: string) => void;
  selectedTopic?: string | null;
}

export default function TopicNav({ onTopicSelect, selectedTopic: externalSelectedTopic }: TopicNavProps) {
  const [internalSelectedTopic, setInternalSelectedTopic] = useState<string | null>(null);
  
  // Sync with external state when it changes
  useEffect(() => {
    if (externalSelectedTopic !== undefined) {
      setInternalSelectedTopic(externalSelectedTopic);
    }
  }, [externalSelectedTopic]);

  const handleTopicClick = (topicId: string) => {
    setInternalSelectedTopic(topicId);
    onTopicSelect(topicId);
  };

  // Use external selected topic if provided, otherwise use internal state
  const effectiveSelectedTopic = externalSelectedTopic !== undefined ? externalSelectedTopic : internalSelectedTopic;

  return (
    <div className="w-full py-4 px-6 font-mono border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-6 overflow-x-auto">
        {mainTopics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicClick(topic.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              effectiveSelectedTopic === topic.id
                ? 'font-bold text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:underline'
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>
    </div>
  );
} 