import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: React.ReactNode
  sublabel?: React.ReactNode
  progressColor?: string
  gradientClass?: string
  illustration?: React.ReactNode
}

export function CircularProgress({
  percentage,
  size = 100,
  strokeWidth = 3,
  className = "",
  label,
  sublabel,
  progressColor = "#10B981",
  gradientClass,
  illustration
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Background Gradient */}
      {gradientClass && (
        <div className={cn(
          "absolute inset-0 rounded-full opacity-5",
          `bg-gradient-to-br ${gradientClass}`
        )} />
      )}

      {/* SVG Progress Circle */}
      <svg 
        className="w-full h-full -rotate-90" 
        viewBox={`0 0 ${size} ${size}`} 
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background circle */}
        <circle
          className="text-muted-foreground/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={progressColor}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease"
          }}
        />
      </svg>

      {/* Illustration */}
      {illustration && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
          {illustration}
        </div>
      )}

      {/* Content */}
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label && (
            <div className="font-semibold text-foreground">
              {label}
            </div>
          )}
          {sublabel && (
            <div className="text-xs text-muted-foreground">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 