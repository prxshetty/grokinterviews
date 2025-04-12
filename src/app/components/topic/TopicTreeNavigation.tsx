"use client";

import React from 'react';
import styles from './TopicTreeNavigation.module.css';
import { MarkdownHeaderTree } from '../content';

interface TopicTreeNavigationProps {
  selectedMainTopic: string | null;
  onSelectTopic: (topicId: string) => void;
}

export default function TopicTreeNavigation({
  selectedMainTopic,
  onSelectTopic
}: TopicTreeNavigationProps) {
  // Handle close button click
  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // If we have a selected main topic, render the MarkdownHeaderTree directly
  if (selectedMainTopic) {
    return (
      <MarkdownHeaderTree
        topicId={selectedMainTopic}
        onSelectHeader={onSelectTopic}
      />
    );
  }

  // Otherwise, show the topic selection UI
  return (
    <div className={styles.treeNavContainer}>
      <button className={styles.closeButton} onClick={handleClose}>Close</button>
      <div className={styles.treeNavContent}>
        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
          Please select a topic to view its headers.
        </div>
      </div>
    </div>
  );
}