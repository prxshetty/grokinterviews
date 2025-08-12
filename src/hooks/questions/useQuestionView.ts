import { useState, useEffect, useRef } from 'react';
// Removed markQuestionAsViewed import as progress tracking is disabled

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

  // Mark question as viewed when opened (progress tracking disabled)
  useEffect(() => {
    if (isOpen && !isViewed && !viewedAttemptedRef.current) {
      viewedAttemptedRef.current = true;
      // Progress tracking disabled - just mark as viewed locally
      setIsViewed(true);
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
