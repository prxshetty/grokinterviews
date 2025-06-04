'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface DifficultyFilterProps {
  selectedTopic: string | null;
  selectedDifficulty: string | null;
  onSelectDifficulty: (difficulty: string, page: number) => void;
  isLoading?: boolean;
}

export default function DifficultyFilter({
  selectedTopic,
  selectedDifficulty,
  onSelectDifficulty,
  isLoading = false
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
  
  const handleDifficultyClick = useCallback((difficulty: string) => {
    if (!selectedTopic || selectedTopic === 'topics') {
      console.error("No valid topic selected for difficulty filter");
      return;
    }
    
    // First, handle toggling off the current difficulty
    if (selectedDifficulty === difficulty) {
      // Clear the difficulty parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete('difficulty');
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
      onSelectDifficulty('', 1); // Fix: Pass empty string and page 1 to clear
    } else {
      // Set the new difficulty and page 1
      const params = new URLSearchParams(searchParams.toString());
      params.set('difficulty', difficulty);
      params.set('page', '1'); // Always start at page 1 when changing difficulty
      // Always include domain parameter if available
      if (!params.has('domain') && selectedTopic && selectedTopic !== 'topics') {
        params.set('domain', selectedTopic);
      }
      router.push(`${pathname}?${params.toString()}`);
      onSelectDifficulty(difficulty, 1); // Pass difficulty and page 1
    }
  }, [selectedTopic, selectedDifficulty, searchParams, pathname, router, onSelectDifficulty]);
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
        Filter by Difficulty 
        {isLoading && (
          <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
        )}
      </h3>
      <div className="flex flex-wrap gap-2">
        {difficulties.map((difficulty) => (
          <button
            key={difficulty.id}
            onClick={() => handleDifficultyClick(difficulty.id)}
            disabled={isLoading || !selectedTopic || selectedTopic === 'topics'}
            title={!selectedTopic || selectedTopic === 'topics' ? "Select a specific topic first" : ""}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors
              ${selectedDifficulty === difficulty.id 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-md border-2 border-gray-400 dark:border-gray-600' 
                : 'bg-white text-black dark:bg-black dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              ${!selectedTopic || selectedTopic === 'topics' ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            {difficulty.label}
          </button>
        ))}
      </div>
      
      {/* Show count of returned questions if available */}
      {isLoading ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading questions...</p>
      ) : selectedDifficulty && !isLoading ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Showing {selectedDifficulty} difficulty questions
        </p>
      ) : !selectedTopic || selectedTopic === 'topics' ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Select a specific topic to use difficulty filters
        </p>
      ) : null}
    </div>
  );
} 