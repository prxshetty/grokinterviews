'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface DifficultyFilterProps {
  selectedTopic: string | null;
  selectedDifficulty: string | null;
  onSelectDifficulty: (difficulty: string) => void;
}

export default function DifficultyFilter({
  selectedTopic,
  selectedDifficulty,
  onSelectDifficulty
}: DifficultyFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Define available difficulty levels
  const difficulties = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];
  
  const handleDifficultyClick = (difficulty: string) => {
    // Call the parent handler
    onSelectDifficulty(difficulty);
    
    // Update URL for deep linking
    if (selectedTopic) {
      // Keep only path segments up to the domain
      const baseUrl = pathname.split('/').slice(0, 3).join('/');
      
      // Create a new URL with the difficulty parameter
      const params = new URLSearchParams(searchParams);
      
      if (selectedDifficulty === difficulty) {
        // If clicking the same difficulty, clear it
        params.delete('level');
      } else {
        // Otherwise set the new difficulty
        params.set('level', difficulty);
        // Reset page to 1 when changing difficulty
        params.set('page', '1');
      }
      
      // Build the new URL
      const newUrl = `${baseUrl}/difficulty?${params.toString()}`;
      router.push(newUrl);
    }
  };
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
        Filter by Difficulty
      </h3>
      <div className="flex flex-wrap gap-2">
        {difficulties.map((difficulty) => (
          <span
            key={difficulty.id}
            onClick={() => handleDifficultyClick(difficulty.id)}
            className={`px-3 py-1 ${
              selectedDifficulty === difficulty.id 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            } text-xs rounded-full cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
          >
            {difficulty.label}
          </span>
        ))}
      </div>
    </div>
  );
} 