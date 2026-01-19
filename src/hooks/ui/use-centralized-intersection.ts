'use client';

import { useState, useEffect, useRef } from 'react';

// Centralized intersection observer manager
class IntersectionManager {
  private static instance: IntersectionManager;
  private observers: Map<string, IntersectionObserver> = new Map();
  private callbacks: Map<Element, Set<(isVisible: boolean) => void>> = new Map();
  private visibilityState: Map<Element, boolean> = new Map();

  static getInstance(): IntersectionManager {
    if (!IntersectionManager.instance) {
      IntersectionManager.instance = new IntersectionManager();
    }
    return IntersectionManager.instance;
  }

  private getObserverKey(threshold: number, rootMargin: string): string {
    return `${threshold}-${rootMargin}`;
  }

  private getOrCreateObserver(threshold: number, rootMargin: string): IntersectionObserver {
    const key = this.getObserverKey(threshold, rootMargin);

    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const isVisible = entry.isIntersecting;
            this.visibilityState.set(entry.target, isVisible);

            const callbacks = this.callbacks.get(entry.target);
            if (callbacks) {
              callbacks.forEach(callback => callback(isVisible));
            }
          });
        },
        { threshold, rootMargin }
      );

      this.observers.set(key, observer);
    }

    return this.observers.get(key)!;
  }

  observe(
    element: Element,
    callback: (isVisible: boolean) => void,
    options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
  ): () => void {
    const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options;

    const observer = this.getOrCreateObserver(threshold, rootMargin);

    // Add callback to the set
    if (!this.callbacks.has(element)) {
      this.callbacks.set(element, new Set());
    }

    const wrappedCallback = once
      ? (isVisible: boolean) => {
        if (isVisible) {
          callback(isVisible);
          this.unobserve(element, wrappedCallback);
        }
      }
      : callback;

    this.callbacks.get(element)!.add(wrappedCallback);
    observer.observe(element);

    // Return cleanup function
    return () => this.unobserve(element, wrappedCallback);
  }

  unobserve(element: Element, callback?: (isVisible: boolean) => void): void {
    const callbacks = this.callbacks.get(element);

    if (callback && callbacks) {
      callbacks.delete(callback);

      // If no more callbacks for this element, stop observing
      if (callbacks.size === 0) {
        this.callbacks.delete(element);
        this.visibilityState.delete(element);

        // Find and unobserve from all observers
        this.observers.forEach(observer => {
          observer.unobserve(element);
        });
      }
    } else {
      // Remove all callbacks for this element
      this.callbacks.delete(element);
      this.visibilityState.delete(element);

      this.observers.forEach(observer => {
        observer.unobserve(element);
      });
    }
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.callbacks.clear();
    this.visibilityState.clear();
  }
}

// Hook for using centralized intersection observer
export function useCentralizedIntersection(options: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
} = {}) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options;

  useEffect(() => {
    setMounted(true);

    if (ref.current) {
      const manager = IntersectionManager.getInstance();

      cleanupRef.current = manager.observe(
        ref.current,
        (visible) => setIsVisible(visible),
        { threshold, rootMargin, once }
      );
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [threshold, rootMargin, once]);

  return { ref, isVisible, mounted };
}

// Cleanup function for when the app unmounts
export const cleanupIntersectionManager = () => {
  IntersectionManager.getInstance().cleanup();
};