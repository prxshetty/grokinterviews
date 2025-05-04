"use client";

import React from 'react';
// import { MarkdownHeaderTree } from '../content'; // Removed import
import styles from './TopicTreeNavigation.module.css';

interface TopicTreeNavigationProps {
  selectedMainTopic: string | null;
  onSelectTopic: (topicId: string) => void;
}

export default function TopicTreeNavigation({
  selectedMainTopic,
  onSelectTopic
}: TopicTreeNavigationProps) {

  // Handle close button click (Keep existing logic if needed, or remove if close button is gone)
  const handleClose = () => {
    // Assuming the goal is to hide/deselect the topic tree display area
    // A more robust mechanism might be needed depending on parent component state management
    console.log("Close clicked, parent should handle hiding.");
    // Example: Dispatch an event or call a prop function if available
    // window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // // If we have a selected main topic, render the tree structure based on Supabase data (New logic needed here)
  // if (selectedMainTopic) {
  //   // TODO: Fetch structure (sections/categories) for the selectedMainTopic from Supabase
  //   //       and render the expandable tree navigation based on that data.
  //   //       The old implementation rendered <MarkdownHeaderTree topicId={selectedMainTopic} onSelectHeader={onSelectTopic} />
  //   //       which is now removed.

  //   // Placeholder while new logic is implemented:k
  //   return (
  //       <div className={styles.treeNavContainer}>
  //           {/* Optionally keep close button if needed by design */}
  //           {/* <button className={styles.closeButton} onClick={handleClose}>Close</button> */}
  //           <div className={styles.treeNavContent}>
  //               <p className="p-4 text-gray-500 italic">
  //                   Topic selected ({selectedMainTopic}). Tree navigation needs implementation using Supabase data.
  //               </p>
  //           </div>
  //       </div>
  //   );
  // }

  // Otherwise, show the topic selection UI or nothing
  return (
    <div className={styles.treeNavContainer}>
        {/* Optionally keep close button if needed by design */}
        {/* <button className={styles.closeButton} onClick={handleClose}>Close</button> */}
        <div className={styles.treeNavContent}>
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                {/* Message when no topic is selected - keep or modify as needed */}
                Please select a topic to view its structure.
            </div>
        </div>
    </div>
  );
}