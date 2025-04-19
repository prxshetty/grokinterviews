'use client';

import { useState, useEffect } from 'react';
import { toggleQuestionBookmark } from '@/app/utils/progress';

interface BookmarkButtonProps {
  questionId: number;
  initialIsBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({ 
  questionId, 
  initialIsBookmarked = false,
  onBookmarkChange 
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle bookmark toggle
  const handleToggleBookmark = async () => {
    setIsAnimating(true);
    
    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      // Call API to update bookmark status
      await toggleQuestionBookmark(questionId, newBookmarkState);
      
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
