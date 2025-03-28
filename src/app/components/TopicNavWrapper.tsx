"use client";

import { useState } from 'react';
import TopicNav from './TopicNav';
import TopicTreeNavigation from './TopicTreeNavigation';

export default function TopicNavWrapper() {
  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);

  const handleTopicSelect = (topicId: string) => {
    setSelectedMainTopic(topicId);
    // Use a custom event to communicate with the page component
    window.dispatchEvent(new CustomEvent('topicChange', { detail: topicId }));
  };

  const handleSubTopicSelect = (topicId: string) => {
    // Pass the selected subtopic to the page
    window.dispatchEvent(new CustomEvent('topicChange', { detail: topicId }));
  };

  return (
    <div className="topic-navigation">
      <TopicNav onTopicSelect={handleTopicSelect} />
      <TopicTreeNavigation 
        selectedMainTopic={selectedMainTopic} 
        onSelectTopic={handleSubTopicSelect} 
      />
    </div>
  );
} 