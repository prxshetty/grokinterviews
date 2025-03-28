"use client";

import { useState } from 'react';

// Topics data structure
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
      'ml-neural-networks': {
        label: 'Neural Networks',
        subtopics: {
          'ml-nn-fundamentals': { label: 'Neural Network Fundamentals' },
          'ml-nn-architectures': { label: 'Neural Network Architectures' },
          'ml-cnn': { label: 'Convolutional Neural Networks (CNNs)' },
          'ml-rnn': { label: 'Recurrent Neural Networks (RNNs)' },
          'ml-transformers': { label: 'Transformers' }
        }
      },
      'ml-decision-trees': { label: 'Decision Trees' },
      'ml-naive-bayes': { label: 'Naive Bayes' },
      'ml-ensemble': { label: 'Ensemble Methods' },
      'ml-model-evaluation': { 
        label: 'Model Evaluation',
        subtopics: {
          'ml-validation': { label: 'Validation Techniques' },
          'ml-metrics': { label: 'Evaluation Metrics' }
        }
      },
      'ml-deep-learning': {
        label: 'Deep Learning',
        subtopics: {
          'ml-transfer-learning': { label: 'Transfer Learning' },
          'ml-gans': { label: 'Generative Adversarial Networks (GANs)' }
        }
      },
      'ml-nlp': {
        label: 'Natural Language Processing',
        subtopics: {
          'ml-word-embeddings': { label: 'Word Embeddings' },
          'ml-llm': { label: 'Large Language Models (LLMs)' }
        }
      },
      'ml-reinforcement': { label: 'Reinforcement Learning' },
      'ml-time-series': { label: 'Time Series Analysis' },
      'ml-practical': { label: 'Practical ML Engineering' }
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
      'webdev-frontend': { label: 'Frontend Development' },
      'webdev-backend': { label: 'Backend Development' },
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

interface TopicTreeProps {
  onSelectTopic: (topicId: string) => void;
}

export default function TopicTree({ onSelectTopic }: TopicTreeProps) {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    onSelectTopic(topicId);
  };

  const renderSubtopics = (topicId: string, subtopics: any, level = 1) => {
    if (!expandedTopics[topicId]) return null;

    return (
      <div className={`ml-${level * 4} mt-2 space-y-2`}>
        {Object.entries(subtopics).map(([id, topic]: [string, any]) => (
          <div key={id} className="flex flex-col">
            <div className="flex items-center">
              {topic.subtopics && (
                <button
                  onClick={() => toggleTopic(id)}
                  className="p-1 mr-1 rounded focus:outline-none"
                >
                  <span className={`transform transition-transform inline-block ${expandedTopics[id] ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>
              )}
              <button
                onClick={() => handleTopicSelect(id)}
                className={`text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selectedTopic === id ? 'bg-gray-200 dark:bg-gray-700 font-bold' : ''
                }`}
              >
                {topic.label}
              </button>
            </div>
            {topic.subtopics && renderSubtopics(id, topic.subtopics, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8 font-mono">
      <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Topics</h2>
      <div className="space-y-2">
        {Object.entries(topics).map(([id, topic]: [string, any]) => (
          <div key={id} className="flex flex-col">
            <div className="flex items-center">
              <button
                onClick={() => toggleTopic(id)}
                className="p-1 mr-1 rounded focus:outline-none"
              >
                <span className={`transform transition-transform inline-block ${expandedTopics[id] ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
              <button
                onClick={() => handleTopicSelect(id)}
                className={`text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selectedTopic === id ? 'bg-gray-200 dark:bg-gray-700 font-bold' : ''
                }`}
              >
                {topic.label}
              </button>
            </div>
            {topic.subtopics && renderSubtopics(id, topic.subtopics)}
          </div>
        ))}
      </div>
    </div>
  );
} 