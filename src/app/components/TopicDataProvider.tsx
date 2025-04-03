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
      
      // Use our service to fetch topic data
      const data = await TopicDataService.getAllTopicData();
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
    // Try to load from cache first
    try {
      const cachedDataString = localStorage.getItem(TOPIC_DATA_CACHE_KEY);
      if (cachedDataString) {
        const cachedData = JSON.parse(cachedDataString);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Use cache if it's not expired
        if (cacheAge < CACHE_EXPIRY_MS) {
          setTopicData(cachedData.data);
          setIsLoading(false);
          return; // Skip the API call if we have valid cached data
        }
      }
    } catch (err) {
      console.error('Error reading from cache:', err);
      // Continue to fetch from API if cache fails
    }

    // If we don't have initial data or valid cache, fetch it
    if (Object.keys(initialTopicData).length === 0) {
      fetchTopicData();
    } else {
      // If we have initial data, just use it
      setIsLoading(false);
    }
    
    // No cleanup or dependencies that would cause re-fetching
  }, []); // Empty dependency array means this only runs once on mount

  return (
    <TopicDataContext.Provider value={{ topicData, isLoading, error, refetchData }}>
      {children}
    </TopicDataContext.Provider>
  );
} 