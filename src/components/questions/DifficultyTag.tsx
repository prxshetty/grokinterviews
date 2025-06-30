'use client';

import { cn } from '@/lib/utils';

type Difficulty = 'easy' | 'medium' | 'hard' | string;

interface DifficultyTagProps {
  difficulty: Difficulty | undefined | null;
  className?: string;
}

export function DifficultyTag({ difficulty, className }: DifficultyTagProps) {
  if (!difficulty) return null;

  const difficultyMap = {
    easy: {
      text: 'Easy',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    medium: {
      text: 'Medium',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    hard: {
      text: 'Hard',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  };

  const difficultyInfo = difficultyMap[difficulty.toLowerCase() as keyof typeof difficultyMap] || {
    text: difficulty,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        difficultyInfo.className,
        className
      )}
    >
      {difficultyInfo.text}
    </span>
  );
}
