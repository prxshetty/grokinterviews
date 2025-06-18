"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Start loading only if there's no initial data.
    const hasInitialData = Object.keys(initialTopicData).length > 0;
    return !hasInitialData;
  });
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false); // Prevents multiple concurrent API fetches

  const performFetch = useCallback(async (mountedChecker: () => boolean) => {
    if (isFetchingRef.current) {
      console.log('TopicDataProvider - performFetch: Already fetching.');
      return;
    }
    isFetchingRef.current = true;
    // isLoading should already be true if this function is called by the effect.

    console.log('TopicDataProvider - performFetch: Starting API call...');
    try {
      const data = await TopicDataService.getAllTopicData();
      if (mountedChecker()) {
        console.log('TopicDataProvider - performFetch: Fetched data from API:', data);
        setTopicData(data);
        localStorage.setItem(TOPIC_DATA_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        setError(null); // Clear any previous error on successful fetch
      }
    } catch (err) {
      console.error('Error fetching topic data from API:', err);
      if (mountedChecker()) {
        setError('Failed to load topic data from API.');
      }
    } finally {
      if (mountedChecker()) {
        setIsLoading(false); // Fetch attempt (success or failure) is complete
      }
      isFetchingRef.current = false;
    }
  }, [setTopicData, setIsLoading, setError]); // Dependencies for the fetch operation itself

  const refetchData = useCallback(async () => {
    console.log('TopicDataProvider - refetchData: Triggered');
    TopicDataService.clearCache(); // Clear any in-memory cache in the service
    localStorage.removeItem(TOPIC_DATA_CACHE_KEY); // Clear local storage cache
    
    setTopicData({}); // Clear current data to ensure a fresh load indication
    setError(null);   // Clear previous error
    setIsLoading(true); // <<< This is key: Triggers the useEffect to run the load sequence
  }, [setTopicData, setIsLoading, setError]);

  useEffect(() => {
    let isMounted = true;
    const mountedChecker = () => isMounted; // Closure to check if component is still mounted

    console.log(`TopicDataProvider - useEffect: isLoading: ${isLoading}`);

    // If not currently loading, it means data is either present from initial props,
    // or a previous load (cache/fetch) has completed.
    if (!isLoading) {
      console.log('TopicDataProvider - useEffect: Not loading. Current cycle complete or initial data was sufficient.');
      return;
    }

    // If we are here, isLoading is true. This means:
    // 1. Initial mount and initialTopicData was empty.
    // 2. refetchData() was called, which set isLoading to true.
    async function loadDataSequentially() {
      console.log('TopicDataProvider - useEffect: Starting data load sequence (isLoading is true).');
      // 1. Try to load from local storage cache first
      try {
        const cachedDataString = localStorage.getItem(TOPIC_DATA_CACHE_KEY);
        if (cachedDataString) {
          const cachedData = JSON.parse(cachedDataString);
          if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS) {
            if (isMounted) {
              console.log('TopicDataProvider - useEffect: Using valid cached data.');
              setTopicData(cachedData.data);
              setError(null); // Clear error if cache is used
              setIsLoading(false); // Cache hit, loading done for this cycle.
            }
            return; // Exit: data loaded from cache, further steps in sequence not needed.
          }
          console.log('TopicDataProvider - useEffect: Cache expired.');
        } else {
          console.log('TopicDataProvider - useEffect: No cached data found in localStorage.');
        }
      } catch (err) {
        console.error('Error reading from cache:', err);
        // Do not set main error here; proceed to fetch if cache read fails, as fetch is the fallback.
      }

      // 2. If cache miss or stale, and we are in a loading state, perform fetch.
      // (performFetch already checks isFetchingRef)
      console.log('TopicDataProvider - useEffect: Cache miss/stale or no cache. Calling performFetch.');
      await performFetch(mountedChecker);
      // performFetch will set isLoading to false upon completion (success or error).
    }

    loadDataSequentially();

    return () => {
      isMounted = false;
    };
  }, [isLoading, performFetch]);
    // The effect's logic is primarily gated by 'isLoading'.
    // initialTopicData is no longer used directly in this effect.
    // Its influence on the initial 'isLoading' state is handled by the useState initializer for isLoading.

  return (
    <TopicDataContext.Provider value={{ topicData, isLoading, error, refetchData }}>
      {children}
    </TopicDataContext.Provider>
  );
}