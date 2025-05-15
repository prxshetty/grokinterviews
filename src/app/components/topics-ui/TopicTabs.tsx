'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

// Main topics with their corresponding colors - same as in page.tsx
const mainTopics = [
  { id: 'ml', label: 'Machine Learning', color: 'bg-blue-500' },
  { id: 'ai', label: 'Artificial Intelligence', color: 'bg-red-500' },
  { id: 'webdev', label: 'Web Development', color: 'bg-gray-300' },
  { id: 'sdesign', label: 'System Design', color: 'bg-yellow-300' },
  { id: 'dsa', label: 'Data Structures & Algorithms', color: 'bg-green-500' }
];

interface TopicTabsProps {
  selectedTopic: string | null;
  onTopicSelect: (topicId: string) => void;
}

export default function TopicTabs({ selectedTopic, onTopicSelect }: TopicTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize cursor position on component mount and when selectedTopic changes
  useEffect(() => {
    // Initialize cursor position
    setTimeout(() => {
      const activeTopicElement = document.querySelector(`[data-topic="${selectedTopic}"]`) as HTMLElement;
      if (activeTopicElement) {
        const cursor = document.querySelector('.nav-cursor') as HTMLElement;
        if (cursor) {
          cursor.style.width = `${activeTopicElement.getBoundingClientRect().width}px`;
          cursor.style.left = `${activeTopicElement.offsetLeft}px`;
          cursor.style.opacity = '1';
        }
      }
    }, 100);
  }, [selectedTopic]);

  const handleTopicClick = async (topicId: string) => {
    // Call the parent component's handler
    onTopicSelect(topicId);
    
    // Update URL for deep linking while preserving any query parameters
    if (pathname.startsWith('/topics/')) {
      // We're already in a domain page, change to the new domain
      const segments = pathname.split('/');
      segments[2] = topicId; // Replace the domain segment
      
      // Keep only the first 3 segments (topics/domain) to reset the view
      const newPath = segments.slice(0, 3).join('/');
      router.push(newPath);
    } else {
      // Navigate to the domain page
      router.push(`/topics/${topicId}`);
    }
  };

  return (
    <div className="flex justify-between items-center px-4 py-2">
      <div className="flex flex-1">
        <ul className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-0.5 overflow-x-auto"
          onMouseLeave={() => {
            // Reset cursor to active tab position when mouse leaves
            const activeTopicElement = document.querySelector(`[data-topic="${selectedTopic}"]`) as HTMLElement;
            if (activeTopicElement) {
              const cursor = document.querySelector('.nav-cursor') as HTMLElement;
              if (cursor) {
                cursor.style.width = `${activeTopicElement.getBoundingClientRect().width}px`;
                cursor.style.left = `${activeTopicElement.offsetLeft}px`;
                cursor.style.opacity = '1';
              }
            }
          }}
        >
          {/* Animated Background Cursor */}
          <motion.div
            className="nav-cursor absolute z-0 h-11 rounded-full bg-gray-100 dark:bg-gray-800"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          />
          {mainTopics.map((topic, index) => (
            <li
              key={topic.id}
              data-topic={topic.id}
              className="relative z-10 block cursor-pointer"
              onMouseEnter={(e) => {
                // Only apply hover effect if this isn't the active topic
                if (selectedTopic !== topic.id) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                  if (cursor) {
                    cursor.style.width = `${rect.width}px`;
                    cursor.style.left = `${e.currentTarget.offsetLeft}px`;
                    cursor.style.opacity = '1';
                  }
                }
              }}
            >
              {index > 0 && (
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 absolute -left-0.5 top-1/2 transform -translate-y-1/2"></div>
              )}
              <motion.button
                onClick={(e) => {
                  handleTopicClick(topic.id);
                  // Update cursor position immediately for smoother transition
                  const parentElement = e.currentTarget.parentElement as HTMLElement;
                  if (parentElement) {
                    const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                    if (cursor) {
                      cursor.style.width = `${parentElement.getBoundingClientRect().width}px`;
                      cursor.style.left = `${parentElement.offsetLeft}px`;
                      cursor.style.opacity = '1';
                    }
                  }
                }}
                className={`px-4 py-3 text-sm font-small uppercase block whitespace-nowrap ${
                  selectedTopic === topic.id
                    ? 'text-gray-800 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {topic.label}
              </motion.button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 