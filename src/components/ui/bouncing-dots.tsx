"use client"


import { cva } from "class-variance-authority"
import { HTMLMotionProps, motion } from "framer-motion"

import { cn } from "@/lib/utils"

const bouncingDotsVariant = cva("flex gap-1 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface BouncingDotsProps {
  /**
   * The number of bouncing dots to display.
   * @public/images/female_default.png 3
   */
  dots?: number
  /**
   * Optional message to display alongside the bouncing dots.
   */
  message?: string
  /**
   * Position of the message relative to the spinner.
   * @public/images/female_default.png bottom
   */
  messagePlacement?: "bottom" | "left" | "right"
}

export function BouncingDots({
  dots = 3,
  message,
  messagePlacement = "bottom",
  className,
  ...props
}: HTMLMotionProps<"div"> & BouncingDotsProps) {
  return (
    <div className={cn(bouncingDotsVariant({ messagePlacement }))}>
      <div className={cn("flex gap-1 items-center justify-center")}>
        {Array(dots)
          .fill(undefined)
          .map((_, index) => (
            <motion.div
              key={index}
              className={cn("w-1 h-1 bg-foreground rounded-full", className)}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
              {...props}
            />
          ))}
      </div>
      {message && <div>{message}</div>}
    </div>
  )
}