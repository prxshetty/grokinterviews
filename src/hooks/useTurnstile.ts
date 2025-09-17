'use client';

import { useState, useCallback } from 'react';

interface UseTurnstileReturn {
  token: string | null;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export function useTurnstile(): UseTurnstileReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified = Boolean(token && !error);

  const handleSetToken = useCallback((newToken: string | null) => {
    setToken(newToken);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleSetError = useCallback((newError: string | null) => {
    setError(newError);
    setToken(null);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    token,
    isVerified,
    isLoading,
    error,
    setToken: handleSetToken,
    setError: handleSetError,
    reset
  };
}