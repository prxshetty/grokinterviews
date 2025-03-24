import React from 'react';

interface TopicSelectorProps {
  topics: string[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  selectedTopic,
  onSelectTopic,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-slate-900">Select a Topic</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {topics.map((topic) => (
          <button
            key={topic}
            className={`p-3 rounded-lg border transition-colors ${
              selectedTopic === topic
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-900 hover:bg-gray-100'
            }`}
            onClick={() => onSelectTopic(topic)}
          >
            {topic.charAt(0).toUpperCase() + topic.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector; 