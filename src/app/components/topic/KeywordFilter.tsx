'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface KeywordFilterProps {
  selectedTopic: string | null;
  selectedKeyword: string | null;
  keywordsList: string[];
  onSelectKeyword: (keyword: string) => void;
}

export default function KeywordFilter({ 
  selectedTopic, 
  selectedKeyword, 
  keywordsList, 
  onSelectKeyword 
}: KeywordFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleKeywordClick = (keyword: string) => {
    // Call the parent handler for the keyword selection
    onSelectKeyword(keyword);
    
    // Update URL for deep linking
    if (selectedTopic) {
      // Create a new URL with the keyword parameter
      const params = new URLSearchParams(searchParams);
      
      if (selectedKeyword === keyword) {
        // If clicking the same keyword, clear it
        params.delete('q');
      } else {
        // Otherwise set the new keyword
        params.set('q', keyword);
        // Reset page to 1 when changing keywords
        params.set('page', '1');
      }
      
      // Build the new URL - use the full pathname
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
        Filter by Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywordsList.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleKeywordClick(tag)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors
              ${selectedKeyword === tag 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow border border-gray-300 dark:border-gray-700' 
                : 'bg-white text-black dark:bg-black dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}
            `}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
} 