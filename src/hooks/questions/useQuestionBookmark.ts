import { useState, useEffect, useCallback } from 'react';
import {
  isBookmarked as checkIsBookmarked,
  addBookmark,
  removeBookmark
} from '@/utils/bookmark-storage';

interface UseQuestionBookmarkProps {
  questionId: number;
  initialIsBookmarked?: boolean;
  onBookmarkStatusChange?: ((questionId: number, newStatus: boolean) => void) | undefined;
  topicId?: number;
  categoryId?: number;
}

interface UseQuestionBookmarkReturn {
  isBookmarked: boolean;
  setIsBookmarked: (bookmarked: boolean) => void;
  handleBookmarkChange: (newStatus: boolean) => void;
}

export function useQuestionBookmark({
  questionId,
  initialIsBookmarked,
  onBookmarkStatusChange,
  topicId,
  categoryId
}: UseQuestionBookmarkProps): UseQuestionBookmarkReturn {
  // Initialize from local storage, fallback to prop
  const [isBookmarked, setIsBookmarked] = useState(() => {
    if (typeof window === 'undefined') return initialIsBookmarked ?? false;
    return checkIsBookmarked(questionId);
  });

  // Sync with local storage on mount and when questionId changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsBookmarked(checkIsBookmarked(questionId));
    }
  }, [questionId]);

  const handleBookmarkChange = useCallback((newStatus: boolean) => {
    // Validate required IDs
    if (!topicId || !categoryId) {
      console.warn(`Cannot bookmark question ${questionId}: missing topicId or categoryId`);
      return;
    }

    // Update local storage
    if (newStatus) {
      addBookmark(topicId, categoryId, questionId);
    } else {
      removeBookmark(questionId);
    }

    // Update state
    setIsBookmarked(newStatus);

    // Notify parent if callback provided
    onBookmarkStatusChange?.(questionId, newStatus);
  }, [questionId, topicId, categoryId, onBookmarkStatusChange]);

  return {
    isBookmarked,
    setIsBookmarked,
    handleBookmarkChange
  };
}
