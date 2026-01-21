import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { getAIConfig, getAnswerDepth, getIncludeCode } from '@/utils/ai-config-storage';

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

    const aiConfig = getAIConfig();
    if (!aiConfig) {
      setError('Please configure your AI provider and API key in Account Settings');
      toast.error('AI not configured. Go to Account > AI Settings to set up your API key.');
      return;
    }

    generationAttemptedRef.current = true;
    setIsGenerating(true);
    setError(null);

    try {
      const preferences = {
        preferred_answer_depth: getAnswerDepth(),
        include_code_snippets: getIncludeCode(),
      };

      const response = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          questionId,
          topicId,
          categoryId,
          apiKey: aiConfig.apiKey,
          provider: aiConfig.provider,
          modelId: aiConfig.modelId,
          preferences,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error(`API error for question ${questionId}:`, errorData);

        if (errorData.requires_ai_config) {
          setError('Please configure your AI provider and API key in Account Settings');
          toast.error('AI not configured. Go to Account > AI Settings.');
        } else if (errorData.type === 'auth_error') {
          setError('Invalid API key. Please check your API key in Account Settings.');
          toast.error('Invalid API key. Please update it in Account Settings.');
        } else {
          throw new Error(errorData.error || response.statusText);
        }
        return;
      }

      if (!response.body) {
        throw new Error('Response body is unavailable for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answerText = '';
      setGeneratedAnswer('');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk.includes('__ERROR__')) {
          const errorMatch = chunk.match(/__ERROR__(.+?)__ERROR__/);
          if (errorMatch && errorMatch[1]) {
            try {
              const errorData = JSON.parse(errorMatch[1]);
              setError(errorData.error || 'An error occurred while generating the answer.');

              if (errorData.type === 'auth_error') {
                toast.error('Invalid API key. Please update it in Account Settings.');
              } else if (errorData.type === 'rate_limit') {
                toast.error('Rate limit exceeded. Please wait a moment and try again.');
              } else if (errorData.type === 'model_error') {
                toast.error('Model not available. Please select a different model.');
              } else {
                toast.error(errorData.error || 'An error occurred while generating the answer.');
              }

              setGeneratedAnswer(null);
              generationAttemptedRef.current = false;
              return;
            } catch {
              setError('An error occurred while generating the answer.');
              toast.error('An error occurred while generating the answer.');
              setGeneratedAnswer(null);
              generationAttemptedRef.current = false;
              return;
            }
          }
        }

        answerText += chunk;
        setGeneratedAnswer(answerText);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate answer due to an unexpected error.';
      console.error(`Generation error for question ${questionId}:`, errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
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
