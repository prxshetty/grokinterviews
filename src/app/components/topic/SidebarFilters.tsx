'use client';

import { KeywordFilter } from './index';
import { DifficultyFilter } from './index';
import { getDomainKeywords } from '@/app/utils/keywords';

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
      <div className="flex flex-wrap justify-between items-start">
        <div className="w-1/2 pr-2">
          <KeywordFilter 
            selectedTopic={selectedTopic}
            selectedKeyword={selectedKeyword}
            keywordsList={keywords}
            onSelectKeyword={onSelectKeyword}
          />
        </div>
        
        {/* Show difficulty filter only if no keyword is selected */}
        {!selectedKeyword && (
          <div className="w-1/2 pl-2">
            <DifficultyFilter 
              selectedTopic={selectedTopic}
              selectedDifficulty={selectedDifficulty}
              onSelectDifficulty={onSelectDifficulty}
            />
          </div>
        )}
      </div>
    </div>
  );
} 