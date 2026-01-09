import { useState, useEffect, useRef, RefObject } from 'react';
import { toast } from '@/hooks/use-toast';
import { questionCache } from '@/utils/questionCache';

interface UseQuestionProgressProps {
  questionId: number;
  topicId: number | undefined;
  categoryId: number | undefined;
  domain: string | undefined;
  answerRef: RefObject<HTMLDivElement | null>;
  isExpanded: boolean;
  hasAnswer: boolean;
  onCompletionChange: ((questionId: number, isCompleted: boolean, topicId?: number, categoryId?: number) => void) | undefined;
  userId?: string | undefined;
}

interface UseQuestionProgressReturn {
  scrollProgress: number;
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
  toggleCompletion: () => void;
}

export function useQuestionProgress({
  questionId,
  topicId,
  categoryId,
  domain,
  answerRef,
  isExpanded,
  hasAnswer,
  onCompletionChange,
  userId
}: UseQuestionProgressProps): UseQuestionProgressReturn {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set user ID on questionCache and check if question is already completed on mount using cache
  useEffect(() => {
    questionCache.setUserId(userId);
    const isCompletedFromCache = questionCache.isQuestionCompleted(questionId);
    setIsCompleted(isCompletedFromCache);
  }, [questionId, userId]);

  useEffect(() => {
    const answerElement = answerRef.current;
    if (!answerElement || !isExpanded || !hasAnswer || isCompleted) return;

    // Find the scrollable container within the answer element
    // Try multiple selectors to find the scrollable container
    let scrollableContainer: HTMLElement | null = null;

    // First check if the answerElement itself is scrollable (mobile case)
    const computedStyle = window.getComputedStyle(answerElement);
    if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
      scrollableContainer = answerElement;
    }

    // If not found, try to find by class (desktop case)
    if (!scrollableContainer) {
      scrollableContainer = answerElement.querySelector('.h-full.overflow-y-auto') as HTMLElement;
    }

    // If still not found, try to find any scrollable element
    if (!scrollableContainer) {
      scrollableContainer = answerElement.querySelector('[style*="overflow-y: auto"]') as HTMLElement;
    }

    if (!scrollableContainer) {
      console.warn('Scrollable container not found in answer element');
      console.log('Answer element structure:', answerElement);
      console.log('Answer element classes:', answerElement.className);
      console.log('Answer element computed style:', {
        overflowY: computedStyle.overflowY,
        height: computedStyle.height,
        maxHeight: computedStyle.maxHeight
      });
      return;
    }

    const calculateScrollProgress = () => {
      if (!scrollableContainer) return;

      const totalHeight = scrollableContainer.scrollHeight - scrollableContainer.clientHeight;
      let percentage: number;

      if (totalHeight <= 0) {
        // Content is shorter than or fits the container - mark as completed immediately
        percentage = 100;
      } else {
        const scrollPosition = scrollableContainer.scrollTop;
        percentage = Math.min(Math.round((scrollPosition / totalHeight) * 100), 100);
      }

      setScrollProgress(percentage);

      // Mark as completed when 90% scrolled and not already completed
      if (percentage >= 90 && !isCompleted && questionId) {
        console.log(`Question ${questionId} reached ${percentage}% scroll, marking as completed`);
        console.log('Completion details:', { questionId, topicId, categoryId, domain });
        setIsCompleted(true); // Optimistic UI update

        // Store completion in cache
        questionCache.markQuestionCompleted(questionId, topicId, categoryId);

        onCompletionChange?.(questionId, true, topicId, categoryId);
        toast.success("Question Completed! Your progress has been saved locally.");

        console.log(`Question ${questionId} marked as completed and stored in cache`);
      }
    };

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(calculateScrollProgress, 100); // Reduced debounce time for better responsiveness
    };

    scrollableContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check after a short delay to ensure content is rendered
    const initialCheckTimeout = setTimeout(calculateScrollProgress, 200);

    return () => {
      scrollableContainer?.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      clearTimeout(initialCheckTimeout);
    };
  }, [isExpanded, hasAnswer, questionId, isCompleted, onCompletionChange, topicId, categoryId, domain, answerRef]);

  const toggleCompletion = () => {
    const newCompletedState = !isCompleted;
    setIsCompleted(newCompletedState);

    if (newCompletedState) {
      questionCache.markQuestionCompleted(questionId, topicId, categoryId);
      toast.success("Question Completed! Your progress has been saved locally.");
    } else {
      questionCache.markQuestionIncomplete(questionId);
      toast.info("Question marked as incomplete. Progress updated locally.");
    }

    onCompletionChange?.(questionId, newCompletedState, topicId, categoryId);
  };

  return {
    scrollProgress,
    isCompleted,
    setIsCompleted,
    toggleCompletion
  };
}
