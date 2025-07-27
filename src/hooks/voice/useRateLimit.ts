import { useState, useCallback, useEffect } from 'react';

export interface RateLimitState {
  isRateLimited: boolean;
  rateLimitMessage: string;
}

export interface UseRateLimitReturn {
  rateLimitState: RateLimitState;
  checkRateLimit: (interviewType?: 'web' | 'phone', sessionType?: string, voiceId?: string) => Promise<boolean>;
  setRateLimited: (limited: boolean, message?: string) => void;
  clearRateLimit: () => void;
}

export const useRateLimit = (): UseRateLimitReturn => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    rateLimitMessage: '',
  });

  const checkRateLimit = useCallback(async (
    interviewType: 'web' | 'phone' = 'web', 
    sessionType: string = 'behavioral',
    voiceId: string = 'Sophia'
  ): Promise<boolean> => {
    try {
      let endpoint: string;
      let requestBody: any;

      if (interviewType === 'web') {
        endpoint = '/api/voice/conversation';
        requestBody = {
          checkRateLimit: true,
          sessionType,
          voiceId
        };
      } else {
        endpoint = '/api/voice/phone-calls';
        requestBody = {
          checkRateLimitOnly: true,
          userId: 'current' // This will be handled by the API to get current user
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        const errorData = await response.json();
        const defaultMessage = interviewType === 'web' 
          ? 'You have already completed an interview this week. Please try again next week.'
          : 'You have already made a phone interview today. Please try again tomorrow.';
          
        setRateLimitState({
          isRateLimited: true,
          rateLimitMessage: errorData.message || defaultMessage,
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

  // Check rate limit on mount (default to web interviews)
  useEffect(() => {
    checkRateLimit('web');
  }, [checkRateLimit]); // checkRateLimit is stable due to useCallback with empty deps

  return {
    rateLimitState,
    checkRateLimit,
    setRateLimited,
    clearRateLimit,
  };
};