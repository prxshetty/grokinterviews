'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import UniqueLoading from './morph-loading';

/**
 * Unified Loading Spinner System for GrokInterviews
 * 
 * This component provides a consistent loading experience across the entire application.
 * Updated to use the new morph-loading animated component.
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

// Map LoadingSpinner sizes to UniqueLoading sizes
const sizeMapping = {
  sm: 'sm' as const,
  md: 'sm' as const, 
  lg: 'md' as const,
  xl: 'lg' as const
};

const colorClasses = {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-900 dark:text-white', 
  accent: 'text-gray-900 dark:text-white',
  muted: 'text-gray-700 dark:text-white/80'
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
    <UniqueLoading 
      variant="morph" 
      size={sizeMapping[size]}
      className={cn(colorClasses[color], className)}
    />
  );

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
    )}>
      {spinner}
      {text && (
        <p className="text-sm tracking-widest text-gray-600 dark:text-gray-400 animate-pulse">
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
      <div className="flex items-center justify-center min-h-[50vh]">
        {content}
      </div>
    );
  }

  return content;
}

// Specialized loading components for common use cases
export function InlineLoadingSpinner({ text, size = 'sm' }: { text?: string; size?: 'sm' | 'md' }) {
  const spinnerProps: LoadingSpinnerProps = {
    size: size,
    color: "muted",
    centered: false,
  };

  if (text !== undefined) {
    spinnerProps.text = text;
  }

  return (
    <LoadingSpinner {...spinnerProps} />
  );
}