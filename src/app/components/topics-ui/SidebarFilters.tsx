'use client';

import { KeywordFilter, DifficultyFilter } from './index';
import { getDomainKeywords } from '@/app/utils';

interface SidebarFiltersProps {
  selectedTopic: string | null;
  selectedCategory: string | null;
  selectedKeyword: string | null;
  selectedDifficulty: string | null;
  onSelectKeyword: (keyword: string) => void;
  onSelectDifficulty: (difficulty: string, page?: number) => void;
  isLoadingKeyword?: boolean;
  isLoadingDifficulty?: boolean;
}

export default function SidebarFilters({
  selectedTopic,
  selectedCategory,
  selectedKeyword,
  selectedDifficulty,
  onSelectKeyword,
  onSelectDifficulty,
  isLoadingKeyword = false,
  isLoadingDifficulty = false
}: SidebarFiltersProps) {
  // Only show the filters when a topic is selected
  if (!selectedTopic) {
    return null;
  }

  // Get all keywords for the current domain/topic (no pagination)
  const keywords = getDomainKeywords(selectedTopic, 1, 0); // pageSize=0 returns all

  return (
    <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="w-full flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="flex-1">
          <KeywordFilter 
            selectedTopic={selectedTopic}
            selectedKeyword={selectedKeyword}
            keywordsList={keywords}
            onSelectKeyword={onSelectKeyword}
          />
        </div>
        <div className="flex-1">
          <DifficultyFilter
            selectedTopic={selectedTopic}
            selectedDifficulty={selectedDifficulty}
            onSelectDifficulty={onSelectDifficulty}
            isLoading={isLoadingDifficulty}
          />
        </div>
      </div>
    </div>
  );
} 