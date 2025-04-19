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

  return (
    <div className={`flex justify-between items-center w-full ${className}`}>
      <ul
        className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-1"
        onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
      >
        <Tab 
          href="/dashboard" 
          setPosition={setPosition} 
          isActive={pathname === "/dashboard"}
        >
          Dashboard
        </Tab>
        <Tab 
          href="/dashboard/activity" 
          setPosition={setPosition}
          isActive={pathname === "/dashboard/activity"}
        >
          Recent Activity
        </Tab>
        <Tab 
          href="/dashboard/bookmarks" 
          setPosition={setPosition}
          isActive={pathname === "/dashboard/bookmarks"}
        >
          Bookmarks
        </Tab>

        <Cursor position={position} />
      </ul>
      
      <Link 
        href="/topics" 
        className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium transition-colors"
      >
        Learning
      </Link>
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
}

const Tab = ({
  children,
  setPosition,
  href,
  isActive = false,
}: TabProps) => {
  const ref = useRef<HTMLLIElement>(null);
  
  // Set initial position for active tab
  React.useEffect(() => {
    if (isActive && ref.current) {
      const { width } = ref.current.getBoundingClientRect();
      setPosition({
        width,
        opacity: 1,
        left: ref.current.offsetLeft,
      });
    }
  }, [isActive, setPosition]);
  
  return (
    <li
      ref={ref}
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
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 block"
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
      className="absolute z-0 h-9 rounded-full bg-gray-100 dark:bg-gray-800"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    />
  );
};

export default DashboardNav;
