'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

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

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleVerify = useCallback((token: string) => {
    console.log('Turnstile verification successful');
    onVerify(token);
  }, [onVerify]);

  const handleError = useCallback((error?: Error | any) => {
    const errorMessage = error?.message || 'Turnstile verification failed';
    console.error('Turnstile error:', errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  const handleExpire = useCallback(() => {
    console.warn('Turnstile token expired');
    onExpire?.();
  }, [onExpire]);

  // Don't render if Turnstile is disabled
  if (process.env.NEXT_PUBLIC_ENABLE_TURNSTILE !== 'true') {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    console.warn('Turnstile site key not configured');
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
        theme={theme}
        size={size}
        retry="auto"
        refreshExpired="auto"
      />
    </div>
  );
}

export default TurnstileComponent;