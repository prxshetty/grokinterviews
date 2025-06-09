'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';

interface TopicData {
  [topicId: string]: {
    label: string;
    content?: string;
    subtopics?: any;
  };
}

interface TopicDataContextType {
  topicData: TopicData;
  loading: boolean;
  error: string | null;
}

const TopicDataContext = createContext<TopicDataContextType>({
  topicData: {},
  loading: false,
  error: null,
});

export function TopicDataProvider({ children }: { children: ReactNode }) {
  const [topicData, setTopicData] = useState<TopicData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real implementation, fetch data from your API
        // For now, providing a basic structure with placeholder data
        setTopicData({
          'ml': {
            label: 'Machine Learning',
            subtopics: {},
          },
          'ai': {
            label: 'Artificial Intelligence',
            subtopics: {},
          },
          'webdev': {
            label: 'Web Development',
            subtopics: {},
          },
          'sdesign': {
            label: 'System Design',
            subtopics: {},
          },
          'dsa': {
            label: 'Data Structures & Algorithms',
            subtopics: {},
          },
        });
      } catch (err) {
        setError('Failed to load topic data');
        console.error('Error loading topic data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <TopicDataContext.Provider value={{ topicData, loading, error }}>
      {children}
    </TopicDataContext.Provider>
  );
}

export function useTopicData() {
  return useContext(TopicDataContext);
} 