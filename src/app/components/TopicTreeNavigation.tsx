"use client";

import { useState, useEffect, useMemo } from 'react';
import styles from './TopicTreeNavigation.module.css';
import { useTopicData } from './TopicDataProvider';

// Default empty topics structure in case data isn't loaded
const defaultTopics = {
  ml: { label: 'Machine Learning', subtopics: {} },
  ai: { label: 'Artificial Intelligence', subtopics: {} },
  webdev: { label: 'Web Development', subtopics: {} },
  'system-design': { label: 'System Design', subtopics: {} },
  dsa: { label: 'Data Structures & Algorithms', subtopics: {} }
};


interface TopicTreeNavigationProps {
  selectedMainTopic: string | null;
  onSelectTopic: (topicId: string) => void;
}

export default function TopicTreeNavigation({
  selectedMainTopic,
  onSelectTopic
}: TopicTreeNavigationProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { topicData, isLoading, error, refetchData } = useTopicData();

  // Get the topics data, using the dynamic data when available or fallback to default
  const topics = useMemo(() => {
    console.log('TopicTreeNavigation - topicData:', topicData);
    console.log('TopicTreeNavigation - selectedMainTopic:', selectedMainTopic);
    return Object.keys(topicData).length > 0 ? topicData : defaultTopics;
  }, [topicData, selectedMainTopic]);

  // Reset selection when main topic changes
  useEffect(() => {
    setSelectedTopic(null);
    // Automatically expand a few categories on initial load
    if (selectedMainTopic === 'ml') {
      const initialExpanded = new Set(['ml-foundations', 'ml-supervised', 'ml-unsupervised']);
      setExpandedTopics(initialExpanded);
    } else {
      setExpandedTopics(new Set());
    }
  }, [selectedMainTopic]);

  // Listen for double-click events from TopicNav
  useEffect(() => {
    const handleTopicDoubleClick = (event: CustomEvent<{ topicId: string, isExpanded: boolean }>) => {
      const { isExpanded } = event.detail;

      // Get all top-level subtopics for this main topic
      if (selectedMainTopic && topics[selectedMainTopic as keyof typeof topics]) {
        const mainTopic = topics[selectedMainTopic as keyof typeof topics];

        if (isExpanded) {
          // Expand all top-level subtopics
          const newExpandedTopics = new Set(expandedTopics);

          // Add all top-level subtopics to expanded set
          Object.keys(mainTopic.subtopics || {}).forEach(subtopicId => {
            newExpandedTopics.add(subtopicId);
          });

          setExpandedTopics(newExpandedTopics);
        } else {
          // Collapse all top-level subtopics
          const newExpandedTopics = new Set(expandedTopics);

          // Remove all top-level subtopics from expanded set
          Object.keys(mainTopic.subtopics || {}).forEach(subtopicId => {
            newExpandedTopics.delete(subtopicId);
          });

          setExpandedTopics(newExpandedTopics);
        }
      }
    };

    window.addEventListener('topicDoubleClicked', handleTopicDoubleClick as EventListener);

    return () => {
      window.removeEventListener('topicDoubleClicked', handleTopicDoubleClick as EventListener);
    };
  }, [selectedMainTopic, topics, expandedTopics]);

  const handleTopicSelect = (topicId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTopic(topicId);

    console.log('TopicTreeNavigation - handleTopicSelect:', topicId);

    // Notify parent component
    if (onSelectTopic) {
      console.log('TopicTreeNavigation - Calling onSelectTopic with:', topicId);
      onSelectTopic(topicId);
    } else {
      console.log('TopicTreeNavigation - onSelectTopic prop is not provided');
    }

    // Dispatch a custom event to hide the tree
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // We don't need this function anymore as we're not showing nested topics
  // Keeping it commented for reference
  /*
  const toggleExpand = (topicId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    const newExpandedTopics = new Set(expandedTopics);
    if (newExpandedTopics.has(topicId)) {
      newExpandedTopics.delete(topicId);
    } else {
      newExpandedTopics.add(topicId);
    }
    setExpandedTopics(newExpandedTopics);
  };
  */

  // We don't need this function anymore as we're not showing nested topics
  // Keeping it commented for reference
  /*
  const handleTopicDoubleClick = (topicId: string, hasChildren: boolean, event: React.MouseEvent) => {
    event.stopPropagation();

    if (hasChildren) {
      toggleExpand(topicId, event);
    }
  };
  */

  // Render a topic row with area and project
  const renderTopicRow = (id: string, areaLabel: string, projectLabel: string) => {
    const isSelected = selectedTopic === id;

    return (
      <div
        className={`${styles.categoryRow} ${isSelected ? styles.selected : ''}`}
        onClick={(e) => handleTopicSelect(id, e)}
      >
        <div className={styles.categoryArea}>
          <div className={styles.arrowContainer}>
            <span>→</span>
          </div>
          <span className={styles.topicLabel}>{areaLabel}</span>
        </div>
        <div className={styles.categoryProject}>
          <span className={styles.topicLabel}>{projectLabel}</span>
        </div>
      </div>
    );
  };

  // Handle close button click
  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // Render topics in a table-like layout
  const renderTopicTable = () => {
    console.log('renderTopicTable - selectedMainTopic:', selectedMainTopic);
    console.log('renderTopicTable - topics:', topics);

    // Always show the sample data for now
    // if (!selectedMainTopic || !topics[selectedMainTopic as keyof typeof topics]) {
    //   console.log('renderTopicTable - No selected main topic or topic not found');
    //   return null;
    // }

    // Get the selected main topic and its subtopics
    // const mainTopic = topics[selectedMainTopic as keyof typeof topics];
    // console.log('renderTopicTable - mainTopic:', mainTopic);

    // Use sample data for now to get the tree showing
    // Sample data to match the image
    const topicRows = [
      { id: 'exposition', area: 'Exposition', project: 'Spanish Freak Show' },
      { id: 'editorial-branding', area: 'Editorial / Branding', project: 'Azul Magazine' },
      { id: 'branding', area: 'Branding', project: 'Velaz Music' },
      { id: 'typography', area: 'Typography', project: 'Pysoni Numerology' },
      { id: 'event-branding', area: 'Event / Branding', project: 'Oh Holy Festivals!' },
      { id: 'editorial', area: 'Editorial', project: 'Oh Holy Festivals! - Informe' },
      { id: 'exposition-illustration', area: 'Exposition / Illustration', project: 'FastExpo\'17' },
      { id: 'illustration', area: 'Illustration', project: 'Kam_air_sutra' },
      { id: 'art-direction', area: 'Art Direction', project: 'Europe Mode Catalogue' },
      { id: 'inphographics', area: 'Inphographics', project: 'Infografías - Yorokobu Mag' },
      { id: 'typography-illustration', area: 'Typography / Illustration', project: 'Numerografía 79- Yorokobu Mag' },
      { id: 'illustration2', area: 'Illustration', project: 'Chamartin Station Map' },
      { id: 'illustration3', area: 'Illustration', project: 'Plano Festival SOS4.8' },
      { id: 'typography-illustration2', area: 'Typography / Illustration', project: 'Moustachetype - 36DaysofType' },
    ];

    // If no subtopics, show a message
    if (topicRows.length === 0) {
      return (
        <div className={styles.categoriesContainer}>
          <div className="text-center p-4 text-gray-500 dark:text-gray-400">
            No categories found for this topic.
          </div>
        </div>
      );
    }

    return (
      <div className={styles.categoriesContainer}>
        {/* Header row */}
        <div className={styles.headerRow}>
          <div className={styles.headerCell}>↓ Area</div>
          <div className={styles.headerCell}>↓ Project</div>
        </div>

        {/* Topic rows */}
        {topicRows.map((row) => (
          <div key={row.id} onClick={(e) => handleTopicSelect(row.id, e)}>
            {renderTopicRow(row.id, row.area, row.project)}
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
      <button className={styles.closeButton} onClick={handleClose}>Close</button>
      <div className={styles.treeNavContent}>
        {/* Always show the topic table */}
        {renderTopicTable()}
      </div>
    </div>
  );
}