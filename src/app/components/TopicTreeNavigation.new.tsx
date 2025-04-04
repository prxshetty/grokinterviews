"use client";

import { useState, useEffect } from 'react';
import styles from './TopicTreeNavigation.module.css';
import { useTopicData } from './TopicDataProvider';

interface TopicTreeNavigationProps {
  selectedMainTopic: string | null;
  onSelectTopic: (topicId: string) => void;
}

export default function TopicTreeNavigation({ 
  selectedMainTopic, 
  onSelectTopic 
}: TopicTreeNavigationProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const { topicData, isLoading, error, refetchData } = useTopicData();

  // Reset selection when main topic changes
  useEffect(() => {
    setSelectedTopic(null);
  }, [selectedMainTopic]);

  // Handle topic selection
  const handleTopicSelect = (topicId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTopic(topicId);
    onSelectTopic(topicId);
  };

  // Render a simple topic node
  const renderTopicNode = (id: string, label: string) => {
    const isSelected = selectedTopic === id;
    
    return (
      <div 
        className={`${styles.topicNode} ${isSelected ? styles.selected : ''} ${styles.clickable}`}
        onClick={(e) => handleTopicSelect(id, e)}
      >
        <span className={styles.topicLabel}>
          {label}
        </span>
      </div>
    );
  };

  // Render main categories in a grid layout
  const renderMainCategories = () => {
    if (!selectedMainTopic || !topicData[selectedMainTopic]) {
      return null;
    }

    const mainTopic = topicData[selectedMainTopic];
    
    // Get all subtopics
    const mainCategories = Object.entries(mainTopic.subtopics || {});
    
    // Organize into columns
    const columnCount = 3; // Adjust based on your layout needs
    const itemsPerColumn = Math.ceil(mainCategories.length / columnCount);
    
    const columns = [];
    for (let i = 0; i < mainCategories.length; i += itemsPerColumn) {
      columns.push(mainCategories.slice(i, i + itemsPerColumn));
    }
    
    return (
      <div className={styles.categoriesContainer}>
        {columns.map((column, colIndex) => (
          <div key={colIndex} className={styles.categoryColumn}>
            {column.map(([categoryId, category]: [string, any]) => {
              return (
                <div key={categoryId} className={styles.categoryGroup}>
                  <div className={styles.categoryHeader}>
                    {renderTopicNode(categoryId, category.label)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Handle loading and error states
  if (isLoading && Object.keys(topicData).length === 0) {
    return (
      <div className={styles.treeNavContainer}>
        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
          Loading topic data...
        </div>
      </div>
    );
  }

  if (error && Object.keys(topicData).length === 0) {
    return (
      <div className={styles.treeNavContainer}>
        <div className="text-center p-4 text-red-500">
          {error} Using fallback data.
          <button 
            onClick={() => refetchData()} 
            className="ml-2 text-blue-500 underline hover:text-blue-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.treeNavContainer}>
      <div className={styles.treeNavContent}>
        {renderMainCategories()}
      </div>
    </div>
  );
}
