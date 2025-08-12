import { useState, useEffect } from 'react';
// Removed toggleQuestionBookmark import as progress tracking is disabled

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
  topicId: _topicId,
  categoryId: _categoryId
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

    // Make API call to persist bookmark status
    if (_topicId && _categoryId) {
      try {
        const response = await fetch('/api/user/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId,
            isBookmarked: newStatus,
            topicId: _topicId,
            categoryId: _categoryId,
          }),
        });

        if (!response.ok) {
          // Revert optimistic update on failure
          setIsBookmarked(!newStatus);
          onBookmarkStatusChange?.(questionId, !newStatus);
          console.error('Failed to update bookmark status');
        }
      } catch (error) {
        // Revert optimistic update on error
        setIsBookmarked(!newStatus);
        onBookmarkStatusChange?.(questionId, !newStatus);
        console.error('Error updating bookmark status:', error);
      }
    } else {
      console.log(`Question ${questionId} bookmark status changed to ${newStatus} (local only - missing topicId or categoryId)`);
    }
  };

  return {
    isBookmarked,
    setIsBookmarked,
    handleBookmarkChange
  };
}
