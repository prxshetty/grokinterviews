"use client";

import { useState, useEffect } from 'react';
import styles from './TopicTreeNavigation.module.css';

// Topic data structure updated with all ML subtopics from ml.md
const topics = {
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

  // Render subtopics for each main topic category
  const renderNestedSubtopics = (subtopics: Record<string, any>) => {
    if (!subtopics || Object.keys(subtopics).length === 0) {
      return null;
    }

    return (
      <div className={styles.childrenContainer}>
        <div className={styles.verticalConnector}></div>
        {Object.entries(subtopics).map(([childId, childTopic]: [string, any]) => (
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
    );
  };

  // Render each main topic category in the horizontal layout
  const renderMainTopicCard = ([topicId, topic]: [string, any]) => {
    return (
      <div className={styles.contentType} key={topicId}>
        <div className={styles.categoryHeader}>
          {topic.label}
        </div>
        <div 
          className={`${styles.nodeLabel} ${selectedTopic === topicId ? styles.selected : ''}`}
          onClick={() => handleTopicSelect(topicId)}
        >
          View Topic
        </div>
        
        {/* Render nested subtopics if available */}
        {topic.subtopics && renderNestedSubtopics(topic.subtopics)}
      </div>
    );
  };

  return (
    <div className={styles.treeNavContainer}>
      <div className={styles.treeRoot}>
        <div className={styles.contentGroup}>
          {Object.entries(mainTopic.subtopics).map(renderMainTopicCard)}
        </div>
      </div>
    </div>
  );
} 