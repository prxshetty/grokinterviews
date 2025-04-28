'use client';

import { KeywordFilter, DifficultyFilter } from './index';
import { getDomainKeywords } from '@/app/utils';

interface SidebarFiltersProps {
  selectedTopic: string | null;
  selectedCategory: string | null;
  selectedKeyword: string | null;
  selectedDifficulty: string | null;
  onSelectKeyword: (keyword: string) => void;
  onSelectDifficulty: (difficulty: string) => void;
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

  // Get the keywords for the current domain/topic
  const keywords = getDomainKeywords(selectedTopic);

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="w-full space-y-6">
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