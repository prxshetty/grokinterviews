'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        group relative flex-shrink-0 w-[120px] md:w-[180px] h-[180px] md:h-[240px] rounded-lg overflow-hidden
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
                      ${getColorWithOpacity(topic.shade, 0.7)} 0%,
                      ${getColorWithOpacity(topic.shade, 0.9)} 50%,
                      ${getColorWithOpacity(topic.shade, 0.7)} 100%)`,
          boxShadow: `0 4px 20px ${getColorWithOpacity(topic.shade, 0.5)}`,
          border: `1px solid ${getColorWithOpacity(topic.shade, 0.3)}`
        }}
      ></div>

      {/* Radial gradient for depth */}
      <div 
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 70% 30%, 
                     ${getColorWithOpacity(topic.shade, 0.5)} 0%, 
                     ${getColorWithOpacity(topic.shade, 0.9)} 100%)`
        }}
      ></div>

      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-5 mix-blend-overlay"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` 
        }}
      ></div>

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-black transition-all duration-300 ${
          isHovered ? 'opacity-20 backdrop-blur-sm' : isActive ? 'opacity-10' : 'opacity-0'
        }`}
      ></div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 mix-blend-overlay"
           style={{ backgroundImage: 'url("/patterns/dot-pattern.png")' }}></div>

      {/* Top gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-80"></div>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80"></div>

      {/* Card content */}
      <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between text-white">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs md:text-sm font-light tracking-wide opacity-80">{topic.id}</div>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg md:text-xl font-semibold mb-1 tracking-tight">{topic.title}</h3>
          <p className="text-xs md:text-sm opacity-80 font-light">{topic.subtitle}</p>
        </div>

        {/* Bottom action area */}
        <div className="flex justify-between items-center">
          {/* Horizontal line */}
          <div className="w-full h-px bg-white/20 my-3"></div>
        </div>
        
        <div className="flex justify-between items-center">
          <Link href={`/topics/${topic.id}`} className="text-xs md:text-sm font-medium opacity-90 hover:opacity-100 flex items-center gap-1 group">
            <span>View</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5 transform transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          
          {isActive && (
            <div className="text-xs uppercase font-medium opacity-70 tracking-wider flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse"></div>
              Active
            </div>
          )}
        </div>
      </div>

      {/* Reveal on hover - additional info */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent
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

      {/* Glow effect for active card */}
      {isActive && (
        <div 
          className="absolute -inset-0.5 rounded-lg opacity-30 blur-sm pointer-events-none" 
          style={{ 
            background: `${getColorWithOpacity(topic.shade, 0.8)}`,
            animation: 'pulse 2s infinite'
          }}
        ></div>
      )}
    </div>
  );
}
