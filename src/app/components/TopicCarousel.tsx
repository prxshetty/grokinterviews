'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const quizTopics = [
  { id: '01', shade: 'bg-black opacity-10 dark:bg-white dark:opacity-10', title: 'JavaScript Basics', subtitle: 'Core language fundamentals' },
  { id: '02', shade: 'bg-black opacity-20 dark:bg-white dark:opacity-20', title: 'React Essentials', subtitle: 'Component patterns & hooks' },
  { id: '03', shade: 'bg-black opacity-30 dark:bg-white dark:opacity-30', title: 'CSS & Styling', subtitle: 'Modern layout techniques' },
  { id: '04', shade: 'bg-black opacity-40 dark:bg-white dark:opacity-40', title: 'System Design', subtitle: 'Architecture fundamentals' },
  { id: '05', shade: 'bg-black opacity-50 dark:bg-white dark:opacity-50', title: 'Data Structures', subtitle: 'Algorithms & problem solving' },
  { id: '06', shade: 'bg-black opacity-60 dark:bg-white dark:opacity-60', title: 'Web Performance', subtitle: 'Optimization strategies' },
  { id: '07', shade: 'bg-black opacity-70 dark:bg-white dark:opacity-70', title: 'Backend Dev', subtitle: 'API design & implementation' },
  { id: '08', shade: 'bg-black opacity-80 dark:bg-white dark:opacity-80', title: 'GraphQL', subtitle: 'Modern API development' },
  { id: '09', shade: 'bg-black opacity-90 dark:bg-white dark:opacity-90', title: 'State Management', subtitle: 'Managing application state' },
  { id: '10', shade: 'bg-black opacity-90 dark:bg-white dark:opacity-90', title: 'DevOps', subtitle: 'CI/CD and deployment' },
];

export default function TopicCarousel() {
  const [activeIndex, setActiveIndex] = useState(4); // Center card starts as active
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on a mobile device for responsive adjustments
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

  return (
    <div className="py-16">
      {/* Container for all cards with slight curve */}
      <div className="relative">
        {/* Card container with slight arc - no scrolling */}
        <div className="flex justify-center items-center py-12 relative overflow-hidden">
          {/* Subtle arc background indicator */}
          <div className="absolute bottom-0 left-1/2 w-[90%] h-[220px] border-t-2 border-gray-200 dark:border-gray-800 rounded-t-full transform -translate-x-1/2 opacity-50"></div>
          
          {/* All cards displayed at once in a gentle arc */}
          <div className="flex justify-center items-end space-x-2 md:space-x-3 px-2 md:px-4 max-w-full overflow-visible">
            {visibleTopics.map((topic, index) => {
              // Calculate slight vertical and rotation offsets for gentle curve
              const totalCards = visibleTopics.length;
              const midPoint = Math.floor(totalCards / 2);
              const distanceFromMiddle = index - midPoint;
              const isActive = index === activeIndex;
              
              // Subtle arc effect calculations
              // Cards further from center are positioned lower with subtle rotation
              const verticalOffset = Math.abs(distanceFromMiddle) * (isMobile ? 8 : 10); // px lower for cards away from center
              const rotationDeg = distanceFromMiddle * (isMobile ? 3 : 4); // subtle rotation
              const scale = isActive ? 1 : (1 - Math.abs(distanceFromMiddle) * 0.05); // subtle scaling
              
              // Card visibility logic - hide cards that would be way off screen
              const isVisible = Math.abs(distanceFromMiddle) <= 5; // Show only cards close enough to center
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={topic.id}
                  className={`w-[168px] md:w-[216px] h-[264px] md:h-[312px] rounded-lg ${topic.shade} text-white dark:text-black cursor-pointer transition-all duration-300 transform-gpu select-none flex-shrink-0 hover:-translate-y-3 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 border border-white/10 dark:border-black/10 shadow-[0_8px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(255,255,255,0.1)]`}
                  style={{ 
                    transform: `translateY(${verticalOffset}px) rotate(${rotationDeg}deg) scale(${scale})`,
                    opacity: isActive ? 1 : (1 - Math.abs(distanceFromMiddle) * 0.1),
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  }}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="p-5 md:p-7 h-full flex flex-col justify-between" style={{ transform: `rotate(${-rotationDeg}deg)` }}>
                    {/* Top section with number */}
                    <div className="text-2xl md:text-4xl font-bold opacity-80 font-sans">{topic.id}</div>
                    
                    {/* Middle section with titles */}
                    <div className="mt-auto">
                      <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2 font-sans tracking-tight">{topic.title}</h3>
                      <p className="text-xs md:text-sm opacity-80 font-sans line-clamp-2">{topic.subtitle}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* View All Quizzes Button */}
      <div className="text-center mt-12">
        <Link 
          href="/topics" 
          className="px-4 py-2 border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-md inline-flex items-center text-sm"
        >
          Get notified
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
} 