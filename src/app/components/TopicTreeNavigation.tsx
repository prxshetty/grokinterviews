"use client";

import { useState, useEffect } from 'react';
import styles from './TopicTreeNavigation.module.css';

// Topic data structure
const topics = {
  ml: {
    label: 'Machine Learning',
    subtopics: {
      'ml-foundations': { label: 'Foundations & Core Concepts' },
      'ml-math-foundations': { label: 'Mathematical Foundations' },
      'ml-data-preprocessing': { label: 'Data Preprocessing' },
      'ml-supervised': {
        label: 'Supervised Learning',
        subtopics: {
          'ml-regression': { label: 'Regression' },
          'ml-classification': { label: 'Classification' }
        }
      },
      'ml-unsupervised': {
        label: 'Unsupervised Learning',
        subtopics: {
          'ml-clustering': { label: 'Clustering' },
          'ml-dimensionality': { label: 'Dimensionality Reduction' }
        }
      },
      'ml-deep-learning': { label: 'Deep Learning' },
      'ml-reinforcement': { label: 'Reinforcement Learning' }
    }
  },
  ai: {
    label: 'Artificial Intelligence',
    subtopics: {
      'ai-foundations': { label: 'AI Foundations' },
      'ai-nlp': { label: 'Natural Language Processing' },
      'ai-cv': { label: 'Computer Vision' },
      'ai-rl': { label: 'Reinforcement Learning' },
      'ai-ethics': { label: 'AI Ethics & Responsible AI' }
    }
  },
  webdev: {
    label: 'Web Development',
    subtopics: {
      'webdev-frontend': { 
        label: 'Frontend Development',
        subtopics: {
          'webdev-html-css': { label: 'HTML & CSS' },
          'webdev-javascript': { label: 'JavaScript' },
          'webdev-frameworks-frontend': { label: 'Frontend Frameworks' }
        }
      },
      'webdev-backend': { 
        label: 'Backend Development',
        subtopics: {
          'webdev-node': { label: 'Node.js' },
          'webdev-apis': { label: 'API Design' },
          'webdev-db': { label: 'Databases' }
        }
      },
      'webdev-fullstack': { label: 'Full Stack Development' },
      'webdev-frameworks': { label: 'Web Frameworks' }
    }
  },
  'system-design': {
    label: 'System Design',
    subtopics: {
      'sd-basics': { label: 'System Design Basics' },
      'sd-scalability': { label: 'Scalability' },
      'sd-db': { label: 'Database Design' },
      'sd-distributed': { label: 'Distributed Systems' },
      'sd-microservices': { label: 'Microservices Architecture' }
    }
  },
  dsa: {
    label: 'Data Structures & Algorithms',
    subtopics: {
      'dsa-arrays': { label: 'Arrays & Strings' },
      'dsa-linked-lists': { label: 'Linked Lists' },
      'dsa-stacks-queues': { label: 'Stacks & Queues' },
      'dsa-trees': { label: 'Trees & Graphs' },
      'dsa-sorting': { label: 'Sorting & Searching' },
      'dsa-dp': { label: 'Dynamic Programming' },
      'dsa-greedy': { label: 'Greedy Algorithms' }
    }
  }
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

  // Reset selection when main topic changes
  useEffect(() => {
    setSelectedTopic(null);
  }, [selectedMainTopic]);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    onSelectTopic(topicId);
  };

  // If no main topic is selected, don't render anything
  if (!selectedMainTopic || !topics[selectedMainTopic as keyof typeof topics]) {
    return null;
  }

  const mainTopic = topics[selectedMainTopic as keyof typeof topics];

  // Match the exact tree structure from the screenshot
  return (
    <div className={styles.treeNavContainer}>
      <div className={styles.treeRoot}>
        <div className={styles.branchLabel}>
          {mainTopic.label}
        </div>
        <div className={styles.contentGroup}>
          {Object.entries(mainTopic.subtopics).map(([subId, subTopic]: [string, any]) => (
            <div className={styles.contentType} key={subId}>
              <div 
                className={`${styles.nodeLabel} ${selectedTopic === subId ? styles.selected : ''}`}
                onClick={() => handleTopicSelect(subId)}
              >
                {subTopic.label}
              </div>
              
              {/* Only render subtopics if available */}
              {subTopic.subtopics && Object.keys(subTopic.subtopics).length > 0 && (
                <div className={styles.childrenContainer}>
                  <div className={styles.verticalConnector}></div>
                  {Object.entries(subTopic.subtopics).map(([childId, childTopic]: [string, any]) => (
                    <div className={styles.nestedLevel} key={childId}>
                      <div className={styles.horizontalConnector}></div>
                      <div 
                        className={`${styles.nodeLabel} ${selectedTopic === childId ? styles.selected : ''}`}
                        onClick={() => handleTopicSelect(childId)}
                      >
                        {childTopic.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 