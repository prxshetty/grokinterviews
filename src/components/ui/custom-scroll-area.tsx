"use client";

import { useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CustomScrollAreaProps {
    children: ReactNode;
    className?: string;
}

export const CustomScrollArea = ({ children, className }: CustomScrollAreaProps) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
    };

    return (
        <div
            className={cn(
                "h-screen w-full overflow-y-auto",
                // Scrollbar base styles
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "[&::-webkit-scrollbar-thumb]:transition-colors",
                "[&::-webkit-scrollbar-thumb]:duration-300",
                // Dynamic visibility
                isScrolling
                    ? "[&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/20"
                    : "[&::-webkit-scrollbar-thumb]:bg-transparent",
                className
            )}
            onScroll={handleScroll}
        >
            {children}
        </div>
    );
};
