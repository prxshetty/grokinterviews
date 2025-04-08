'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { quizTopics } from '@/data/quizTopics';
import TopicCard from './topic/TopicCard';

export default function TopicCarousel() {
  const [activeIndex, setActiveIndex] = useState(0); // Start with first card active
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Set mounted state after component mounts and setup intersection observer
  useEffect(() => {
    setIsMounted(true);

    // Use a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // When the section is 20% visible, trigger the animation
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.2 } // Trigger when 20% of the element is visible
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => {
        if (sectionRef.current) {
          observer.unobserve(sectionRef.current);
        }
      };
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
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

  // Handle navigation to next card
  const handleNextCard = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % quizTopics.length);
  }, []);

  // If not mounted yet, render a simplified version to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="relative">
        <div className="flex justify-center items-center py-16 relative overflow-hidden">
          <div className="h-[400px] flex justify-center items-center">
            <div className="text-gray-400 dark:text-gray-600">Loading topics...</div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate visible topics
  const visibleTopics = quizTopics;

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-[600px] md:h-[700px] bg-white dark:bg-black text-gray-900 dark:text-white overflow-hidden
        transition-all duration-1000"
      >
      {/* Background pattern - only visible in dark mode */}
      <div className="absolute inset-0 opacity-0 dark:opacity-10">
        <div className="absolute inset-0 dark:bg-[#111] bg-opacity-80"></div>
      </div>

      {/* Subtle star pattern - lighter in light mode */}
      <div
        className="absolute inset-0 opacity-5 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* Subtle gradient background - almost invisible in light mode */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 dark:to-black opacity-20 dark:opacity-40"></div>

      {/* Horizontal card container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-0 md:pt-0">
        {/* Center content */}
        <div className="absolute z-10 text-center bottom-0 mb-16 md:mb-20 transition-all duration-1000"
             style={{
               transitionDelay: `${isVisible ? 600 : 0}ms`,
               opacity: isVisible ? 1 : 0,
               transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
             }}>
          <h2 className="text-2xl md:text-3xl font-normal mb-2">Maestro of Interviews</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs mx-auto mb-4">
            AI Agents at your service.<br/>
            You decide your conceirge.<br/>
          </p>
          <button className="mt-2 px-6 py-2 bg-gray-900 dark:bg-white/10 text-white text-sm rounded-full hover:bg-black dark:hover:bg-white/20 transition-all duration-300 shadow-md border border-gray-700/50 dark:border-white/20">
            Browse Questions
          </button>
        </div>

        {/* Cards in a perfect inverted arc */}
        <div className="relative w-[800px] h-[300px] md:w-[1000px] md:h-[350px] mt-0 md:mt-0 transition-all duration-1000"
             style={{
               transitionDelay: `${isVisible ? 300 : 0}ms`,
               opacity: isVisible ? 1 : 0,
               transform: isVisible ? 'translateY(0)' : 'translateY(40px)'
             }}>
          {visibleTopics.map((topic, index) => {
            // Calculate position in a perfect arc
            const totalCards = visibleTopics.length;
            const visibleCards = Math.min(totalCards, 9); // Limit visible cards to avoid overcrowding

            // Calculate the index relative to the active card
            const relativeIndex = ((index - activeIndex) + totalCards) % totalCards;
            const adjustedRelativeIndex = relativeIndex > totalCards / 2 ? relativeIndex - totalCards : relativeIndex;

            // Only show cards that are within the visible range (reduced for more spacing)
            const isVisible = Math.abs(adjustedRelativeIndex) <= Math.floor(visibleCards / 2);
            if (!isVisible) return null;

            // Add additional spacing between cards by adjusting the relative index
            const spacingFactor = 1.25; // Increased for more space between cards
            const spacedRelativeIndex = adjustedRelativeIndex * spacingFactor;

            // Calculate position on a perfect arc
            const maxCards = Math.floor(visibleCards / 2);

            // Arc parameters
            const arcWidth = isMobile ? 750 : 950; // Width of the arc (increased for more spacing)
            const arcHeight = isMobile ? 100 : 120; // Height of the arc (adjusted for flatter curve)

            // Calculate x position using linear distribution with increased spacing
            const x = spacedRelativeIndex * (arcWidth / (maxCards * 2));

            // Calculate y position using a parabola: y = a * x^2
            // Where 'a' is calculated to make y = arcHeight when x = ±(arcWidth/2)
            // Using positive arcHeight to inverse the curve (curve upward)
            const a = arcHeight / Math.pow(arcWidth/2, 2);
            const y = a * Math.pow(x, 2);

            const isActive = index === activeIndex;

            // Calculate z-index and scale based on vertical position
            const normalizedY = y / arcHeight; // Will be between 0 and 1
            const zIndex = Math.round((1 - normalizedY) * 100); // Higher values for cards at the bottom of the arc
            const scale = isActive ? 1.05 : 0.9 + ((1 - normalizedY) * 0.1); // Larger scale for cards at the bottom

            // No rotation for better readability
            const rotationDeg = 0;

            // Calculate card style for positioning
            const cardStyle = {
              transform: `translate(${x}px, ${y}px) rotate(${rotationDeg}deg) scale(${scale})`,
              zIndex: zIndex,
              opacity: 0.7 + ((1 - normalizedY) * 0.3), // More opaque for cards at the bottom of the arc
            };

            return (
              <div
                key={topic.id}
                className="absolute top-0 left-1/2 -translate-x-1/2"
              >
                <TopicCard
                  topic={topic}
                  isActive={isActive}
                  style={cardStyle}
                  onClick={() => setActiveIndex(index)}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation arrows */}
        <div className="absolute bottom-0 w-full flex justify-between px-4 md:px-8 z-20 mb-32 md:mb-36 transition-all duration-1000"
             style={{
               transitionDelay: `${isVisible ? 900 : 0}ms`,
               opacity: isVisible ? 1 : 0
             }}>
          <button
            onClick={() => setActiveIndex((prevIndex) => (prevIndex - 1 + visibleTopics.length) % visibleTopics.length)}
            className="w-10 h-10 md:w-12 md:h-12 bg-gray-900/90 dark:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black dark:hover:bg-black/60 transition-all duration-300 shadow-lg border border-gray-700/50 dark:border-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextCard}
            className="w-10 h-10 md:w-12 md:h-12 bg-gray-900/90 dark:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black dark:hover:bg-black/60 transition-all duration-300 shadow-lg border border-gray-700/50 dark:border-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
