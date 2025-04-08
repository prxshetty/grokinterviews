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
    console.log(`TopicNavWrapper - handleTopicSelect called with topicId: ${topicId}`);
    console.log(`TopicNavWrapper - Current state: selectedMainTopic=${selectedMainTopic}, treeVisible=${treeVisible}`);

    if (selectedMainTopic === topicId) {
      // If the same main topic is clicked again, toggle tree visibility
      console.log(`TopicNavWrapper - Same topic clicked, toggling tree visibility from ${treeVisible} to ${!treeVisible}`);
      setTreeVisible(!treeVisible);
    } else {
      // If a new main topic is selected, show the tree and set the new topic
      console.log(`TopicNavWrapper - New topic selected: ${topicId}, showing tree`);
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
    console.log(`TopicNavWrapper - handleSubTopicSelect called with topicId: ${topicId}`);

    // Pass the selected subtopic to the page
    window.dispatchEvent(new CustomEvent('topicChange', { detail: topicId }));

    // Hide the tree when a topic is clicked
    console.log(`TopicNavWrapper - Hiding tree after subtopic selection`);
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