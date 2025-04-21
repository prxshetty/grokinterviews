"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleSliderProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  label: string
  className?: string
  options?: Record<number, string>
  descriptions?: Record<number, string>
}

export function SimpleSlider({
  min,
  max,
  step,
  value,
  onChange,
  label,
  className,
  options = {},
  descriptions = {}
}: SimpleSliderProps) {
  // Get the option label for the current value
  const getOptionLabel = (val: number): string => {
    return options[val] || val.toString();
  };

  // Get the description for the current value
  const getDescription = (val: number): string => {
    return descriptions[val] || "";
  };

  // Calculate percentage for slider position
  const percentage = ((value - min) / (max - min)) * 100;

  // Handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  // Generate tick marks for the slider
  const tickMarks = React.useMemo(() => {
    const marks = [];
    for (let i = min; i <= max; i += step) {
      marks.push(i);
    }
    return marks;
  }, [min, max, step]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {getOptionLabel(value)}
        </span>
      </div>

      <div className="relative pt-1">
        {/* Slider track */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full">
          {/* Slider progress */}
          <div
            className="absolute h-1.5 bg-black dark:bg-white rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Tick marks */}
        <div className="relative h-2 mt-1">
          {tickMarks.map((mark) => {
            const markPercentage = ((mark - min) / (max - min)) * 100;
            return (
              <div
                key={mark}
                className="absolute top-0 w-0.5 h-3 -mt-1 bg-gray-300 dark:bg-gray-600"
                style={{ left: `${markPercentage}%` }}
              ></div>
            );
          })}
        </div>

        {/* Slider input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
        />
      </div>

      {/* Option labels */}
      <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
        {tickMarks.map((mark) => (
          <span
            key={mark}
            className={cn(
              "px-2 py-0.5 rounded",
              mark === value ? "bg-gray-100 dark:bg-gray-800" : ""
            )}
          >
            {getOptionLabel(mark)}
          </span>
        ))}
      </div>

      {/* Description */}
      {getDescription(value) && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {getDescription(value)}
        </div>
      )}
    </div>
  );
}
