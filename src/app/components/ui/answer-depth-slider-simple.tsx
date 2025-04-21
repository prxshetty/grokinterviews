"use client"

import * as React from "react"
import { SimpleSlider } from "./simple-slider"

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

interface AnswerDepthSliderSimpleProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function AnswerDepthSliderSimple({ 
  value, 
  onChange, 
  className 
}: AnswerDepthSliderSimpleProps) {
  return (
    <SimpleSlider
      min={1}
      max={3}
      step={1}
      value={value}
      onChange={onChange}
      label="Answer Depth"
      options={DEPTH_OPTIONS}
      descriptions={DEPTH_DESCRIPTIONS}
      className={className}
    />
  )
}
