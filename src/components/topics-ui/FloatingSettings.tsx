'use client';

import { Settings, Check } from 'lucide-react';
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
}

export default function FloatingSettings({
  selectedDifficulty,
  onSelectDifficulty,
}: FloatingSettingsProps) {
  return (
    <div className="fixed top-20 right-4 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Difficulty settings"
            className="p-3 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-lg transition-all duration-300 hover:bg-white dark:hover:bg-black hover:shadow-xl hover:scale-105"
          >
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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
    </div>
  );
} 