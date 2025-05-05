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
    <div className="px-4 pb-4 pt-0">
      <div className="w-full space-y-4">
        <KeywordFilter 
          selectedTopic={selectedTopic}
          selectedKeyword={selectedKeyword}
          keywordsList={keywords}
          onSelectKeyword={onSelectKeyword}
        />
        <DifficultyFilter
          selectedTopic={selectedTopic}
          selectedDifficulty={selectedDifficulty}
          onSelectDifficulty={onSelectDifficulty}
          isLoading={isLoadingDifficulty}
        />
      </div>
    </div>
  );
} 