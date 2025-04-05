'use client';

import React, { useState } from 'react';

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

// Map of tech stacks to their icons
const techIcons: Record<string, string> = {
  'JavaScript': '⬢', // Hexagon with JS color
  'React': '⚛️',
  'CSS': '🎨',
  'System Design': '🏗️',
  'Data Structures': '📊',
  'Web Performance': '⚡',
  'Node.js': '🟢',
  'GraphQL': '◼️',
  'Redux': '🔄',
  'DevOps': '🔄',
  'TypeScript': '📘',
  'Python': '🐍',
  'AWS': '☁️',
  'Docker': '🐳',
  'Kubernetes': '⎈',
  'SQL': '🗃️',
  'MongoDB': '🍃',
  'Rust': '⚙️',
  // Default icon for any missing mappings
  'default': '💻'
};

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
    ? `${style.transform?.toString() || ''} scale(1.05)`
    : style.transform;

  // Get the appropriate icon for this tech stack
  const icon = techIcons[topic.title] || techIcons['default'];

  return (
    <div
      key={topic.id}
      className={`
        group relative flex-shrink-0 w-[120px] h-[160px] md:w-[140px] md:h-[180px] rounded-xl overflow-hidden
        transition-all duration-300 ease-out cursor-pointer
        ${isActive ? 'z-10 shadow-xl' : 'z-0 shadow-lg'}
        hover:z-20 hover:shadow-xl
        backdrop-blur-md
      `}
      style={{
        ...style,
        transform: transformStyle,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base background - dark in both modes */}
      <div className="absolute inset-0 bg-gray-900 dark:bg-black transition-all duration-300"></div>

      {/* Colored overlay with gradient */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-40"
        style={{
          background: `radial-gradient(circle at center 40%,
                      ${getColorWithOpacity(topic.shade, 1)} 0%,
                      transparent 70%)`
        }}
      ></div>

      {/* Glass effect border */}
      <div className="absolute inset-0 border border-white/10 dark:border-white/10 rounded-xl"></div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '8px 8px'
        }}
      ></div>

      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          boxShadow: `inset 0 0 30px ${getColorWithOpacity(topic.shade, 0.5)}`
        }}
      ></div>

      {/* Hover state overlay */}
      <div
        className={`absolute inset-0 bg-white dark:bg-white transition-all duration-300 ${
          isHovered ? 'opacity-10' : 'opacity-0'
        }`}
      ></div>

      {/* Card content with icon and text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
        {/* Icon container with glow effect */}
        <div
          className={`
            w-16 h-16 mb-4 flex items-center justify-center rounded-full
            ${isActive ? 'scale-110' : 'scale-100'}
            transition-all duration-300 animate-pulse-slow
          `}
          style={{
            background: `radial-gradient(circle at center,
                        ${getColorWithOpacity(topic.shade, 0.8)} 0%,
                        ${getColorWithOpacity(topic.shade, 0.4)} 50%,
                        transparent 70%)`,
            boxShadow: `0 0 30px ${getColorWithOpacity(topic.shade, 0.6)}`
          }}
        >
          {/* Tech icon */}
          <div className="text-2xl md:text-3xl">{icon}</div>
        </div>

        {/* Text content */}
        <div className="text-center mt-2">
          <h3 className="text-sm md:text-base font-medium">{topic.title}</h3>
          {isHovered && (
            <div className="mt-1 text-[10px] md:text-xs text-gray-400">{topic.subtitle}</div>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute bottom-3 w-1 h-1 rounded-full bg-white animate-pulse"></div>
        )}
      </div>
    </div>
  );
}
