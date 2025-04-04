'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TopicCardProps {
  topic: {
    id: string;
    shade: string;
    title: string;
    subtitle: string;
  };
  isActive: boolean;
  isMobile: boolean;
  style: React.CSSProperties;
  onClick: () => void;
}

export default function TopicCard({ topic, isActive, isMobile, style, onClick }: TopicCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={topic.id}
      className={`
        group relative flex-shrink-0 w-[120px] md:w-[180px] h-[180px] md:h-[240px] rounded-xl overflow-hidden shadow-lg
        transition-all duration-300 ease-out cursor-pointer
        ${isActive ? 'z-10 shadow-lg' : 'z-0'}
        hover:z-20 hover:shadow-xl
      `}
      style={{
        ...style,
        transform: `${style.transform} ${isHovered ? 'scale(1.05)' : ''}`
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card background with gradient */}
      <div className={`absolute inset-0 ${topic.shade} transition-opacity duration-300`}></div>

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isHovered || isActive ? 'opacity-20' : 'opacity-0'
        }`}
      ></div>

      {/* Card content */}
      <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between text-white">
        <div>
          <div className="text-xs md:text-sm opacity-80 mb-1">Topic {topic.id}</div>
          <h3 className="text-lg md:text-xl font-bold mb-1">{topic.title}</h3>
          <p className="text-xs md:text-sm opacity-80">{topic.subtitle}</p>
        </div>

        {/* Bottom action area */}
        <div className="flex justify-between items-center">
          <Link href={`/topics/${topic.id}`} className="text-xs md:text-sm underline opacity-80 hover:opacity-100">
            Explore
          </Link>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Reveal on hover - additional info */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-center">
          <div className="text-sm font-bold mb-2 text-white dark:text-white">Explore {topic.title}</div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 dark:bg-white/30 text-xs font-medium border border-white/10 dark:border-white/20 shadow-lg">View Details</div>
        </div>
      </div>

      {/* Subtle effects for active card */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-white/5 dark:bg-white/10 animate-pulse pointer-events-none"></div>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/40 dark:bg-white/60 animate-pulse"></div>
        </>
      )}
    </div>
  );
}
