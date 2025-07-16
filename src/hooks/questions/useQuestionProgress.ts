import { useState, useEffect, useRef, RefObject } from 'react';
import { markQuestionAsCompleted, isQuestionCompleted } from '@/app/utils/progress';
import { toast } from '@/hooks/use-toast';

interface UseQuestionProgressProps {
  questionId: number;
  topicId: number | undefined;
  categoryId: number | undefined;
  domain: string | undefined;
  answerRef: RefObject<HTMLDivElement | null>;
  isExpanded: boolean;
  hasAnswer: boolean;
  onCompletionChange: ((questionId: number, isCompleted: boolean, topicId?: number, categoryId?: number) => void) | undefined;
}

interface UseQuestionProgressReturn {
  scrollProgress: number;
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
}

export function useQuestionProgress({
  questionId,
  topicId,
  categoryId,
  domain,
  answerRef,
  isExpanded,
  hasAnswer,
  onCompletionChange
}: UseQuestionProgressProps): UseQuestionProgressReturn {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if question is already completed on mount
  useEffect(() => {
    const checkCompletionStatus = async () => {
      try {
        const completed = await isQuestionCompleted(questionId);
        if (completed) {
          setIsCompleted(true);
          onCompletionChange?.(questionId, true, topicId, categoryId);
        }
      } catch (error) {
        console.error('Error checking completion status:', error);
      }
    };

    if (questionId) {
      checkCompletionStatus();
    }
  }, [questionId, onCompletionChange, topicId, categoryId]);

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
        setIsCompleted(true); // Optimistic UI update
        onCompletionChange?.(questionId, true, topicId, categoryId);
        toast.success("Question marked as completed!");

        markQuestionAsCompleted(questionId, topicId, categoryId, domain)
          .then((success) => {
            if (!success) {
              // Revert if backend update fails
              console.error(`Failed to save completion status for question ${questionId}`);
              setIsCompleted(false);
              onCompletionChange?.(questionId, false, topicId, categoryId);
              toast.error("Failed to save completion status.");
            } else {
              console.log(`Successfully marked question ${questionId} as completed`);
            }
          })
          .catch((err) => {
            console.error(`Error saving completion status for question ${questionId}:`, err);
            setIsCompleted(false); // Revert on error
            onCompletionChange?.(questionId, false, topicId, categoryId);
            toast.error("Error saving completion status.");
          });
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

  return {
    scrollProgress,
    isCompleted,
    setIsCompleted
  };
}
