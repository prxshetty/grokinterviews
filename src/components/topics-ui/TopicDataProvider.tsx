"use client";

import { useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { TopicTree } from '@/services/TopicDataService';

// Create a context for the topic data
const TopicDataContext = createContext<{
  topicData: TopicTree;
  isLoading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
}>({
  topicData: {},
  isLoading: false, // Default to not loading
  error: null,
  refetchData: async () => {}
});

// Hook to use the topic data
export const useTopicData = () => useContext(TopicDataContext);

interface TopicDataProviderProps {
  children: ReactNode;
}

export default function TopicDataProvider({
  children
}: TopicDataProviderProps) {
  const [topicData] = useState<TopicTree>({});
  const [isLoading] = useState<boolean>(false); // Data is not loaded initially
  const [error] = useState<string | null>(null);

  // The refetchData function will now be a no-op until we decide how to refresh data on-demand.
  const refetchData = useCallback(async () => {
    // In the new model, refetching might be handled at a more granular level,
    // e.g., refetching a specific domain's data. For now, this can be a placeholder.
    console.log("Refetch triggered, but global refetch is deprecated.");
    // Simulate a delay for now, or implement a new fetching strategy if needed.
    await new Promise(resolve => setTimeout(resolve, 500)); 
  }, []);

  // The original useEffect for fetching all data is now removed.
  // Data will be loaded by child components as needed.

  return (
    <TopicDataContext.Provider value={{ topicData, isLoading, error, refetchData }}>
      {children}
    </TopicDataContext.Provider>
  );
}