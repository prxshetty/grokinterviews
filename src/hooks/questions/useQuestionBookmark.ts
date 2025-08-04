import { useState, useEffect } from 'react';
import { toggleQuestionBookmark } from '@/app/utils/progress';

interface UseQuestionBookmarkProps {
  questionId: number;
  initialIsBookmarked: boolean;
  onBookmarkStatusChange: ((questionId: number, newStatus: boolean) => void) | undefined;
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
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

  // Sync with prop changes
  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
  }, [initialIsBookmarked]);

  const handleBookmarkChange = async (newStatus: boolean) => {
    // Optimistic update
    setIsBookmarked(newStatus);
    onBookmarkStatusChange?.(questionId, newStatus);

    // Persist to database if we have the required IDs
    if (topicId && categoryId) {
      try {
        await toggleQuestionBookmark(questionId, newStatus, topicId, categoryId);
      } catch (error) {
        console.error('Failed to persist bookmark change:', error);
        // Revert optimistic update on error
        setIsBookmarked(!newStatus);
        onBookmarkStatusChange?.(questionId, !newStatus);
      }
    }
  };

  return {
    isBookmarked,
    setIsBookmarked,
    handleBookmarkChange
  };
}
