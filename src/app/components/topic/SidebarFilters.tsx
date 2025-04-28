'use client';

import { KeywordFilter } from './index';
import { getDomainKeywords } from '@/app/utils';

interface SidebarFiltersProps {
  selectedTopic: string | null;
  selectedCategory: string | null;
  selectedKeyword: string | null;
  selectedDifficulty: string | null;
  onSelectKeyword: (keyword: string) => void;
  onSelectDifficulty: (difficulty: string) => void;
}

export default function SidebarFilters({
  selectedTopic,
  selectedCategory,
  selectedKeyword,
  selectedDifficulty,
  onSelectKeyword,
  onSelectDifficulty
}: SidebarFiltersProps) {
  // Only show the filters when a topic is selected
  if (!selectedTopic) {
    return null;
  }

  // Get the keywords for the current domain/topic
  const keywords = getDomainKeywords(selectedTopic);

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="w-full">
        <KeywordFilter 
          selectedTopic={selectedTopic}
          selectedKeyword={selectedKeyword}
          keywordsList={keywords}
          onSelectKeyword={onSelectKeyword}
        />
      </div>
    </div>
  );
} 