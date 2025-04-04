'use client';

import { useEffect, useState, useRef } from 'react';

// Selected key stats to highlight
const highlightedStats = [
  { value: "720", description: "total questions across all topics" },
  { value: "16,545", description: "monthly active users and visitors" },
  { value: "84", description: "educational resources and guides" },
  { value: "95%", description: "user satisfaction rate" },
  { value: "42", description: "industry expert contributors" },
  { value: "1,200+", description: "hours of interview prep content" }
];

// Note: We're using curated stats for the minimalist design
// Original data is available but not currently displayed

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

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

      {/* Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 mb-24">
        {highlightedStats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center md:border-r md:last:border-r-0 border-gray-200 dark:border-gray-700 py-8 px-8 transition-all duration-700"
            style={{
              transitionDelay: `${isVisible ? index * 200 : 0}ms`,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
            }}>
            <p className="text-5xl md:text-6xl lg:text-7xl font-normal mb-10 tracking-tight">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] mx-auto">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}