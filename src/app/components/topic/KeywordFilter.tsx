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
      // Keep only path segments up to the domain
      const baseUrl = pathname.split('/').slice(0, 3).join('/');
      
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
      
      // Build the new URL
      const newUrl = `${baseUrl}/keyword?${params.toString()}`;
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
          <span
            key={tag}
            className={`px-3 py-1 ${
              selectedKeyword === tag 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            } text-xs rounded-full cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
            onClick={() => handleKeywordClick(tag)}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
} 