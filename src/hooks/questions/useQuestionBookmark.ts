import { useState, useEffect } from 'react';

interface UseQuestionBookmarkProps {
  questionId: number;
  initialIsBookmarked: boolean;
  onBookmarkStatusChange: ((questionId: number, newStatus: boolean) => void) | undefined;
}

interface UseQuestionBookmarkReturn {
  isBookmarked: boolean;
  setIsBookmarked: (bookmarked: boolean) => void;
  handleBookmarkChange: (newStatus: boolean) => void;
}

export function useQuestionBookmark({
  questionId,
  initialIsBookmarked,
  onBookmarkStatusChange
}: UseQuestionBookmarkProps): UseQuestionBookmarkReturn {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

  // Sync with prop changes
  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
  }, [initialIsBookmarked]);

  const handleBookmarkChange = (newStatus: boolean) => {
    setIsBookmarked(newStatus);
    onBookmarkStatusChange?.(questionId, newStatus);
  };

  return {
    isBookmarked,
    setIsBookmarked,
    handleBookmarkChange
  };
}
