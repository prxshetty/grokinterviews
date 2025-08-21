'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { quizTopics } from '@/data/quizTopics';
import TopicCard from './TopicCard';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TopicCarousel() {
  const [activeIndex, setActiveIndex] = useState(0); // Start with first card active
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Set mounted state after component mounts and setup intersection observer
  useEffect(() => {
    setIsMounted(true);

    // Use a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // When the section is 20% visible, trigger the animation
          if (entry && entry.isIntersecting) {
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

  // Check if mobile on mount and window resize with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
        if (cardContainerRef.current) {
          setContainerWidth(cardContainerRef.current.offsetWidth);
        }
      }, 100); // Throttle resize events
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Memoize container width calculation
  useEffect(() => {
    if (isVisible && cardContainerRef.current) {
      // Use requestAnimationFrame to avoid layout thrashing
      requestAnimationFrame(() => {
        if (cardContainerRef.current) {
          setContainerWidth(cardContainerRef.current.offsetWidth);
        }
      });
    }
  }, [isVisible]);

  // Memoize visible topics and card calculations
  const visibleTopics = useMemo(() => quizTopics, []);
  
  const cardCalculations = useMemo(() => {
    if (containerWidth === 0) return [];
    
    const visibleCards = isMobile ? 3 : 5;
    const maxCards = Math.floor(visibleCards / 2);
    const arcWidth = containerWidth * (isMobile ? 0.9 : 0.95);
    const arcHeight = isMobile ? 80 : 120;
    const spacingFactor = isMobile ? 0.6 : 0.8;
    const a = arcWidth > 0 ? arcHeight / Math.pow(arcWidth / 2, 2) : 0;
    
    return visibleTopics.map((topic, index) => {
      const totalCards = visibleTopics.length;
      const relativeIndex = ((index - activeIndex) + totalCards) % totalCards;
      const adjustedRelativeIndex = relativeIndex > totalCards / 2 ? relativeIndex - totalCards : relativeIndex;
      const isCardVisible = Math.abs(adjustedRelativeIndex) <= maxCards;
      const spacedRelativeIndex = adjustedRelativeIndex * spacingFactor;
      const x = maxCards > 0 ? -spacedRelativeIndex * (arcWidth / (maxCards * 2)) : 0;
      const y = a * Math.pow(x, 2);
      const isActive = index === activeIndex;
      const normalizedY = arcHeight > 0 ? y / arcHeight : 0;
      const zIndex = Math.round((1 - normalizedY) * 100);
      const adjustedY = isActive ? y - 20 : y;
      const scale = isActive ? 1.1 : 0.9 + ((1 - normalizedY) * 0.1);
      const opacity = isCardVisible ? (isActive ? 1 : isMobile ? 0.9 : 0.7 + ((1 - normalizedY) * 0.3)) : 0;
      
      return {
        topic,
        index,
        x,
        y: adjustedY,
        scale,
        opacity,
        zIndex,
        isActive,
        isCardVisible
      };
    });
  }, [containerWidth, isMobile, activeIndex, visibleTopics]);

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



  return (
    <div
      ref={sectionRef}
      className="relative w-full h-[600px] md:h-[700px] text-gray-900 dark:text-white overflow-hidden
        transition-all duration-1000"
      >


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
          <Link href="/topics" className="mt-2 px-6 py-2 bg-gray-900 dark:bg-white/10 text-white text-sm rounded-full hover:bg-black dark:hover:bg-white/20 transition-all duration-300 shadow-md border border-gray-700/50 dark:border-white/20 inline-block">
            Browse Topics
          </Link>
        </div>

        {/* Cards in a perfect inverted arc */}
        <div
             ref={cardContainerRef}
             className="relative w-[95%] max-w-[1000px] h-[300px] md:h-[350px] mt-0 md:mt-0 transition-all duration-1000"
             style={{
               transitionDelay: `${isVisible ? 300 : 0}ms`,
               opacity: isVisible ? 1 : 0,
               transform: isVisible ? 'translateY(0)' : 'translateY(40px)'
             }}>
          {cardCalculations.map(({ topic, index, x, y, scale, opacity, zIndex, isActive, isCardVisible }) => (
            <div
              key={topic.id}
              className="absolute top-0 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{
                  x,
                  y,
                  scale,
                  opacity,
                  zIndex,
                }}
                transition={{ 
                  type: 'tween', 
                  duration: 0.4, 
                  ease: 'easeOut'
                }}
                style={{ 
                  pointerEvents: isCardVisible ? 'auto' : 'none',
                  willChange: 'transform, opacity'
                }}
              >
                <TopicCard
                  topic={topic}
                  isActive={isActive}
                  onClick={() => setActiveIndex(index)}
                />
              </motion.div>
            </div>
          ))}
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