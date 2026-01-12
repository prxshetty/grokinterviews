'use client';


import { cn } from '@/lib/utils';

/**
 * Unified Loading Spinner System for GrokInterviews
 * 
 * This component provides a consistent loading experience across the entire application.
 * Updated to use the new luma-spin animated component.
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

// Size mappings for the luma-spin component
const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
};

const colorClasses = {
  primary: 'shadow-gray-800 dark:shadow-gray-100',
  secondary: 'shadow-gray-700 dark:shadow-gray-200',
  accent: 'shadow-blue-600 dark:shadow-blue-400',
  muted: 'shadow-gray-600 dark:shadow-gray-300'
};

function LumaSpinner({ size = 'md', color = 'primary', className }: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  className?: string;
}) {
  return (
    <div className={cn('relative aspect-square', sizeClasses[size], className)}>
      <span className={cn(
        'absolute rounded-[50px] animate-loaderAnim shadow-[inset_0_0_0_3px]',
        colorClasses[color]
      )} />
      <span className={cn(
        'absolute rounded-[50px] animate-loaderAnim animation-delay shadow-[inset_0_0_0_3px]',
        colorClasses[color]
      )} />
      <style jsx>{`
        @keyframes loaderAnim {
          0% {
            inset: 0 35px 35px 0;
          }
          12.5% {
            inset: 0 35px 0 0;
          }
          25% {
            inset: 35px 35px 0 0;
          }
          37.5% {
            inset: 35px 0 0 0;
          }
          50% {
            inset: 35px 0 0 35px;
          }
          62.5% {
            inset: 0 0 0 35px;
          }
          75% {
            inset: 0 0 35px 35px;
          }
          87.5% {
            inset: 0 0 35px 0;
          }
          100% {
            inset: 0 35px 35px 0;
          }
        }
        .animate-loaderAnim {
          animation: loaderAnim 2.5s infinite;
        }
        .animation-delay {
          animation-delay: -1.25s;
        }
      `}</style>
    </div>
  );
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text,
  className = '',
  centered = true,
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <LumaSpinner
      size={size}
      color={color}
      className={className}
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