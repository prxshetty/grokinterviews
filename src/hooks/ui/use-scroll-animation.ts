'use client';

import { useState, useEffect, useRef } from 'react';

interface ScrollAnimationHook {
  ref: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  mounted: boolean;
}

export function useScrollAnimation(threshold = 0.2): ScrollAnimationHook {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isVisible, mounted };
} 