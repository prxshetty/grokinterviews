'use client';

import { useState, useEffect, useRef } from 'react';

const topics = ['Artificial  Intelligence', 'Data  Structures  &  Algorithms', 'Machine  Learning', 'Web  Development', 'System  Design'];

export default function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const currentTopic = topics[currentIndex];
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Simple fade in/out animation
    const animationCycle = () => {
      // Fade out
      setIsVisible(false);

      // Wait for fade out, then change text and fade in
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % topics.length);

        // Fade in with new text
        timeoutRef.current = setTimeout(() => {
          setIsVisible(true);

          // Schedule next cycle
          timeoutRef.current = setTimeout(animationCycle, 4000); // Show text for 4 seconds
        }, 400); // Wait 400ms after changing text
      }, 600); // Fade out duration
    };

    // Start the animation cycle
    timeoutRef.current = setTimeout(animationCycle, 4000); // Initial display time

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="block mt-6 mb-4 relative">
      <div
        className={`
          text-4xl md:text-6xl lg:text-7xl tracking-tight leading-none font-janelotus
          transition-opacity duration-500 ease-in-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {currentTopic}
      </div>
    </div>
  );
}
