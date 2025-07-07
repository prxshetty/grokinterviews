"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TabNavItem {
  id: string;
  label: string;
  href?: string; // Optional href for link-based navigation
  onClick?: () => void;
}

interface TabNavProps {
  items: TabNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'button' | 'link'; // Determines whether to render buttons or links
}

export function TabNav({ 
  items, 
  activeTab, 
  onTabChange, 
  className = "",
  variant = 'button'
}: TabNavProps) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  // Function to get active tab element and set position
  const setActiveTabPosition = useCallback(() => {
    const activeTabElement = document.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeTabElement) {
      const { width } = activeTabElement.getBoundingClientRect();
      const left = (activeTabElement as HTMLElement).offsetLeft;
      setPosition({
        width,
        opacity: 1,
        left,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    setActiveTabPosition();
  }, [setActiveTabPosition]);

  // Handle window resize to recalculate position
  useEffect(() => {
    const handleResize = () => {
      setActiveTabPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setActiveTabPosition]);

  return (
    <div className={`flex items-center ${className}`}>
      {/* Mobile: Full width with horizontal scroll, Desktop: Centered with fit width */}
      <div className="overflow-x-auto hide-scrollbar">
        <ul
          className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
          onMouseLeave={() => {
            setActiveTabPosition();
          }}
        >
          {items.map((item) => (
            <Tab
              key={item.id}
              item={item}
              setPosition={setPosition}
              isActive={activeTab === item.id}
              position={position}
              onTabChange={onTabChange}
              variant={variant}
            />
          ))}

          <Cursor position={position} />
        </ul>
      </div>
    </div>
  );
}

interface TabProps {
  item: TabNavItem;
  setPosition: React.Dispatch<React.SetStateAction<{
    left: number;
    width: number;
    opacity: number;
  }>>;
  isActive?: boolean;
  position: { left: number; width: number; opacity: number };
  onTabChange: (tabId: string) => void;
  variant: 'button' | 'link';
}

const Tab = ({
  item,
  setPosition,
  isActive = false,
  position,
  onTabChange,
  variant,
}: TabProps) => {
  const ref = useRef<HTMLLIElement>(null);
  
  useEffect(() => {
    if (isActive && ref.current) {
      const { width } = ref.current.getBoundingClientRect();
      const newLeft = ref.current.offsetLeft;

      // Prevent re-animation when clicking a hovered tab
      if (Math.abs(position.left - newLeft) > 1 || position.opacity === 0) {
        setPosition({
          width,
          opacity: 1,
          left: newLeft,
        });
      }
    }
  }, [isActive, setPosition, position.left, position.opacity]);
  
  const isUnderCursor =
    ref.current &&
    position.opacity === 1 &&
    Math.abs(position.left - ref.current.offsetLeft) < 1;

  const handleClick = () => {
    onTabChange(item.id);
    item.onClick?.();
  };

  // Mobile-first responsive classes with better touch targets and text sizing
  const commonClassName = `relative block px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-xs font-normal transition-colors whitespace-nowrap min-w-0 ${
    isUnderCursor || isActive
      ? 'text-white dark:text-black'
      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
  }`;

  return (
    <li
      ref={ref}
      data-tab-id={item.id}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-10 block cursor-pointer flex-shrink-0"
    >
      {variant === 'link' && item.href ? (
        <Link href={item.href} className={commonClassName}>
          {item.label}
        </Link>
      ) : (
        <button onClick={handleClick} className={commonClassName}>
          {item.label}
        </button>
      )}
    </li>
  );
};

const Cursor = ({ position }: { position: { left: number; width: number; opacity: number } }) => {
  return (
    <div
      className="absolute z-0 h-full top-0 rounded-full bg-black dark:bg-white transition-all duration-300 ease-out"
      style={{
        left: `${position.left}px`,
        width: `${position.width}px`,
        opacity: position.opacity,
        transform: 'translateZ(0)', // Force hardware acceleration
      }}
    />
  );
}; 