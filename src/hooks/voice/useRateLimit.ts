import { useState, useCallback, useEffect } from 'react';

export interface RateLimitState {
  isRateLimited: boolean;
  rateLimitMessage: string;
}

export interface UseRateLimitReturn {
  rateLimitState: RateLimitState;
  checkRateLimit: (sessionType?: string) => Promise<boolean>;
  setRateLimited: (limited: boolean, message?: string) => void;
  clearRateLimit: () => void;
}

export const useRateLimit = (): UseRateLimitReturn => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    rateLimitMessage: '',
  });

  const checkRateLimit = useCallback(async (sessionType: string = 'behavioral'): Promise<boolean> => {
    try {
      const response = await fetch('/api/voice/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkRateLimit: true,
          sessionType
        }),
      });

      if (response.status === 429) {
        const errorData = await response.json();
        setRateLimitState({
          isRateLimited: true,
          rateLimitMessage: errorData.message || 'You have already completed an interview this week. Please try again next week.',
        });
        return false;
      }
      
      if (!response.ok) {
        throw new Error('Failed to check rate limit');
      }
      
      // If we get here, user is not rate limited
      setRateLimitState({
        isRateLimited: false,
        rateLimitMessage: '',
      });
      return true;
      
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      // On error, allow the interview to proceed (fail open)
      return true;
    }
  }, []);

  const setRateLimited = useCallback((limited: boolean, message: string = '') => {
    setRateLimitState({
      isRateLimited: limited,
      rateLimitMessage: message,
    });
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitState({
      isRateLimited: false,
      rateLimitMessage: '',
    });
  }, []);

  // Check rate limit on mount
  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]); // checkRateLimit is stable due to useCallback with empty deps

  return {
    rateLimitState,
    checkRateLimit,
    setRateLimited,
    clearRateLimit,
  };
};