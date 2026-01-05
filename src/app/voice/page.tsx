'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function VoicePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/voice/web');
  }, [router]);

  return (
    <LoadingSpinner
      size="lg"
      centered={true}
    />
  );
}