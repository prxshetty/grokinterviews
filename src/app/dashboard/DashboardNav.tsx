"use client"; 

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavProps {
  className?: string;
}

function DashboardNav({ className = "" }: DashboardNavProps) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  
  const pathname = usePathname();

  // Check if any tab is active
  const hasActiveTab = pathname === "/dashboard" || 
                      pathname === "/dashboard/activity" || 
                      pathname === "/dashboard/bookmarks";

  // Function to get active tab element and set position
  const setActiveTabPosition = () => {
    if (!hasActiveTab) return;
    
    const activeTabElement = document.querySelector(`[data-tab-active="true"]`);
    if (activeTabElement) {
      const { width } = activeTabElement.getBoundingClientRect();
      const left = (activeTabElement as HTMLElement).offsetLeft;
      setPosition({
        width,
        opacity: 1,
        left,
      });
    }
  };

  return (
    <div className={`flex items-center w-full ${className}`}>
      <ul
        className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1"
        onMouseLeave={() => {
          if (hasActiveTab) {
            setActiveTabPosition();
          } else {
            setPosition((pv) => ({ ...pv, opacity: 0 }));
          }
        }}
      >
        <Tab 
          href="/dashboard" 
          setPosition={setPosition} 
          isActive={pathname === "/dashboard"}
          position={position}
        >
          Dashboard
        </Tab>
        <Tab 
          href="/dashboard/activity" 
          setPosition={setPosition}
          isActive={pathname === "/dashboard/activity"}
          position={position}
        >
          Recent Activity
        </Tab>
        <Tab 
          href="/dashboard/bookmarks" 
          setPosition={setPosition}
          isActive={pathname === "/dashboard/bookmarks"}
          position={position}
        >
          Bookmarks
        </Tab>

        <Cursor position={position} />
      </ul>
    </div>
  );
}

interface TabProps {
  children: React.ReactNode;
  setPosition: React.Dispatch<React.SetStateAction<{
    left: number;
    width: number;
    opacity: number;
  }>>;
  href: string;
  isActive?: boolean;
  position: { left: number; width: number; opacity: number };
}

const Tab = ({
  children,
  setPosition,
  href,
  isActive = false,
  position,
}: TabProps) => {
  const ref = useRef<HTMLLIElement>(null);
  
  React.useEffect(() => {
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
      data-tab-active={isActive}
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
      <Link 
        href={href}
        className={`relative block px-5 py-2 text-sm font-normal transition-colors ${
          isUnderCursor
            ? 'text-white dark:text-black'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {children}
      </Link>
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
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

export default DashboardNav; 