import React, { useState } from 'react';

interface SimpleTopicTreeProps {
  onSelectTopic: (topicId: string) => void;
}

const SimpleTopicTree: React.FC<SimpleTopicTreeProps> = ({ onSelectTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Sample data
  const topics = [
    { id: 'exposition', label: 'Exposition', project: 'Spanish Freak Show' },
    { id: 'editorial-branding', label: 'Editorial / Branding', project: 'Azul Magazine' },
    { id: 'branding', label: 'Branding', project: 'Velaz Music' },
    { id: 'typography', label: 'Typography', project: 'Pysoni Numerology' },
    { id: 'event-branding', label: 'Event / Branding', project: 'Oh Holy Festivals!' },
    { id: 'editorial', label: 'Editorial', project: 'Oh Holy Festivals! - Informe' },
    { id: 'exposition-illustration', label: 'Exposition / Illustration', project: 'FastExpo\'17' },
    { id: 'illustration', label: 'Illustration', project: 'Kam_air_sutra' },
    { id: 'art-direction', label: 'Art Direction', project: 'Europe Mode Catalogue' },
    { id: 'inphographics', label: 'Inphographics', project: 'Infografías - Yorokobu Mag' },
    { id: 'typography-illustration', label: 'Typography / Illustration', project: 'Numerografía 79- Yorokobu Mag' },
    { id: 'illustration2', label: 'Illustration', project: 'Chamartin Station Map' },
    { id: 'illustration3', label: 'Illustration', project: 'Plano Festival SOS4.8' },
    { id: 'typography-illustration2', label: 'Typography / Illustration', project: 'Moustachetype - 36DaysofType' },
  ];

  const handleTopicClick = (topicId: string) => {
    console.log('SimpleTopicTree - handleTopicClick:', topicId);
    setSelectedTopic(topicId);
    onSelectTopic(topicId);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Topic Tree</h3>
      
      <div className="grid grid-cols-1 gap-2">
        {topics.map((topic) => (
          <div 
            key={topic.id}
            className={`p-2 rounded cursor-pointer ${
              selectedTopic === topic.id 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleTopicClick(topic.id)}
          >
            <div className="flex justify-between">
              <div>{topic.label}</div>
              <div className="text-gray-500 dark:text-gray-400">{topic.project}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleTopicTree;
