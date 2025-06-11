'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// A new skeleton component for the loading state.
function AnswerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  );
}

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
  isCompleted,
  setAnswerRef,
}: AnswerDisplayProps) {
  const toastId = useRef<string | number | undefined>(undefined);
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
      if (!toastId.current) {
        toastId.current = toast.loading('Generating answer...');
      }
      if (contentIsScrollable !== null) {
        setContentIsScrollable(null);
      }
    } else {
      const activeToast = toastId.current;
      if (activeToast) {
        toast.dismiss(activeToast);
        toastId.current = undefined;
      }

      if (error) {
        toast.error('Error Generating Answer', { description: error });
      } else if (answerText) {
        if (contentIsScrollable !== null) {
          if (contentIsScrollable === true) {
            if (isCompleted) {
              toast.success('Answer reading completed!', { duration: 3000 });
            }
          } else {
            toast.success('Answer reading completed!', { duration: 3000 });
          }
        }
      }
    }
  }, [isLoading, error, answerText, isCompleted, contentIsScrollable]);

  const scrollbarStyles = {
    '--scrollbar-track-color': '#f1f1f1',
    '--scrollbar-thumb-color': '#c1c1c1',
  } as React.CSSProperties;
  
  const darkScrollbarStyles = {
    '--scrollbar-track-color': '#2d3748',
    '--scrollbar-thumb-color': '#4a5568',
  } as React.CSSProperties;

  return (
    <div className="relative">
      <div
        ref={(el) => {
          scrollableContainerRef.current = el;
          if (setAnswerRef) setAnswerRef(el);
        }}
        className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none h-[600px] overflow-y-auto pr-4 text-base leading-relaxed scrollbar-thin"
        style={scrollbarStyles}
      >
        <style>
          {`
            .scrollbar-thin {
              scrollbar-width: thin;
              scrollbar-color: var(--scrollbar-thumb-color) var(--scrollbar-track-color);
            }
            .dark .scrollbar-thin {
              --scrollbar-track-color: #2d3748;
              --scrollbar-thumb-color: #4a5568;
            }
            .scrollbar-thin::-webkit-scrollbar {
              width: 8px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: var(--scrollbar-track-color);
              border-radius: 10px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background-color: var(--scrollbar-thumb-color);
              border-radius: 10px;
              border: 2px solid var(--scrollbar-track-color);
            }
          `}
        </style>
        {isLoading ? (
          <AnswerSkeleton />
        ) : error ? (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600/50">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Error Generating Answer</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
        ) : answerText ? (
          <div className="markdown-content">
            <ReactMarkdown>{answerText}</ReactMarkdown>
          </div>
        ) : (
          <p className="italic text-gray-500">The answer will appear here once generated.</p>
        )}
      </div>
    </div>
  );
} 