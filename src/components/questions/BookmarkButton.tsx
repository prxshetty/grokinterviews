'use client';

import { useState, useEffect } from 'react';
import { toggleQuestionBookmark } from '@/app/utils/progress';

interface BookmarkButtonProps {
  questionId: number;
  topicId: number | null;
  categoryId: number;
  initialIsBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({ 
  questionId, 
  topicId,
  categoryId,
  initialIsBookmarked = false,
  onBookmarkChange 
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper function to get topicId from categoryId if needed
  const getTopicId = async (): Promise<number | null> => {
    if (topicId) return topicId;
    
    try {
      const response = await fetch('/api/topics/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.categories && Array.isArray(data.categories)) {
          const category = data.categories.find((cat: { id: number; topic_id: number }) => cat.id === categoryId);
          if (category && category.topic_id) {
            return category.topic_id;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch topic ID from category:', error);
    }
    
    return null;
  };

  // Handle bookmark toggle
  const handleToggleBookmark = async () => {
    setIsAnimating(true);
    
    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      // Get topicId if it's missing
      const actualTopicId = await getTopicId();
      
      if (!actualTopicId) {
        throw new Error('Could not determine topic ID for bookmarking');
      }
      
      // Call API to update bookmark status, passing topicId and categoryId
      await toggleQuestionBookmark(questionId, newBookmarkState, actualTopicId, categoryId);
      
      // Notify parent component if callback provided
      if (onBookmarkChange) {
        onBookmarkChange(newBookmarkState);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert state on error
      setIsBookmarked(isBookmarked);
    } finally {
      // End animation after a short delay
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering parent click events
        handleToggleBookmark();
      }}
      className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-transform ${
        isAnimating ? 'scale-125' : 'scale-100'
      }`}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {isBookmarked ? (
        // Filled bookmark icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ) : (
        // Outline bookmark icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  );
}
