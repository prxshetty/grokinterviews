"use client";

import { useState, useEffect } from 'react';
import TopicNav from './TopicNav';
import TopicTreeNavigation from './TopicTreeNavigation';

export default function TopicNavWrapper() {
  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);
  const [treeVisible, setTreeVisible] = useState<boolean>(false);

  // Listen for reset navigation events
  useEffect(() => {
    const handleResetNavigation = () => {
      setSelectedMainTopic(null);
      setTreeVisible(true);
    };

    window.addEventListener('resetNavigation', handleResetNavigation);

    return () => {
      window.removeEventListener('resetNavigation', handleResetNavigation);
    };
  }, []);

  const handleTopicSelect = (topicId: string) => {
    if (selectedMainTopic === topicId) {
      // If the same main topic is clicked again, toggle tree visibility
      setTreeVisible(!treeVisible);
    } else {
      // If a new main topic is selected, show the tree and set the new topic
      setSelectedMainTopic(topicId);
      setTreeVisible(true);
    }

    // Use a custom event to communicate with the page component
    window.dispatchEvent(new CustomEvent('topicChange', { detail: topicId }));
  };

  const handleSubTopicSelect = (topicId: string) => {
    // Pass the selected subtopic to the page
    window.dispatchEvent(new CustomEvent('topicChange', { detail: topicId }));
  };

  return (
    <div className="topic-navigation">
      <TopicNav onTopicSelect={handleTopicSelect} selectedTopic={selectedMainTopic} />
      {treeVisible && (
        <TopicTreeNavigation
          selectedMainTopic={selectedMainTopic}
          onSelectTopic={handleSubTopicSelect}
        />
      )}
    </div>
  );
}