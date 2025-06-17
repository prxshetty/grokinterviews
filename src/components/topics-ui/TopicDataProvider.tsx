"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import TopicDataService, { TopicTree } from '@/services/TopicDataService';

// Create a context for the topic data
const TopicDataContext = createContext<{
  topicData: TopicTree;
  isLoading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
}>({
  topicData: {},
  isLoading: true,
  error: null,
  refetchData: async () => {}
});

// Hook to use the topic data
export const useTopicData = () => useContext(TopicDataContext);

interface TopicDataProviderProps {
  children: ReactNode;
  initialTopicData?: TopicTree;
}

// Cache key for local storage
const TOPIC_DATA_CACHE_KEY = 'grokInterviews_topicData';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour cache

export default function TopicDataProvider({
  children,
  initialTopicData = {}
}: TopicDataProviderProps) {
  const [topicData, setTopicData] = useState<TopicTree>(initialTopicData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchTopicData = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setIsLoading(true);

      console.log('TopicDataProvider - Fetching topic data...');

      // Use our service to fetch topic data
      const data = await TopicDataService.getAllTopicData();
      console.log('TopicDataProvider - Fetched topic data:', data);

      setTopicData(data);

      // Save to localStorage with timestamp for cache expiry
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(TOPIC_DATA_CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Error loading topic data:', err);
      setError('Failed to load topic data. Using default data instead.');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Function to manually refetch data when needed
  const refetchData = async () => {
    // Clear the service cache first to ensure fresh data
    TopicDataService.clearCache();
    await fetchTopicData();
  };

  useEffect(() => {
    console.log('TopicDataProvider - useEffect running...');

    // Clear localStorage to force a fresh fetch (for debugging)
    // localStorage.removeItem(TOPIC_DATA_CACHE_KEY); // Commented out for now, likely for debugging

    // Try to load from cache first
    try {
      const cachedDataString = localStorage.getItem(TOPIC_DATA_CACHE_KEY);
      if (cachedDataString) {
        console.log('TopicDataProvider - Found cached data');
        const cachedData = JSON.parse(cachedDataString);
        const cacheAge = Date.now() - cachedData.timestamp;

        // Use cache if it's not expired
        if (cacheAge < CACHE_EXPIRY_MS) {
          console.log('TopicDataProvider - Using cached data');
          setTopicData(cachedData.data);
          setIsLoading(false);
          return; // Skip further processing if we have valid cached data
        } else {
          console.log('TopicDataProvider - Cache expired, proceeding to check initial/API');
        }
      } else {
        console.log('TopicDataProvider - No cached data found, proceeding to check initial/API');
      }
    } catch (err) {
      console.error('Error reading from cache:', err);
      // Continue to check initial/API if cache fails
    }

    // If cache was not used or was invalid, check the current topicData state
    // (which was initialized with initialTopicData prop)
    if (Object.keys(topicData).length === 0) {
      // topicData is empty, meaning initialTopicData prop was also empty (or cache failed and initial was empty)
      console.log('TopicDataProvider - No cached or initial prop data, fetching from API');
      fetchTopicData();
    } else {
      // topicData was populated by initialTopicData prop (and cache wasn't used/valid).
      // Data is already in place from props.
      console.log('TopicDataProvider - Using data from initialTopicData prop (cache not used/valid)');
      setIsLoading(false);
    }

  }, []); // Dependency array is empty to ensure this runs only once on mount

  return (
    <TopicDataContext.Provider value={{ topicData, isLoading, error, refetchData }}>
      {children}
    </TopicDataContext.Provider>
  );
}