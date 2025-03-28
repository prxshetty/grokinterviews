"use client";

import { useState } from 'react';

const mainTopics = [
  { id: 'ml', label: 'Machine Learning' },
  { id: 'ai', label: 'Artificial Intelligence' },
  { id: 'webdev', label: 'Web Development' },
  { id: 'system-design', label: 'System Design' },
  { id: 'dsa', label: 'Data Structures & Algorithms' }
];

interface TopicNavProps {
  onTopicSelect: (topicId: string) => void;
}

export default function TopicNav({ onTopicSelect }: TopicNavProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
    onTopicSelect(topicId);
  };

  return (
    <div className="w-full py-4 px-6 font-mono border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-6 overflow-x-auto">
        {mainTopics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicClick(topic.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedTopic === topic.id
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>
    </div>
  );
} 