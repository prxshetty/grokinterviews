'use client';

import { useState } from 'react';
import { Settings, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FloatingSettingsProps {
  selectedDifficulty: string | null;
  onSelectDifficulty: (difficulty: string) => void;
  className?: string;
}

export default function FloatingSettings({
  selectedDifficulty,
  onSelectDifficulty,
  className = '',
}: FloatingSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Difficulty settings"
          className={`p-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 flex items-center justify-center ${className}`}
        >
          <motion.span
            animate={isOpen ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ display: 'inline-flex' }}
          >
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </motion.span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48 bg-white/95 dark:bg-black/95 border border-gray-200 dark:border-white/10 shadow-lg rounded-md backdrop-blur-md"
        align="end"
      >
        <DropdownMenuLabel className="text-gray-900 dark:text-white">
          Difficulty
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
        {['Beginner', 'Intermediate', 'Advanced'].map((d) => (
          <DropdownMenuItem
            key={d}
            onSelect={() => onSelectDifficulty(d.toLowerCase())}
            className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-white/10"
          >
            <Check
              className={`mr-2 h-4 w-4 ${
                selectedDifficulty === d.toLowerCase() ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span>{d}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 