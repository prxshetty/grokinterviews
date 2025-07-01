'use client';

import { useEffect, useState, useRef } from 'react';
import { highlightedStats } from '../home/content';

// Note: We're using curated stats for the minimalist design
// Original data is available but not currently displayed

// Utility function to parse number and suffix from stat value
function parseStatValue(value: string) {
  const match = value.match(/^([\d.]+)([kM+]*)$/);
  if (match && match[1] && match[2] !== undefined) {
    return {
      number: parseFloat(match[1]),
      suffix: match[2]
    };
  }
  return { number: 0, suffix: '' };
}

// Utility function to format animated number
function formatNumber(value: number, suffix: string) {
  if (suffix.includes('M')) {
    return value.toFixed(1) + 'M+';
  } else if (suffix.includes('k')) {
    return Math.round(value) + 'k+';
  }
  return Math.round(value).toString() + suffix;
}

// Rolling number animation component
function AnimatedStat({ 
  targetValue, 
  suffix, 
  isVisible, 
  delay = 0,
  description 
}: {
  targetValue: number;
  suffix: string;
  isVisible: boolean;
  delay?: number;
  description: string;
}) {
  const [currentValue, setCurrentValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isVisible || hasStarted) return;

    const timer = setTimeout(() => {
      setHasStarted(true);
      const duration = 2000; // 2 seconds animation
      const steps = 60; // 60 FPS
      const stepValue = targetValue / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const newValue = Math.min(stepValue * currentStep, targetValue);
        setCurrentValue(newValue);

        if (currentStep >= steps) {
          clearInterval(interval);
          setCurrentValue(targetValue);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, targetValue, delay, hasStarted]);

  return (
    <div
      className="flex flex-col items-center text-center py-8 px-4 transition-all duration-700"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
      }}
    >
      <p className="text-4xl md:text-5xl lg:text-6xl font-normal mb-6 tracking-tight">
        {formatNumber(currentValue, suffix)}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mark component as mounted
    setMounted(true);

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

  // Don't animate if not mounted yet to prevent hydration issues
  if (!mounted) {
    return (
      <div className="max-w-screen-xl mx-auto py-24 px-8 opacity-0">
        {/* Skeleton content */}
      </div>
    );
  }

  // Show all stats for 2x4 grid
  const visibleStats = highlightedStats;

  return (
    <div
      ref={sectionRef}
      className={`max-w-screen-xl mx-auto py-24 px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {/* About Section Header */}
      <div
        className="text-center mb-20 transition-all duration-700"
        style={{
          transitionDelay: `${isVisible ? 100 : 0}ms`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
        }}
      >
        <h2 className="text-3xl md:text-4xl mb-6">Grok Interviews</h2>
        <p className="text-base font-serif italic text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Curated by AI<br className="hidden md:block" /> Just for You.
        </p>
      </div>

      {/* Stats Display - 2 rows, 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 mb-24">
        {visibleStats.map((stat, index) => {
          const { number, suffix } = parseStatValue(stat.value);
          const shouldHideOnMobile = stat.hideOnMobile && index >= 4; // Hide last 4 on mobile
          
          return (
            <div
              key={index}
              className={`${shouldHideOnMobile ? 'hidden md:block' : ''}`}
            >
              <AnimatedStat
                targetValue={number}
                suffix={suffix}
                isVisible={isVisible}
                delay={index * 150}
                description={stat.description}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}