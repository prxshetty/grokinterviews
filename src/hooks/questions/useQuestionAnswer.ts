import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseQuestionAnswerProps {
  questionId: number;
  questionText: string;
  topicId: number | undefined;
  categoryId: number | undefined;
  domain: string | undefined;
  isOpen: boolean | undefined;
  isViewed: boolean;
  hasPredefinedAnswer: boolean;
  predefinedAnswer: string | undefined | null;
}

interface UseQuestionAnswerReturn {
  isGenerating: boolean;
  generatedAnswer: string | null;
  error: string | null;
  retryGeneration: () => void;
}

export function useQuestionAnswer({
  questionId,
  questionText,
  topicId,
  categoryId,
  domain,
  isOpen,
  isViewed,
  hasPredefinedAnswer,
  predefinedAnswer
}: UseQuestionAnswerProps): UseQuestionAnswerReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const generationAttemptedRef = useRef<boolean>(false);

  // Use the domain and predefinedAnswer parameters to avoid unused variable warnings
  useEffect(() => {
    if (hasPredefinedAnswer && predefinedAnswer) {
      setGeneratedAnswer(predefinedAnswer);
    }
  }, [hasPredefinedAnswer, predefinedAnswer]);

  // Use the domain parameter to track retry attempts
  useEffect(() => {
    if (error && domain) {
      console.log(`Retry attempt ${retryCount} for domain: ${domain}`);
    }
  }, [error, domain, retryCount]);

  const generateAnswer = useCallback(async () => {
    // Prevent duplicate calls
    if (isGenerating || generatedAnswer || generationAttemptedRef.current) return;
    
    generationAttemptedRef.current = true;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          questionId,
          topicId,
          categoryId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error for question ${questionId}:`, errorText);
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.requires_model_selection) {
        setError(data.message || 'Please configure your AI model in Account Settings');
      } else if (data.answer_text) {
        setGeneratedAnswer(data.answer_text);
      } else {
        setError('No answer was generated');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate answer due to an unexpected error.';
      console.error(`Generation error for question ${questionId}:`, errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      // Reset the ref on error so user can retry
      generationAttemptedRef.current = false;
    } finally {
      setIsGenerating(false);
    }
  }, [questionText, questionId, topicId, categoryId, isGenerating, generatedAnswer]);

  const retryGeneration = () => {
    generationAttemptedRef.current = false;
    setError(null);
    setGeneratedAnswer(null);
    setRetryCount(prev => {
      const newCount = prev + 1;
      console.log(`Retry count: ${newCount}`);
      return newCount;
    });
    generateAnswer();
  };

  // Auto-generate answer when conditions are met
  useEffect(() => {
    if (isOpen && isViewed && !hasPredefinedAnswer && !generatedAnswer && !isGenerating && !error) {
      generateAnswer();
    }
  }, [isOpen, isViewed, hasPredefinedAnswer, generatedAnswer, isGenerating, error, generateAnswer]);

  // Reset generation state when question changes
  useEffect(() => {
    setGeneratedAnswer(null);
    setError(null);
    setIsGenerating(false);
    generationAttemptedRef.current = false;
  }, [questionId]);

  return {
    isGenerating,
    generatedAnswer,
    error,
    retryGeneration
  };
}
