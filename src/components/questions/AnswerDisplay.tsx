'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, AlertCircle, RotateCw, MessageSquare } from 'lucide-react';
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { CopyButton } from './CopyButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useIsTabletOrSmaller } from '@/hooks/ui';
import remarkGfm from 'remark-gfm';

// Default markdown components
const defaultMarkdownComponents = {
  // Add any default components here
};

// Code block component with copy functionality
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const copyToClipboard = useCallback(() => {
    if (codeRef.current) {
      navigator.clipboard.writeText(codeRef.current.textContent || '');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, []);

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  // Extract language for syntax highlighting (not currently used)
  /language-(\w+)/.exec(className || '');

  return (
    <div className="relative group my-4 not-prose">
      <pre className="p-4 rounded-lg overflow-auto bg-gray-100 dark:bg-gray-800">
        <button
          type="button"
          className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md flex items-center justify-center"
          onClick={copyToClipboard}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <code ref={codeRef} className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

type AnswerDisplayProps = {
  answerText: string | null;
  isLoading: boolean;
  error: string | null;
  isCompleted?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
  scrollProgress?: number;
};

export function AnswerDisplay({
  answerText,
  isLoading,
  error,
  isCompleted = false,
  onRetry = () => {},
  isRetrying = false,
  scrollProgress = 0,
}: AnswerDisplayProps) {
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  const [contentIsScrollable, setContentIsScrollable] = useState<boolean | null>(null);
  const isTabletOrSmaller = useIsTabletOrSmaller();

  // Debug logging for progress bar
  useEffect(() => {
    if (answerText && scrollProgress > 0) {
      console.log('AnswerDisplay - Progress bar data:', {
        scrollProgress,
        isCompleted,
        answerText: answerText ? 'present' : 'null',
        shouldShowProgress: !isCompleted && scrollProgress > 0 && scrollProgress < 90
      });
    }
  }, [scrollProgress, isCompleted, answerText]);

  useEffect(() => {
    if (answerText && scrollableContainerRef.current) {
      Promise.resolve().then(() => {
        if (scrollableContainerRef.current) {
          const isScrollable = scrollableContainerRef.current.scrollHeight > scrollableContainerRef.current.clientHeight;
          setContentIsScrollable(isScrollable);
        }
      });
    } else if (!answerText) {
      setContentIsScrollable(null);
    }
  }, [answerText]);

  useEffect(() => {
    if (isLoading) {
      if (contentIsScrollable !== null) {
        setContentIsScrollable(null);
      }
    } else {
      if (error) {
        // Toast notifications could be re-implemented here if needed
        // using a toast library like react-hot-toast or something similar
      } else if (answerText) {
        if (contentIsScrollable !== null) {
          if (contentIsScrollable === true) {
            if (isCompleted) {
              // Toast notifications could be re-implemented here if needed
              // using a toast library like react-hot-toast or something similar
            }
          } else {
            // Toast notifications could be re-implemented here if needed
            // using a toast library like react-hot-toast or something similar
          }
        }
      }
    }
  }, [isLoading, error, answerText, isCompleted, contentIsScrollable]);

  // Determine if progress bar should be shown
  const shouldShowProgress = !isCompleted && scrollProgress >= 0 && scrollProgress < 90;

  return (
    <div className="h-full overflow-y-auto">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner size="lg" text="Generating answer..." />
        </div>
      ) : error ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Failed to generate answer
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {typeof error === 'string' ? error : 'An unknown error occurred while generating the answer.'}
          </p>
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying || isLoading}
            className="mt-2"
          >
            {isRetrying || isLoading ? (
              <InlineLoadingSpinner size="sm" />
            ) : (
              <RotateCw className="mr-2 h-4 w-4" />
            )}
            {isRetrying || isLoading ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      ) : answerText ? (
        <div className="h-full flex flex-col relative">
          {/* Progress bar - desktop fixed at bottom, mobile handled in parent */}
          {shouldShowProgress && !isTabletOrSmaller && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Reading: {Math.round(scrollProgress)}%
                </span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                <div 
                  className="bg-blue-400 dark:bg-blue-500 h-1 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(scrollProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <CopyButton 
                textToCopy={answerText}
                className="h-8 w-8 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
              />
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none p-4 flex-1">
            <ReactMarkdown
              components={{
                ...defaultMarkdownComponents,
                code: CodeBlock,
                pre: ({ children }) => <>{children}</>, // Let CodeBlock handle the pre element
                a: (props) => (
                  <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  />
                ),
              }}
              remarkPlugins={[remarkGfm]}
            >
              {answerText}
            </ReactMarkdown>
          </div>
          
          {/* Add bottom padding when progress bar is visible at bottom (desktop only) */}
          {!isTabletOrSmaller && shouldShowProgress && (
            <div className="h-16" />
          )}
          
          {isCompleted && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-center space-x-2">
                <div className="text-green-500 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Question completed! ✨
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Answer generated by GrokInterviews AI
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <MessageSquare className="h-10 w-10 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No answer yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isCompleted 
              ? 'No answer was generated for this question.' 
              : 'Click the "Generate Answer" button to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}