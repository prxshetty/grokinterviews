"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface TabNavItem {
  id: string;
  label: string;
  onClick?: () => void;
}

interface TabNavProps {
  items: TabNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNav({ items, activeTab, onTabChange, className = "" }: TabNavProps) {
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

  return (
    <div className={`flex items-center w-full ${className}`}>
      <ul
        className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1"
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
          />
        ))}

        <Cursor position={position} />
      </ul>
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
}

const Tab = ({
  item,
  setPosition,
  isActive = false,
  position,
  onTabChange,
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
      className="relative z-10 block cursor-pointer"
    >
      <button
        onClick={() => {
          onTabChange(item.id);
          item.onClick?.();
        }}
        className={`relative block px-5 py-2 text-sm font-normal transition-colors ${
          isUnderCursor
            ? 'text-white dark:text-black'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {item.label}
      </button>
    </li>
  );
};

const Cursor = ({ position }: { position: { left: number; width: number; opacity: number } }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 h-9 rounded-full bg-black dark:bg-white"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    />
  );
}; 