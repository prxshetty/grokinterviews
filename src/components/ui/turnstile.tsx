'use client';

import Turnstile from 'react-turnstile';
import { useCallback, useRef } from 'react';

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