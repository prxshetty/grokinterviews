import { useState, useEffect, useRef } from 'react';
import { markQuestionAsViewed } from '@/app/utils/progress';

interface UseQuestionViewProps {
  questionId: number;
  topicId: number | undefined;
  categoryId: number | undefined;
  domain: string | undefined;
  isOpen: boolean | undefined;
}

interface UseQuestionViewReturn {
  isViewed: boolean;
  setIsViewed: (viewed: boolean) => void;
}

export function useQuestionView({
  questionId,
  topicId,
  categoryId,
  domain,
  isOpen
}: UseQuestionViewProps): UseQuestionViewReturn {
  const [isViewed, setIsViewed] = useState(false);
  const viewedAttemptedRef = useRef<boolean>(false);

  // Mark question as viewed when opened
  useEffect(() => {
    if (isOpen && !isViewed && !viewedAttemptedRef.current) {
      viewedAttemptedRef.current = true;
      setIsViewed(true);
      
      // Mark as viewed in backend
      markQuestionAsViewed(questionId, topicId, categoryId, domain)
        .catch(err => {
          console.error('Failed to mark question as viewed:', err);
          // Don't revert isViewed state as this is not critical
        });
    }
  }, [isOpen, isViewed, questionId, topicId, categoryId, domain]);

  // Reset view state when question changes
  useEffect(() => {
    setIsViewed(false);
    viewedAttemptedRef.current = false;
  }, [questionId]);

  return {
    isViewed,
    setIsViewed
  };
}
