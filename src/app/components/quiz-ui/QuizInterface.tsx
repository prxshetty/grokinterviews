'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye } from 'lucide-react';

interface QuestionType {
  id: number;
  category_id: number;
  question_text: string;
  answer_text?: string;
  keywords?: string[];
  difficulty?: string;
  created_at?: string;
  categories?: {
    id: number;
    name: string;
    topic_id: number;
    topics?: {
      id: number;
      name: string;
      domain: string;
    }
  };
}

interface QuizInterfaceProps {
  questions: QuestionType[];
  isLoading: boolean;
  onBackClick: () => void;
  topicName: string;
}

export default function QuizInterface({
  questions,
  isLoading,
  onBackClick,
  topicName
}: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when questions change
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setUserAnswers(Array(questions.length).fill(''));
    setShowAnswer(false);
    setGeneratedAnswer(null);
    setIsGenerating(false);
    setError(null);
  }, [questions]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setGeneratedAnswer(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswer(false);
      setGeneratedAnswer(null);
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = e.target.value;
    setUserAnswers(newAnswers);
  };

  const handleShowAnswer = async () => {
    if (showAnswer) {
      setShowAnswer(false);
      return;
    }

    // If we already have a generated answer, just show it
    if (generatedAnswer) {
      setShowAnswer(true);
      return;
    }

    // Otherwise, generate the answer
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQuestion.question_text,
          questionId: currentQuestion.id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate answer: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.message) {
        // This is a special case where the API returns a message instead of an answer
        // (e.g., when the user hasn't configured their API key)
        setError(data.message);
        setGeneratedAnswer(null);
      } else {
        setGeneratedAnswer(data.answer);
      }

      setShowAnswer(true);
    } catch (err) {
      console.error('Error generating answer:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate answer');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-4">No questions available for this topic</h2>
        <button
          onClick={onBackClick}
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBackClick}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold">{topicName} Quiz</h1>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700
              ${currentQuestionIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            Previous
          </button>
          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className={`px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700
              ${currentQuestionIndex === questions.length - 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 mr-2">
            {currentQuestion.difficulty || 'unspecified'} difficulty
          </span>
        </div>

        <h2 className="text-xl font-medium mb-4">{currentQuestion.question_text}</h2>

        <div className="mt-6">
          <label htmlFor="user-answer" className="block text-sm font-medium mb-2">
            Your Answer:
          </label>
          <textarea
            id="user-answer"
            rows={6}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white"
            placeholder="Type your answer here..."
            value={userAnswers[currentQuestionIndex]}
            onChange={handleAnswerChange}
          />
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleShowAnswer}
          className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white dark:border-black mr-2"></div>
              Generating...
            </>
          ) : showAnswer ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Hide Answer
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show Answer
            </>
          )}
        </button>
      </div>

      {showAnswer && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Correct Answer:</h3>

          {error ? (
            <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          ) : generatedAnswer ? (
            <div className="prose dark:prose-invert max-w-none">
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{
                  __html: generatedAnswer
                    // Process code blocks for better visibility
                    .replace(
                      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
                      '<pre class="language-$1"><code class="language-$1">$2</code></pre>'
                    )
                    // Remove Llama 4 <think> tags
                    .replace(/<think>[\s\S]*?<\/think>/g, '')
                }}
              />
            </div>
          ) : (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
