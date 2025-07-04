'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
// Remove unused import
import { Copy, Check, AlertCircle, Loader2, RotateCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from './CopyButton';
// Remove unused import
// Theme functionality not currently used
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
    return <code className={className} {...props} />;
  }

  // Extract language for syntax highlighting (not currently used)
  /language-(\w+)/.exec(className || '');

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copyToClipboard}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="p-4 rounded-lg overflow-auto bg-gray-100 dark:bg-gray-800">
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
  // _scrollProgress is not currently used but kept for future implementation
  // _scrollProgress?: number;
};

// Loading spinner component
const InlineLoadingSpinner = ({ size = 'md', text = 'Loading...' }: { size?: 'sm' | 'md' | 'lg'; text?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
};

export function AnswerDisplay({
  answerText,
  isLoading,
  error,
  isCompleted = false,
  onRetry = () => {},
  isRetrying = false,
}: AnswerDisplayProps) {
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  const [contentIsScrollable, setContentIsScrollable] = useState<boolean | null>(null);

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



  return (
    <div className="h-full overflow-y-auto">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <InlineLoadingSpinner size="lg" text="Generating answer..." />
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="mr-2 h-4 w-4" />
            )}
            {isRetrying || isLoading ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      ) : answerText ? (
        <div className="h-full flex flex-col">
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
                pre: ({ children }) => <>{children}</>, // Prevent default pre styling
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
          
          {isCompleted && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
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