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
    if (!answerElement || !isExpanded || !hasAnswer) return;
    
    // Type assertion to handle null ref
    const element = answerElement as HTMLDivElement;

    const calculateScrollProgress = () => {
      if (!answerElement) return;
      
      const totalHeight = element.scrollHeight - element.clientHeight;
      let percentage: number;
      
      if (totalHeight <= 0) {
        // Content is shorter than or fits the container
        percentage = 100;
      } else {
        const scrollPosition = element.scrollTop;
        percentage = Math.min(Math.round((scrollPosition / totalHeight) * 100), 100);
      }
      
      setScrollProgress(percentage);

      // Mark as completed when 90% scrolled
      if (percentage >= 90 && !isCompleted && questionId) {
        setIsCompleted(true); // Optimistic UI update
        onCompletionChange?.(questionId, true, topicId, categoryId);
        toast.success("Question marked as completed!");

        markQuestionAsCompleted(questionId, topicId, categoryId, domain)
          .then((success) => {
            if (!success) {
              // Revert if backend update fails
              setIsCompleted(false);
              onCompletionChange?.(questionId, false, topicId, categoryId);
              toast.error("Failed to save completion status.");
            }
          })
          .catch(_err => {
            setIsCompleted(false); // Revert on error
            onCompletionChange?.(questionId, false, topicId, categoryId);
            toast.error("Error saving completion status.");
          });
      }
    };

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(calculateScrollProgress, 150);
    };
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    calculateScrollProgress(); // Initial check

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [isExpanded, hasAnswer, questionId, isCompleted, onCompletionChange, topicId, categoryId, domain, answerRef]);

  return {
    scrollProgress,
    isCompleted,
    setIsCompleted
  };
}
