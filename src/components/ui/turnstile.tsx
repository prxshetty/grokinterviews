'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSpacemanTheme } from '@space-man/react-theme-animation';

// Dynamically import Turnstile to prevent SSR issues
const Turnstile = dynamic(() => import('react-turnstile'), {
  ssr: false,
  loading: () => <div className="h-16 w-full animate-pulse bg-gray-200 rounded" />
});

interface TurnstileComponentProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

export function TurnstileComponent({
  onVerify,
  onError,
  onExpire,
  action = 'auth',
  theme = 'auto',
  size = 'normal',
  className = ''
}: TurnstileComponentProps) {
  const turnstileRef = useRef<HTMLDivElement>(null!);
  const [isClient, setIsClient] = useState(false);
  const { theme: currentTheme } = useSpacemanTheme();

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine the effective theme for Turnstile
  const effectiveTheme = theme === 'auto' ? 
    (currentTheme === 'system' ? 'auto' : currentTheme) : 
    theme;

  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  const handleError = useCallback((error?: Error | any) => {
    const errorMessage = error?.message || 'Turnstile verification failed';
    onError?.(errorMessage);
  }, [onError]);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  // Don't render if Turnstile is disabled
  if (process.env.NEXT_PUBLIC_ENABLE_TURNSTILE !== 'true') {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null;
  }

  // Don't render until we're on the client side
  if (!isClient) {
    return <div className={`h-16 w-full animate-pulse bg-gray-200 rounded ${className}`} />;
  }

  return (
    <div className={className}>
      <Turnstile
        userRef={turnstileRef}
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        action={action}
        theme={effectiveTheme}
        size={size}
        retry="auto"
        refreshExpired="auto"
      />
    </div>
  );
}

export default TurnstileComponent;