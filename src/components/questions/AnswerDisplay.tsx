'use client';

import { useCallback, useEffect, useRef, useState, Children, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, AlertCircle, RotateCw, MessageSquare } from 'lucide-react';
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useIsTabletOrSmaller } from '@/hooks/ui';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

// Default markdown components
const defaultMarkdownComponents = {
  // Add any default components here
};

// Code block memoized
import { memo } from 'react';

const CodeBlock = memo(function CodeBlock({ inline, className, children, ...props }: any) {
  const codeRef = useRef<HTMLElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    if (codeRef.current) {
      navigator.clipboard.writeText(codeRef.current.textContent || '');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, []);

  // Detects here if this is inline code:
  // - Block code - language-* class or is inside <pre>
  // - Inline code - no language class, single-line content
  const isBlockCode = className?.includes('language-') ||
    (typeof children === 'string' && children.includes('\n')) ||
    inline === false;

  const isInlineCode = inline === true || (!isBlockCode && !className);

  if (isInlineCode) {
    return (
      <code
        className="px-1.5 py-0.5 mx-0.5 text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded whitespace-nowrap"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Extract language for syntax highlighting
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase tracking-wider select-none">
          {language || 'Code'}
        </span>
        <button
          type="button"
          className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center justify-center rounded"
          onClick={copyToClipboard}
          title="Copy code"
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto bg-gray-50 dark:bg-gray-900 text-sm">
        <code ref={codeRef} className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.children === nextProps.children && prevProps.className === nextProps.className;
});


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
  onRetry = () => { },
  isRetrying = false,
  scrollProgress = 0,
}: AnswerDisplayProps) {
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  const [contentIsScrollable, setContentIsScrollable] = useState<boolean | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const isTabletOrSmaller = useIsTabletOrSmaller();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);



  useEffect(() => {
    if (!isHydrated) return;

    if (answerText && scrollableContainerRef.current) {
      const checkScrollable = () => {
        if (scrollableContainerRef.current) {
          const isScrollable = scrollableContainerRef.current.scrollHeight > scrollableContainerRef.current.clientHeight;
          setContentIsScrollable(isScrollable);
        }
      };

      // Use requestAnimationFrame to ensure DOM is ready
      const rafId = requestAnimationFrame(checkScrollable);
      return () => cancelAnimationFrame(rafId);
    } else if (!answerText) {
      setContentIsScrollable(null);
    }

    // Explicit return for TypeScript
    return;
  }, [answerText, isHydrated]);

  useEffect(() => {
    if (isLoading) {
      if (contentIsScrollable !== null) {
        setContentIsScrollable(null);
      }
    } else if (answerText) {
      if (contentIsScrollable !== null) {
        // No action needed for scrollable state changes
      }
    }
  }, [isLoading, error, answerText, isCompleted, contentIsScrollable]);

  // Determine if progress bar should be shown (only after hydration)
  const shouldShowProgress = isHydrated && !isCompleted && scrollProgress >= 0 && scrollProgress < 90;

  return (
    <div className="h-full overflow-y-auto">
      {error ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Failed to generate answer
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {typeof error === 'string' ? error : 'An unknown error occurred while generating the answer.'}
          </p>
          <div className="flex flex-col gap-2 w-full max-w-xs items-center">
            {(error?.toLowerCase().includes('configure') || error?.toLowerCase().includes('api key') || error?.toLowerCase().includes('auth')) ? (
              <Link href="/account?tab=ai-settings" className="w-full">
                <Button variant="default" className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                  Configure AI Settings
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying || isLoading}
                className="w-full"
              >
                {isRetrying || isLoading ? (
                  <InlineLoadingSpinner size="sm" />
                ) : (
                  <RotateCw className="mr-2 h-4 w-4" />
                )}
                {isRetrying || isLoading ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>
        </div>
      ) : answerText || isLoading ? (
        <div className="h-full flex flex-col relative">
          {/* Progress bar - desktop fixed at bottom, mobile handled in parent */}
          {shouldShowProgress && isHydrated && !isTabletOrSmaller && (
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

          <div className="max-w-none p-4 flex-1 text-sm text-gray-800 dark:text-gray-200 select-text">
            <ReactMarkdown
              components={{
                ...defaultMarkdownComponents,
                h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                h2: (props) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                h3: (props) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                h4: (props) => <h4 className="font-bold mt-3 mb-1" {...props} />,
                h5: (props) => <h5 className="font-bold mt-2" {...props} />,
                h6: (props) => <h6 className="font-bold mt-1" {...props} />,
                code: CodeBlock,
                pre: ({ children }) => <>{children}</>,
                table: (props) => (
                  <div className="overflow-x-auto my-4 border rounded-lg border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left border-collapse" {...props} />
                  </div>
                ),
                thead: (props) => <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300" {...props} />,
                tbody: (props) => <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
                tr: (props) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props} />,
                th: (props) => (
                  <th className="px-6 py-3 font-semibold border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />
                ),
                td: (props) => (
                  <td className="px-6 py-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />
                ),
                p: ({ children, ...props }) => {
                  const hasBlockElement = Children.toArray(children).some(
                    (child) => {
                      if (isValidElement(child)) {
                        if (child.type === 'div' || child.type === 'pre') return true;
                        if (typeof child.type === 'function' && child.type === CodeBlock) return true;
                        if (child.type === 'code' && child.props && !(child.props as any).inline) return true;
                      }
                      return false;
                    }
                  );

                  if (hasBlockElement) {
                    return <div {...props}>{children}</div>;
                  }

                  return <p className="mb-4" {...props}>{children}</p>;
                },
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
              {answerText || ''}
            </ReactMarkdown>

            {/* ChatGPT-style streaming cursor */}
            {isLoading && (
              <span className="inline-block w-2 h-2 ml-0.5 rounded-full bg-gray-600 dark:bg-gray-300 animate-pulse" style={{ verticalAlign: 'middle' }} />
            )}
          </div>

          {/* Add bottom padding when progress bar is visible at bottom (desktop only) */}
          {isHydrated && !isTabletOrSmaller && shouldShowProgress && (
            <div className="h-16" />
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