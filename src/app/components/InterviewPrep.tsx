import { useState } from 'react';
import TopicList from './TopicList';
import QuestionWithAnswer from './QuestionWithAnswer';

export default function InterviewPrep() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  const handleTopicSelect = (topicId: number) => {
    setSelectedTopicId(topicId);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Grok Interviews
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your comprehensive resource for AI and ML interview preparation. Choose a topic to get started.
        </p>
      </div>

      <div className="mb-8">
        <TopicList 
          onSelectTopic={handleTopicSelect} 
          selectedTopicId={selectedTopicId} 
        />
      </div>
      
      {selectedTopicId && (
        <div className="mb-8">
          <QuestionWithAnswer topicId={selectedTopicId} />
        </div>
      )}

      <div className="mt-10 text-center text-gray-500 text-sm">
        <p>© 2023 Grok Interviews - All rights reserved</p>
      </div>
    </div>
  );
} 