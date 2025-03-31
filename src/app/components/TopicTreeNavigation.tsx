"use client";

import { useState, useEffect, useMemo } from 'react';
import styles from './TopicTreeNavigation.module.css';
import { useTopicData } from './TopicDataProvider';

// Default hardcoded topic data as fallback
const defaultTopics = {
  ml: {
    label: 'Machine Learning',
    subtopics: {
      'ml-foundations': { 
        label: 'Foundations & Core Concepts',
        subtopics: {
          'ml-core-concepts': { label: 'Core Concepts' },
          'ml-types-learning': { label: 'Types of Learning' },
          'ml-vs-traditional': { label: 'ML vs Traditional Programming' },
          'ml-applications': { label: 'Real-world Applications' }
        }
      },
      'ml-supervised': {
        label: 'Supervised Learning',
        subtopics: {
          'ml-regression': { 
            label: 'Regression Methods',
            subtopics: {
              'ml-linear-regression': { label: 'Linear Regression' },
              'ml-polynomial-regression': { label: 'Polynomial Regression' },
              'ml-regularized-regression': { label: 'Regularized Regression' },
              'ml-regression-metrics': { label: 'Evaluation Metrics' }
            }
          },
          'ml-classification': { 
            label: 'Classification Techniques',
            subtopics: {
              'ml-logistic-regression': { label: 'Logistic Regression' },
              'ml-decision-trees': { label: 'Decision Trees' },
              'ml-random-forests': { label: 'Random Forests' },
              'ml-svm': { label: 'SVM' },
              'ml-naive-bayes': { label: 'Naive Bayes' },
              'ml-knn': { label: 'K-Nearest Neighbors' },
              'ml-classification-metrics': { label: 'Evaluation Metrics' }
            }
          }
        }
      },
      'ml-unsupervised': {
        label: 'Unsupervised Learning',
        subtopics: {
          'ml-clustering': { 
            label: 'Clustering',
            subtopics: {
              'ml-kmeans': { label: 'K-Means' },
              'ml-hierarchical': { label: 'Hierarchical Clustering' },
              'ml-dbscan': { label: 'DBSCAN' },
              'ml-gmm': { label: 'GMM' },
              'ml-clustering-evaluation': { label: 'Evaluation Metrics' }
            }
          },
          'ml-dimensionality': { 
            label: 'Dimensionality Reduction',
            subtopics: {
              'ml-pca': { label: 'PCA' },
              'ml-tsne': { label: 't-SNE' },
              'ml-umap': { label: 'UMAP' },
              'ml-lda': { label: 'LDA' }
            }
          }
        }
      },
      'ml-neural-networks': {
        label: 'Neural Networks',
        subtopics: {
          'ml-nn-fundamentals': { 
            label: 'Fundamental Concepts',
            subtopics: {
              'ml-perceptrons': { label: 'Perceptrons' },
              'ml-activation-functions': { label: 'Activation Functions' },
              'ml-backpropagation': { label: 'Backpropagation' },
              'ml-optimization': { label: 'Optimization' }
            }
          },
          'ml-nn-architectures': { 
            label: 'Architectures',
            subtopics: {
              'ml-cnn': { label: 'CNNs' },
              'ml-rnn': { label: 'RNNs' },
              'ml-transformers': { label: 'Transformers' },
              'ml-autoencoders': { label: 'Autoencoders' }
            }
          }
        }
      },
      'ml-model-evaluation': {
        label: 'Model Evaluation',
        subtopics: {
          'ml-validation': { 
            label: 'Validation Techniques',
            subtopics: {
              'ml-holdout': { label: 'Holdout Validation' },
              'ml-kfold': { label: 'K-Fold Cross Validation' },
              'ml-stratified': { label: 'Stratified Sampling' },
              'ml-timeseries-splits': { label: 'Time Series Splits' }
            }
          },
          'ml-metrics': { 
            label: 'Performance Metrics',
            subtopics: {
              'ml-classification-metrics': { label: 'Classification Metrics' },
              'ml-regression-metrics': { label: 'Regression Metrics' }
            }
          }
        }
      },
      'ml-math-foundations': { 
        label: 'Mathematical Foundations',
        subtopics: {
          'ml-linear-algebra': { label: 'Linear Algebra' },
          'ml-probability': { label: 'Probability and Statistics' },
          'ml-calculus': { label: 'Calculus' }
        }
      },
      'ml-data-preprocessing': { 
        label: 'Data Preprocessing',
        subtopics: {
          'ml-data-cleaning': { label: 'Data Cleaning' },
          'ml-feature-scaling': { label: 'Feature Scaling' },
          'ml-encoding': { label: 'Encoding' },
          'ml-data-splitting': { label: 'Data Splitting' },
          'ml-eda': { label: 'Exploratory Data Analysis' }
        }
      },
      'ml-ensemble': { 
        label: 'Ensemble Methods',
        subtopics: {
          'ml-gradient-boosting': { label: 'Gradient Boosting' },
          'ml-adaboost': { label: 'AdaBoost' },
          'ml-stacking': { label: 'Stacking' }
        }
      },
      'ml-deep-learning': { 
        label: 'Advanced Deep Learning',
        subtopics: {
          'ml-transfer-learning': { label: 'Transfer Learning' },
          'ml-gans': { label: 'Generative Adversarial Networks' },
          'ml-vaes': { label: 'Variational Autoencoders' },
          'ml-self-supervised': { label: 'Self-Supervised Learning' },
          'ml-normalizing-flows': { label: 'Normalizing Flows' }
        }
      },
      'ml-reinforcement': { 
        label: 'Reinforcement Learning',
        subtopics: {
          'ml-rl-basics': { label: 'RL Basics' },
          'ml-rl-algorithms': { label: 'RL Algorithms' },
          'ml-rl-applications': { label: 'RL Applications' }
        }
      },
      'ml-nlp': {
        label: 'Natural Language Processing',
        subtopics: {
          'ml-word-embeddings': { label: 'Word Embeddings' },
          'ml-llm': { label: 'Large Language Models' }
        }
      },
      'ml-bayesian': {
        label: 'Bayesian Methods',
        subtopics: {
          'ml-bayesian-inference': { label: 'Bayesian Inference' },
          'ml-bayesian-networks': { label: 'Bayesian Networks' },
          'ml-bayesian-optimization': { label: 'Bayesian Optimization' }
        }
      },
      'ml-time-series': { 
        label: 'Time Series Analysis',
        subtopics: {
          'ml-time-series-concepts': { label: 'Core Concepts' },
          'ml-time-series-models': { label: 'Time Series Models' }
        }
      },
      'ml-feature-engineering': {
        label: 'Feature Engineering',
        subtopics: {
          'ml-feature-selection': { label: 'Feature Selection' },
          'ml-feature-extraction': { label: 'Feature Extraction' },
          'ml-imbalanced-data': { label: 'Handling Imbalanced Data' }
        }
      },
      'ml-optimization': {
        label: 'Optimization & Tuning',
        subtopics: {
          'ml-optimization-techniques': { label: 'Optimization Techniques' },
          'ml-hyperparameter-tuning': { label: 'Hyperparameter Tuning' },
          'ml-model-generalization': { label: 'Model Generalization' }
        }
      },
      'ml-practical': { 
        label: 'Practical ML Engineering',
        subtopics: {
          'ml-tools-libraries': { label: 'Tools and Libraries' },
          'ml-deployment': { label: 'Model Deployment' },
          'ml-interpretability': { label: 'Interpretability and Explainability' }
        }
      },
      'ml-emerging-trends': {
        label: 'Emerging Trends',
        subtopics: {
          'ml-federated': { label: 'Federated Learning' },
          'ml-graph-neural': { label: 'Graph Neural Networks' },
          'ml-quantum': { label: 'Quantum Machine Learning' },
          'ml-automl': { label: 'AutoML' },
          'ml-neuro-symbolic': { label: 'Neuro-Symbolic AI' }
        }
      }
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
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { topicData, isLoading, error, refetchData } = useTopicData();

  // Get the topics data, using the dynamic data when available or fallback to default
  const topics = useMemo(() => {
    return Object.keys(topicData).length > 0 ? topicData : defaultTopics;
  }, [topicData]);

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
      const { topicId, isExpanded } = event.detail;
      
      // Get all top-level subtopics for this main topic
      if (selectedMainTopic && topics[selectedMainTopic as keyof typeof topics]) {
        const mainTopic = topics[selectedMainTopic as keyof typeof topics];
        
        if (isExpanded) {
          // Expand all top-level subtopics
          const newExpandedTopics = new Set(expandedTopics);
          
          // Add all top-level subtopics to expanded set
          Object.keys(mainTopic.subtopics).forEach(subtopicId => {
            newExpandedTopics.add(subtopicId);
          });
          
          setExpandedTopics(newExpandedTopics);
        } else {
          // Collapse all top-level subtopics
          const newExpandedTopics = new Set(expandedTopics);
          
          // Remove all top-level subtopics from expanded set
          Object.keys(mainTopic.subtopics).forEach(subtopicId => {
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
    onSelectTopic(topicId);
  };

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

  // Handle double click on topic to toggle expansion
  const handleTopicDoubleClick = (topicId: string, hasChildren: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (hasChildren) {
      toggleExpand(topicId, event);
    }
  };

  // Render a topic node with the appropriate indicator
  const renderTopicNode = (id: string, label: string, hasChildren: boolean, hasContent: boolean = true) => {
    const isExpanded = expandedTopics.has(id);
    const isSelected = selectedTopic === id;
    
    // Use an SVG arrow for clickable items instead of text indicator
    let indicator: React.ReactNode = '[ ]';
    if (isSelected) {
      indicator = '[·]';
    } else if (hasChildren) {
      indicator = isExpanded ? '[–]' : '[+]';
    } else if (hasContent) {
      // Use bracketed arrow for clickable leaf topics
      indicator = (
        <span className={styles.arrowContainer}>
          <span className={styles.bracket}>[</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            className={styles.arrowIcon}
            aria-hidden="true"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M7 17V7m0 0h10M7 7l10 10"
            />
          </svg>
          <span className={styles.bracket}>]</span>
        </span>
      );
    }
    
    return (
      <div 
        className={`${styles.topicNode} ${isSelected ? styles.selected : ''} ${hasContent && !hasChildren ? styles.clickable : ''}`}
        onClick={(e) => hasChildren ? toggleExpand(id, e) : handleTopicSelect(id, e)}
        onDoubleClick={(e) => handleTopicDoubleClick(id, hasChildren, e)}
      >
        <span 
          className={styles.indicator}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpand(id, e);
            else handleTopicSelect(id, e);
          }}
        >
          {typeof indicator === 'string' ? indicator : indicator}
        </span>
        <span 
          className={styles.topicLabel}
          onClick={(e) => {
            e.stopPropagation();
            handleTopicSelect(id, e);
          }}
        >
          {label}
        </span>
      </div>
    );
  };

  // Render subtopics
  const renderSubtopics = (subtopics: Record<string, any>, parentId: string | null = null) => {
    if (!subtopics || Object.keys(subtopics).length === 0) {
      return null;
    }

    return (
      <div className={styles.subtopicList}>
        {Object.entries(subtopics).map(([id, topic]: [string, any]) => {
          const hasChildren = topic.subtopics && Object.keys(topic.subtopics).length > 0;
          const isExpanded = expandedTopics.has(id);
          
          return (
            <div key={id} className={styles.subtopicItem}>
              {renderTopicNode(id, topic.label, hasChildren)}
              
              {/* Show children if expanded */}
              {hasChildren && isExpanded && (
                <div className={styles.nestedSubtopics}>
                  {renderSubtopics(topic.subtopics, id)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Group topics for display in columns with letters
  const renderMainCategories = () => {
    if (!selectedMainTopic || !topics[selectedMainTopic as keyof typeof topics]) {
      return null;
    }

    const mainTopic = topics[selectedMainTopic as keyof typeof topics];
    
    // Get all the section topics from ML
    const mainCategories = Object.entries(mainTopic.subtopics)
      .filter(([_, topic]: [string, any]) => topic.subtopics && Object.keys(topic.subtopics).length > 0);
    
    // Set desired number of columns
    const columnCount = 5; 
    
    // Calculate how many items should be in each column for even distribution
    const totalCategories = mainCategories.length;
    const itemsPerColumn = Math.ceil(totalCategories / columnCount);
    
    // Create balanced columns
    const columns: Array<Array<[string, any]>> = [];
    
    // Evenly distribute items across columns
    for (let i = 0; i < totalCategories; i += itemsPerColumn) {
      // Get a slice of categories for this column, limited by itemsPerColumn or remaining items
      const columnItems = mainCategories.slice(i, Math.min(i + itemsPerColumn, totalCategories));
      columns.push(columnItems);
    }
    
    return (
      <div className={styles.categoriesContainer}>
        {columns.map((column, colIndex) => (
          <div key={colIndex} className={styles.categoryColumn}>
            {column.map(([categoryId, category]) => {
              const hasChildren = category.subtopics && Object.keys(category.subtopics).length > 0;
              const isExpanded = expandedTopics.has(categoryId);
              
              return (
                <div key={categoryId} className={styles.categoryGroup}>
                  <div className={styles.categoryHeader}>
                    {renderTopicNode(categoryId, category.label, hasChildren, false)}
                  </div>
                  
                  {/* Show children if expanded */}
                  {hasChildren && isExpanded && (
                    <div className={styles.categoryTopics}>
                      {renderSubtopics(category.subtopics, categoryId)}
                    </div>
                  )}
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