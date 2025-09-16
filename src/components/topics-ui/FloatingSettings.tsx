'use client';

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FloatingSettingsProps {
  selectedDifficulty: string | null;
  onSelectDifficulty: (difficulty: string) => void;
  onClear: () => void;
  className?: string;
}

export default function FloatingSettings({
  selectedDifficulty,
  onSelectDifficulty,
  onClear,
  className = '',
}: FloatingSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {selectedDifficulty && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
          <button
            aria-label="Clear filter"
            onClick={onClear}
            className="p-2 rounded-full bg-transparent transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 flex items-center justify-center"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </motion.div>
      )}
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Difficulty settings"
            className={`p-2 rounded-full bg-transparent backdrop-blur-md transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 flex items-center justify-center`}
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
          <DropdownMenuRadioGroup value={selectedDifficulty ?? ''} onValueChange={onSelectDifficulty}>
            {[
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Advanced', value: 'advanced' },
            ].map((d) => (
              <DropdownMenuRadioItem
                key={d.value}
                value={d.value}
                className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-white/10"
              >
                <span>{d.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}