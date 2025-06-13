'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// --- Local Tab and Cursor Components ---

export interface AccountTabProps {
  children: React.ReactNode
  tabValue: string
  currentActiveTab: string
  setActiveTab: (tab: string) => void
  setPosition: React.Dispatch<React.SetStateAction<{
    left: number
    width: number
    opacity: number
  }>>
  position: { left: number; width: number; opacity: number }
}

export function AccountTab({
  children,
  tabValue,
  currentActiveTab,
  setActiveTab,
  setPosition,
  position,
}: AccountTabProps) {
  const ref = useRef<HTMLLIElement>(null)
  const isActive = currentActiveTab === tabValue

  useEffect(() => {
    if (isActive && ref.current) {
      const { width } = ref.current.getBoundingClientRect()
      const newLeft = ref.current.offsetLeft
      // Update position only if it's significantly different or opacity is 0
      // to prevent re-animation on already active/hovered tab.
      if (Math.abs(position.left - newLeft) > 1 || position.opacity === 0) {
        setPosition({
          width,
          opacity: 1,
          left: newLeft,
        })
      }
    }
  }, [isActive, setPosition, position.left, position.opacity]) // Removed ref.current from deps

  const isUnderCursor =
    ref.current &&
    position.opacity === 1 &&
    Math.abs(position.left - ref.current.offsetLeft) < 1

  return (
    <li
      ref={ref}
      data-tab-value={tabValue} // Used for querying active tab element
      onMouseEnter={() => {
        if (!ref.current) return
        const { width } = ref.current.getBoundingClientRect()
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        })
      }}
      onClick={() => setActiveTab(tabValue)}
      className="relative z-10 block cursor-pointer"
    >
      <button // Changed from Link to button as it's internal page navigation
        className={`relative block px-5 py-2 text-sm font-normal transition-colors ${
          isUnderCursor || isActive // Keep text white/black if active or under cursor
            ? 'text-white dark:text-black'
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        {children}
      </button>
    </li>
  )
}

export function Cursor({ position }: { position: any }) {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 h-9 rounded-full bg-black dark:bg-white" // h-9 to match common tab height
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    />
  )
} 