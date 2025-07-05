import { useState, useEffect } from 'react';

interface StreakData {
  current_streak: number;
  highest_streak: number;
  last_active_date: string | null;
  streak_start_date: string | null;
  grace_used: boolean;
}

// Cache streak data in memory
let streakCache: {
  data: StreakData | null;
  lastFetchDate: string | null;
} = {
  data: null,
  lastFetchDate: null
};

export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    current_streak: 0,
    highest_streak: 0,
    last_active_date: null,
    streak_start_date: null,
    grace_used: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreakData = async () => {
    try {
      // Check if we already have data for today
      const today = new Date().toISOString().split('T')[0] || null;
      if (streakCache.data && streakCache.lastFetchDate === today) {
        setStreakData(streakCache.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/streak');
      if (!response.ok) {
        throw new Error('Failed to fetch streak data');
      }
      
      const data = await response.json();
      
      // Update cache
      streakCache = {
        data,
        lastFetchDate: today
      };
      
      setStreakData(data);
    } catch (err: any) {
      console.error('Error fetching streak data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Only fetch on mount or if cache is invalidated
  useEffect(() => {
    fetchStreakData();
  }, []);

  return {
    ...streakData,
    isLoading,
    error,
    refresh: fetchStreakData
  };
} 