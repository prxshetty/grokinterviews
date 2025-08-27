import { useState, useEffect, useCallback } from 'react';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    invalidateStreakCache?: () => void;
  }
}

interface StreakData {
  current_streak: number;
  highest_streak: number;
  last_active_date: string | null;
  streak_start_date: string | null;
}

// Ultra-efficient cache with localStorage persistence
let streakCache: {
  data: StreakData | null;
  fetchDate: string | null; // Date when we fetched (YYYY-MM-DD)
  lastActiveDate: string | null; // last_active_date from the streak data
  updatedToday: boolean; // Have we already updated streak today?
} = {
  data: null,
  fetchDate: null,
  lastActiveDate: null,
  updatedToday: false
};

// Load from localStorage on initialization
const loadFromLocalStorage = (userId?: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = userId ? `streak_cache_${userId}` : 'streak_cache';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      streakCache = { ...streakCache, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load streak cache from localStorage:', error);
  }
};

// Save to localStorage
const saveToLocalStorage = (userId?: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = userId ? `streak_cache_${userId}` : 'streak_cache';
    localStorage.setItem(cacheKey, JSON.stringify(streakCache));
  } catch (error) {
    console.warn('Failed to save streak cache to localStorage:', error);
  }
};

export function useStreak(isAuthenticated: boolean = true, userId?: string) {
  const [streakData, setStreakData] = useState<StreakData>({
    current_streak: 0,
    highest_streak: 0,
    last_active_date: null,
    streak_start_date: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ultra-smart cache validation
  const shouldFetchFreshData = useCallback((forceRefresh = false, isQuestionCompletion = false, isBackgroundFetch = false): boolean => {
    if (forceRefresh && !isQuestionCompletion) return true;
    if (!streakCache.data || !streakCache.fetchDate) return true;
    
    const today = new Date().toISOString().split('T')[0] || null;
    
    // If we fetched on a different day, we need fresh data
    if (streakCache.fetchDate !== today) {
      return true;
    }
    
    // If this is a question completion...
    if (isQuestionCompletion) {
      // Check if we've already updated the streak today
      if (streakCache.updatedToday) {
        return false; // Don't fetch - streak won't change again today
      }
      
      // Check if user already completed a question today
      const todayDate = today;
      const lastActiveDate = streakCache.lastActiveDate;
      
      if (lastActiveDate && lastActiveDate.startsWith(todayDate || '')) {
        return false; // Don't fetch - user already completed something today
      }
      
      return true; // First completion today - need to update streak
    }
    
    // Background fetch or regular page load - use cache if same day
    if (isBackgroundFetch) {
      return true;
    }
    
    return false;
  }, []);

  const fetchStreakData = useCallback(async (forceRefresh = false, isQuestionCompletion = false, isBackgroundFetch = false) => {
    try {
      // Don't fetch if user is not authenticated
      if (!isAuthenticated) {
        if (!isBackgroundFetch) setIsLoading(false);
        return;
      }

      // Check if we can use cached data
      if (!shouldFetchFreshData(forceRefresh, isQuestionCompletion, isBackgroundFetch)) {
        setStreakData(streakCache.data!);
        if (!isBackgroundFetch) setIsLoading(false);
        return;
      }

      if (!isBackgroundFetch) {
        setIsLoading(true);
        setError(null);
      }
      
      const response = await fetch('/api/user/streak', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'max-age=60' // Cache streak data for 1 minute
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch streak data');
      }
      
      const data = await response.json();
      
      // Update cache with today's date and streak info
      const today = new Date().toISOString().split('T')[0] || null;
      streakCache = {
        data,
        fetchDate: today,
        lastActiveDate: data.last_active_date,
        updatedToday: isQuestionCompletion // Mark if we updated due to question completion
      };
      
      // Save to localStorage for future visits
      saveToLocalStorage(userId);
      
      setStreakData(data);
    } catch (err: any) {
      console.error('Error fetching streak data:', err);
      if (!isBackgroundFetch) {
        setError(err.message);
      }
    } finally {
      if (!isBackgroundFetch) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, shouldFetchFreshData, userId]);

  // Load from localStorage on mount
  useEffect(() => {
    // Don't do anything if user is not authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    loadFromLocalStorage(userId);
    
    // If we have valid cached data, use it immediately
    if (streakCache.data && streakCache.fetchDate) {
      const today = new Date().toISOString().split('T')[0] || null;
      
      // If cached data is from today, use it to eliminate initial API call
      if (streakCache.fetchDate === today) {
        setStreakData(streakCache.data);
        setIsLoading(false);
        return;
      }
      
      // If cached data is from yesterday or before, we'll show it temporarily
      // while fetching fresh data in the background
      setStreakData(streakCache.data);
      setIsLoading(false); // Show cached data immediately
      
      // Fetch fresh data in background
      fetchStreakData(false, false, true); // silent background fetch
      return;
    }
    
    // No cached data - need initial fetch
    fetchStreakData();
  }, [isAuthenticated, fetchStreakData, userId]);

  // Force refresh function for external use
  const forceRefresh = useCallback(() => {
    return fetchStreakData(true, false);
  }, [fetchStreakData]);

  // Optimized cache invalidation for question completion
  const invalidateCache = useCallback(() => {
    // Don't invalidate if user is not authenticated
    if (!isAuthenticated) {
      return;
    }

    
    const today = new Date().toISOString().split('T')[0] || null;
    
    // If we already updated today, don't fetch again
    if (streakCache.updatedToday && streakCache.fetchDate === today) {
      return;
    }
    
    // Check if user was already active today
    if (streakCache.lastActiveDate && streakCache.lastActiveDate.startsWith(today || '')) {
      return;
    }
    
    // This is the first completion today - fetch fresh data
    fetchStreakData(true, true);
  }, [isAuthenticated, fetchStreakData]);

  // Register global cache invalidation function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.invalidateStreakCache = invalidateCache;
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        delete window.invalidateStreakCache;
      }
    };
  }, [invalidateCache]);

  // Reset cache at start of new day - runs on every render to detect day changes
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0] || null;
    if (streakCache.fetchDate && streakCache.fetchDate !== today) {
      streakCache.updatedToday = false;
      saveToLocalStorage(userId);
    }
  });

  return {
    ...streakData,
    isLoading,
    error,
    refresh: forceRefresh,
    invalidateCache
  };
}