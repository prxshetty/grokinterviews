import { useState, useCallback } from 'react';

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

/**
 * Rate limiting hook - currently disabled since users provide their own API keys.
 * Keeping the interface for potential future use.
 */
export const useRateLimit = (): UseRateLimitReturn => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    rateLimitMessage: '',
  });

  // Always returns true (allowed) since users use their own API keys
  const checkRateLimit = useCallback(async (
    _interviewType: 'web' | 'phone' = 'web',
    _sessionType: string = 'behavioral',
    _voiceId: string = 'Sophia'
  ): Promise<boolean> => {
    // Rate limiting disabled - users are using their own API keys
    return true;
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

  return {
    rateLimitState,
    checkRateLimit,
    setRateLimited,
    clearRateLimit,
  };
};