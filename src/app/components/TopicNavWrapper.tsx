"use client";

import { useState, useEffect } from 'react';
import TopicNav from './TopicNav';
import TopicTableView from './TopicTableView';

export default function TopicNavWrapper() {
  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);
  const [treeVisible, setTreeVisible] = useState<boolean>(false);

  // Listen for reset navigation events and hide tree events
  useEffect(() => {
    const handleResetNavigation = () => {
      setSelectedMainTopic(null);
      setTreeVisible(true);
    };

    const handleHideTopicTree = () => {
      setTreeVisible(false);
    };

    window.addEventListener('resetNavigation', handleResetNavigation);
    window.addEventListener('hideTopicTree', handleHideTopicTree);

    return () => {
      window.removeEventListener('resetNavigation', handleResetNavigation);
      window.removeEventListener('hideTopicTree', handleHideTopicTree);
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

    // Force the tree to be visible when a topic is selected
    if (topicId) {
      setTreeVisible(true);
    }
  };

  const handleSubTopicSelect = (topicId: string) => {
    // Pass the selected subtopic to the page
    window.dispatchEvent(new CustomEvent('topicChange', { detail: topicId }));

    // Hide the tree when a topic is clicked
    setTreeVisible(false);
  };

  return (
    <div className="topic-navigation">
      <TopicNav onTopicSelect={handleTopicSelect} selectedTopic={selectedMainTopic} />
      {treeVisible && (
        <TopicTableView
          selectedMainTopic={selectedMainTopic}
          onSelectTopic={handleSubTopicSelect}
        />
      )}
    </div>
  );
}