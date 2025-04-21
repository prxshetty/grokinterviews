"use client"

import * as React from "react"
import { SnappySlider } from "./snappy-slider"

// Define the depth options
const DEPTH_OPTIONS = {
  1: "Brief",
  2: "Standard",
  3: "Comprehensive"
}

// Define the depth descriptions
const DEPTH_DESCRIPTIONS = {
  1: "Concise answers with key points only",
  2: "Balanced answers with moderate detail",
  3: "In-depth answers with comprehensive explanations"
}

interface AnswerDepthSliderProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function AnswerDepthSlider({ value, onChange, className }: AnswerDepthSliderProps) {
  // Convert the depth value to a display name
  const getDepthName = (depth: number): string => {
    return DEPTH_OPTIONS[depth as keyof typeof DEPTH_OPTIONS] || "Standard";
  }
  
  return (
    <div className="space-y-2">
      <SnappySlider
        values={Object.keys(DEPTH_OPTIONS).map(Number)}
        defaultValue={2}
        value={value}
        onChange={onChange}
        min={1}
        max={3}
        snapping={true}
        step={1}
        label="Answer Depth"
        config={{
          snappingThreshold: 0.3,
          labelFormatter: getDepthName
        }}
        className={className}
      />
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {getDepthName(value)}:
        </span>
        <span className="ml-2">
          {DEPTH_DESCRIPTIONS[value as keyof typeof DEPTH_DESCRIPTIONS]}
        </span>
      </div>
    </div>
  )
}
