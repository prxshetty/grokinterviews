"use client"

import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Update props to extend standard button attributes
interface DemoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  buttonText: string;
  loadingText?: string;
  isLoading?: boolean; // Add back isLoading to allow parent control
}

export function DemoButton({
  buttonText,
  loadingText = "Processing...",
  className,
  children,
  onClick, // Use standard onClick
  disabled,
  ...props // Pass rest of the props down
}: DemoButtonProps) {
  // Internal loading state
  const [internalLoading, setInternalLoading] = useState(false);

  // Determine final loading state
  const isLoading = props.isLoading ?? internalLoading;

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      setInternalLoading(true);
      try {
        // Call the original onClick handler passed in props
        const result = onClick(event);
        // If the onClick handler returned a promise, await it
        if (result !== undefined && typeof (result as any).then === 'function') {
          await result;
        }
      } catch (error) {
        console.error("Error during button click action:", error);
        // Optionally handle error state here
      } finally {
        setInternalLoading(false);
      }
    } else {
      // Handle cases where no onClick is provided, if necessary
      console.warn("DemoButton clicked without an onClick handler.");
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900",
        {
          "cursor-not-allowed opacity-50": isLoading || disabled,
        },
        className
      )}
      onClick={handleClick}
      disabled={isLoading || disabled}
      {...props} // Spread remaining props
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80">
          <LoaderCircle className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="ml-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {loadingText}
          </span>
        </span>
      )}
      <span className={cn({ 'opacity-0': isLoading })}>{
        // Use children if provided, otherwise use buttonText
        children ?? buttonText
      }</span>
    </button>
  );
}
