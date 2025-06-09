'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MessageLoading } from './message-loading';

/**
 * Unified Loading Spinner System for GrokInterviews
 * 
 * This component provides a consistent loading experience across the entire application.
 * Updated to use the new MessageLoading animated SVG component.
 * 
 * @example
 * // Basic usage
 * <LoadingSpinner />
 * 
 * @example
 * // Full-screen loading for page transitions
 * <LoadingSpinner size="xl" color="primary" text="Loading..." fullScreen={true} />
 * 
 * @example
 * // Inline loading for buttons
 * <LoadingSpinner size="sm" color="muted" centered={false} />
 */
interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color theme of the spinner */
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  /** Optional text to display below the spinner */
  text?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to center the spinner in its container */
  centered?: boolean;
  /** Whether to render as a full-screen overlay */
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-purple-600 dark:text-purple-400',
  secondary: 'text-gray-600 dark:text-gray-400', 
  accent: 'text-orange-500 dark:text-orange-400',
  muted: 'text-gray-400 dark:text-gray-500'
};

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text,
  className = '',
  centered = true,
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn(
      sizeClasses[size],
      colorClasses[color],
      className
    )}>
      <MessageLoading />
    </div>
  );

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center',
      text && 'space-y-3'
    )}>
      {spinner}
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center p-8">
        {content}
      </div>
    );
  }

  return content;
}

// Specialized loading components for common use cases
export function PageLoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <LoadingSpinner 
      size="lg" 
      color="primary" 
      text={text}
      centered={true}
      className="min-h-[300px]"
    />
  );
}

export function InlineLoadingSpinner({ text, size = 'sm' }: { text?: string; size?: 'sm' | 'md' }) {
  return (
    <LoadingSpinner 
      size={size}
      color="muted" 
      text={text}
      centered={false}
    />
  );
}

export function ButtonLoadingSpinner() {
  return (
    <LoadingSpinner 
      size="sm"
      color="primary" 
      centered={false}
      className="text-current"
    />
  );
} 