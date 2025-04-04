'use client';

import React, { useState, useEffect } from 'react';
import { quizTopics } from '@/data/quizTopics';
import TopicCard from './TopicCard';

export default function TopicCarousel() {
  const [activeIndex, setActiveIndex] = useState(4); // Start with a middle card active
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Calculate visible topics so it looks like more cards off-screen
  const visibleTopics = quizTopics;

  // If not mounted yet, render a simplified version to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="relative">
        <div className="flex justify-center items-center pt-8 pb-16 relative overflow-hidden">
          <div className="h-[240px] flex justify-center items-center">
            <div className="text-gray-400 dark:text-gray-600">Loading topics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Card container with slight arc - no scrolling */}
      <div className="flex justify-center items-center pt-8 pb-16 relative overflow-hidden">
        {/* Enhanced arc background indicator */}
        <div className="absolute bottom-0 left-1/2 w-[95%] h-[300px] border-t-2 border-gray-200 dark:border-gray-700 rounded-t-full transform -translate-x-1/2 opacity-30 dark:opacity-20"></div>
        <div className="absolute bottom-0 left-1/2 w-[85%] h-[280px] border-t border-gray-300 dark:border-gray-600 rounded-t-full transform -translate-x-1/2 opacity-20 dark:opacity-15"></div>

        {/* All cards displayed at once in a gentle arc */}
        <div className="flex justify-center items-end space-x-4 md:space-x-6 px-2 md:px-4 max-w-full overflow-visible">
          {visibleTopics.map((topic, index) => {
            // Calculate slight vertical and rotation offsets for gentle curve
            const totalCards = visibleTopics.length;
            const midPoint = Math.floor(totalCards / 2);
            const distanceFromMiddle = index - midPoint;
            const isActive = index === activeIndex;

            // Subtle arc effect calculations
            // Cards further from center are positioned lower with subtle rotation
            const verticalOffset = Math.pow(Math.abs(distanceFromMiddle), 1.5) * (isMobile ? 10 : 12); // Adjusted curve calculation
            const rotationDeg = (distanceFromMiddle * (isMobile ? 2.5 : 3)) * (1 - Math.abs(distanceFromMiddle) * 0.1); // Smoother rotation
            const scale = 1 - Math.abs(distanceFromMiddle) * 0.04; // Base scale for non-active cards
            // Using 1.05 as active scale directly in the transform style

            // Card visibility logic - hide cards that would be way off screen
            const isVisible = Math.abs(distanceFromMiddle) <= 5; // Show only cards close enough to center

            if (!isVisible) return null;

            // Calculate card style for positioning
            const cardStyle = {
              transform: `translateY(${verticalOffset}px) rotate(${rotationDeg}deg) scale(${isActive ? 1.05 : scale})`,
              opacity: 1 - Math.abs(distanceFromMiddle) * 0.15, // Fade out cards further from center
            };

            return (
              <TopicCard
                key={topic.id}
                topic={topic}
                isActive={isActive}
                style={cardStyle}
                onClick={() => setActiveIndex(index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
