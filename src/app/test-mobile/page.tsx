'use client';

import React from 'react';
import TopicCategoryGrid from '@/components/topics-ui/TopicCategoryGrid';

// Sample data for testing
const sampleItems = [
  {
    id: '1',
    label: 'Foundations of Artificial Intelligence',
    progress: {
      questionsCompleted: 0,
      totalQuestions: 4,
      completionPercentage: 0
    }
  },
  {
    id: '2',
    label: 'Symbolic AI and Knowledge Representation',
    progress: {
      questionsCompleted: 0,
      totalQuestions: 14,
      completionPercentage: 0
    }
  },
  {
    id: '3',
    label: 'Search Algorithms in AI',
    progress: {
      questionsCompleted: 0,
      totalQuestions: 8,
      completionPercentage: 0
    }
  },
  {
    id: '4',
    label: 'Natural Language Processing (NLP)',
    progress: {
      questionsCompleted: 0,
      totalQuestions: 19,
      completionPercentage: 0
    }
  },
  {
    id: '5',
    label: 'Computer Vision',
    progress: {
      questionsCompleted: 0,
      totalQuestions: 57,
      completionPercentage: 0
    }
  },
  {
    id: '6',
    label: 'Reinforcement Learning',
    progress: {
      questionsCompleted: 0,
      totalQuestions: 58,
      completionPercentage: 0
    }
  }
];

export default function TestMobilePage() {
  return (
    <div className="min-h-screen bg-background">
      <TopicCategoryGrid
        items={sampleItems}
        level="topic"
        domain="ai"
        showDomainTitle={true}
        onSelectItem={(itemId) => console.log('Selected item:', itemId)}
      />
    </div>
  );
}
