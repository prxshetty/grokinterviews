'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// We might need to import the actual QuestionType later if the hook itself does filtering.
// For now, it primarily manages filter parameters.
// interface QuestionType { ... }

export function useFilterLogic() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedDifficulty = searchParams.get('difficulty');
  const selectedKeyword = searchParams.get('q'); // Common query parameter for search/keywords

  const updateSearchParams = useCallback((param: string, value: string | null) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (value === null || value.trim() === '') {
      current.delete(param);
    } else {
      current.set(param, value);
    }
    
    // Reset page to 1 when filters change
    if (param === 'difficulty' || param === 'q') {
        current.delete('page');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }, [searchParams, pathname, router]);

  const handleDifficultyChange = useCallback((difficulty: string | null) => {
    updateSearchParams('difficulty', difficulty);
  }, [updateSearchParams]);

  const handleKeywordChange = useCallback((keyword: string | null) => {
    updateSearchParams('q', keyword); 
  }, [updateSearchParams]);

  const clearDifficultyFilter = useCallback(() => {
    handleDifficultyChange(null);
  }, [handleDifficultyChange]);

  const clearKeywordFilter = useCallback(() => {
    handleKeywordChange(null);
  }, [handleKeywordChange]);

  return {
    selectedDifficulty,
    selectedKeyword,
    handleDifficultyChange,
    handleKeywordChange,
    clearDifficultyFilter,
    clearKeywordFilter,
  };
} 