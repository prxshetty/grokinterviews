'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface KeywordItem {
  keyword: string;
  occurrence_count: number;
}

interface KeywordFilterProps {
  selectedTopic: string | null;
  selectedKeyword: string | null;
  keywordsList: KeywordItem[];
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
    onSelectKeyword(keyword);
    if (selectedTopic) {
      const params = new URLSearchParams(searchParams);
      if (selectedKeyword === keyword) {
        params.delete('q');
      } else {
        params.set('q', keyword);
        params.set('page', '1');
      }
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
        Popular Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywordsList.map((item) => (
          <button
            key={item.keyword}
            type="button"
            onClick={() => handleKeywordClick(item.keyword)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors
              ${selectedKeyword === item.keyword 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow border border-gray-300 dark:border-gray-700' 
                : 'bg-white text-black dark:bg-black dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}
            `}
          >
            <span>{item.keyword}</span>
            <span className="ml-1 text-xs opacity-70">({item.occurrence_count})</span>
          </button>
        ))}
      </div>
    </div>
  );
} 