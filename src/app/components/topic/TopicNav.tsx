"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const mainTopics = [
  { id: 'ml', label: 'Machine Learning' },
  { id: 'ai', label: 'Artificial Intelligence' },
  { id: 'webdev', label: 'Web Development' },
  { id: 'sdesign', label: 'System Design' },
  { id: 'dsa', label: 'Data Structures & Algorithms' }
];

interface TopicNavProps {
  onTopicSelect: (topicId: string) => void;
  selectedTopic?: string | null;
}

export default function TopicNav({ onTopicSelect, selectedTopic: externalSelectedTopic }: TopicNavProps) {
  const [internalSelectedTopic, setInternalSelectedTopic] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<{[key: string]: number}>({});
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const pathname = usePathname();

  // Check if we're on the topics page
  const isTopicsPage = pathname === '/topics';

  // Use external selected topic if provided, otherwise use internal state
  const effectiveSelectedTopic = externalSelectedTopic !== undefined ? externalSelectedTopic : internalSelectedTopic;

  // Sync with external state when it changes and initialize cursor position
  useEffect(() => {
    if (externalSelectedTopic !== undefined) {
      setInternalSelectedTopic(externalSelectedTopic);
    }

    // Initialize cursor position
    setTimeout(() => {
      const activeTopicElement = document.querySelector(`[data-topic="${effectiveSelectedTopic}"]`) as HTMLElement;
      if (activeTopicElement) {
        const cursor = document.querySelector('.nav-cursor') as HTMLElement;
        if (cursor) {
          cursor.style.width = `${activeTopicElement.getBoundingClientRect().width}px`;
          cursor.style.left = `${activeTopicElement.offsetLeft}px`;
          cursor.style.opacity = '1';
        }
      }
    }, 100);
  }, [externalSelectedTopic, effectiveSelectedTopic]);

  // Detect double click on a topic
  const handleTopicClick = (topicId: string) => {
    const now = new Date().getTime();
    const lastClick = lastClickTime[topicId] || 0;
    const isDoubleClick = now - lastClick < 300; // 300ms threshold for double-click

    // Update last click time
    setLastClickTime(prev => ({
      ...prev,
      [topicId]: now
    }));

    // Handle the click
    if (isDoubleClick) {
      // Double click: toggle expanded status
      const newExpandedTopic = expandedTopic === topicId ? null : topicId;
      setExpandedTopic(newExpandedTopic);

      // Dispatch custom event for TopicTreeNavigation to listen to
      window.dispatchEvent(new CustomEvent('topicDoubleClicked', {
        detail: { topicId, isExpanded: newExpandedTopic === topicId }
      }));
    }

    // Always handle single click (whether part of double-click or not)
    setInternalSelectedTopic(topicId);
    onTopicSelect(topicId);
  };



  return (
    <div className={`w-full py-3 pl-8 pr-4 ${isTopicsPage ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md' : 'bg-transparent'} text-black dark:text-white transition-all duration-300`}>
      <div className="flex items-center">
        {/* Left-aligned Navigation Links - with border */}
        <ul className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-1 overflow-x-auto"
          onMouseLeave={() => {
            // Reset cursor to active tab position when mouse leaves
            const activeTabElement = document.querySelector(`[data-topic="${effectiveSelectedTopic}"]`) as HTMLElement;
            if (activeTabElement) {
              const cursor = document.querySelector('.nav-cursor') as HTMLElement;
              if (cursor) {
                cursor.style.width = `${activeTabElement.getBoundingClientRect().width}px`;
                cursor.style.left = `${activeTabElement.offsetLeft}px`;
                cursor.style.opacity = '1';
              }
            }
          }}
        >
          {/* Animated Background Cursor */}
          <motion.div
            className="nav-cursor absolute z-0 h-9 rounded-full bg-gray-100 dark:bg-gray-800"
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
                if (effectiveSelectedTopic !== topic.id) {
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
                className={`px-4 py-2 text-sm font-medium block whitespace-nowrap ${
                  effectiveSelectedTopic === topic.id
                    ? 'text-gray-800 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
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