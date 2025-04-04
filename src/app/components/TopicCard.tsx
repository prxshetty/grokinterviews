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
  isMobile?: boolean; // Make this optional
  style: React.CSSProperties;
  onClick: () => void;
}

// Helper function to get color with opacity
const getColorWithOpacity = (shade: string, opacity: number) => {
  // Map of Tailwind color classes to their hex values
  const colorMap: Record<string, string> = {
    'bg-red-600': '#dc2626',
    'bg-red-700': '#b91c1c',
    'bg-yellow-500': '#eab308',
    'bg-orange-500': '#f97316',
    'bg-amber-600': '#d97706',
    'bg-lime-600': '#65a30d',
    'bg-green-600': '#16a34a',
    'bg-emerald-600': '#059669',
    'bg-teal-600': '#0d9488',
    'bg-cyan-600': '#0891b2',
    'bg-sky-600': '#0284c7',
    'bg-blue-600': '#2563eb',
    'bg-indigo-600': '#4f46e5',
    'bg-violet-600': '#7c3aed',
    'bg-purple-600': '#9333ea',
    'bg-fuchsia-600': '#c026d3',
    'bg-pink-600': '#db2777',
    'bg-rose-600': '#e11d48',
  };

  const hexColor = colorMap[shade] || '#000000';
  return `${hexColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default function TopicCard({ topic, isActive, style, onClick }: TopicCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate the transform style with hover effect
  const transformStyle = isHovered
    ? `${style.transform?.toString() || ''} scale(1.08) translateY(-5px)`
    : style.transform;

  return (
    <div
      key={topic.id}
      className={`
        group relative flex-shrink-0 w-[120px] md:w-[180px] h-[180px] md:h-[240px] rounded-xl overflow-hidden
        transition-all duration-300 ease-out cursor-pointer
        ${isActive ? 'z-10 shadow-xl' : 'z-0 shadow-lg'}
        hover:z-20 hover:shadow-xl
      `}
      style={{
        ...style,
        transform: transformStyle,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card background with solid color */}
      <div className={`absolute inset-0 ${topic.shade} transition-all duration-300`}></div>

      {/* Colorful gradient overlay */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(135deg,
                      ${getColorWithOpacity(topic.shade, 0.8)} 0%,
                      ${getColorWithOpacity(topic.shade, 0.9)} 50%,
                      ${getColorWithOpacity(topic.shade, 0.7)} 100%)`,
          boxShadow: `0 4px 20px ${getColorWithOpacity(topic.shade, 0.5)}`,
          border: `1px solid ${getColorWithOpacity(topic.shade, 0.3)}`
        }}
      ></div>

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-black transition-all duration-300 ${
          isHovered ? 'opacity-20 backdrop-blur-sm' : isActive ? 'opacity-10' : 'opacity-0'
        }`}
      ></div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/0 opacity-70"></div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 mix-blend-overlay"
           style={{ backgroundImage: 'url("/patterns/dot-pattern.png")' }}></div>

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
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent
        opacity-0 ${isHovered ? 'opacity-100' : ''} transition-all duration-300
        flex items-end justify-center pb-6 pointer-events-none`}
      >
        <div className={`transform ${isHovered ? 'translate-y-0' : 'translate-y-4'} transition-all duration-300 text-center`}>
          <div className="text-sm font-bold mb-2 text-white">Explore {topic.title}</div>
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium shadow-lg"
            style={{
              background: `${getColorWithOpacity(topic.shade, 0.3)}`,
              borderColor: `${getColorWithOpacity(topic.shade, 0.5)}`,
              borderWidth: '1px',
              boxShadow: `0 2px 10px ${getColorWithOpacity(topic.shade, 0.4)}`
            }}
          >
            View Details
          </div>
        </div>
      </div>

      {/* Subtle effects for active card */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>
          <div
            className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: getColorWithOpacity(topic.shade, 0.8) }}
          ></div>
          <div className="absolute top-3 left-3 text-[8px] font-mono tracking-wide"
               style={{ color: getColorWithOpacity(topic.shade, 0.9) }}>
            <div>active</div>
          </div>
        </>
      )}
    </div>
  );
}
