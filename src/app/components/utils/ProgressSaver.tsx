'use client';

import { useEffect } from 'react';

export default function ProgressSaver() {
  // Listen for beforeunload event to save progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Dispatch a custom event to trigger progress saving
      window.dispatchEvent(new CustomEvent('saveProgress'));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 