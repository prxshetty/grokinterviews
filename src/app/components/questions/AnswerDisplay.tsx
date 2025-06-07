'use client';

import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AnswerDisplayProps {
  answerText: string | null;
  isLoading: boolean;
  error: string | null;
  scrollProgress: number;
  isCompleted: boolean;
  setAnswerRef: (el: HTMLDivElement | null) => void;
}

export function AnswerDisplay({
  answerText,
  isLoading,
  error,
  scrollProgress,
  isCompleted,
  setAnswerRef,
}: AnswerDisplayProps) {

  // Effect to potentially handle focus or initial scroll position if needed
  useEffect(() => {
    // You could add logic here if you want something to happen when the answer appears
  }, [answerText, isLoading, error]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer:</h5>
      <div
        ref={setAnswerRef} // Attach the ref passed from the parent
        className="text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none h-[600px] overflow-y-auto pr-2 text-base mb-4"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <LoadingSpinner size="sm" color="muted" centered={false} />
            <span>Generating answer...</span>
          </div>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        ) : answerText ? (
          <div className="markdown-content">
            <ReactMarkdown>{answerText}</ReactMarkdown>
          </div>
        ) : (
          <p className="italic text-gray-500">No answer available or failed to load.</p>
        )}
      </div>

      {/* Progress indicator - only show if not loading and answer exists */}
      {!isLoading && answerText && (
        <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Read progress</span>
            <span>{scrollProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
            <div
              className="bg-green-500 h-1 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${scrollProgress}%` }}
            ></div>
          </div>
          {scrollProgress >= 90 && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {isCompleted ? 'Marked as completed' : 'Almost done! Keep scrolling to mark as completed'}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 