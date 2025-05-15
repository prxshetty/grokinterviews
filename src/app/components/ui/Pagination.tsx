'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  enableUrlUpdate?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  enableUrlUpdate = true
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  const handlePageClick = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    
    // Call the parent handler
    onPageChange(page);
    
    // Update URL if enabled
    if (enableUrlUpdate) {
      const params = new URLSearchParams(searchParams);
      params.set('page', page.toString());
      
      // Preserve the current path, just update the query parameters
      router.push(`${pathname}?${params.toString()}`);
    }
  };
  
  return (
    <div className="flex justify-center space-x-1 my-6">
      {/* Previous button */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md ${
          currentPage === 1
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        } border border-gray-300 dark:border-gray-700`}
      >
        &lt;
      </button>
      
      {/* First page */}
      {currentPage > 3 && (
        <button
          onClick={() => handlePageClick(1)}
          className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700"
        >
          1
        </button>
      )}
      
      {/* Ellipsis for skipped pages at start */}
      {currentPage > 4 && (
        <span className="px-3 py-1 text-gray-500 dark:text-gray-400">...</span>
      )}
      
      {/* Pages around current page */}
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        // Calculate page numbers to show around current page
        let pageNum;
        if (currentPage <= 3) {
          // Near start, show first 5 pages or fewer
          pageNum = i + 1;
        } else if (currentPage >= totalPages - 2) {
          // Near end, show last 5 pages or fewer
          pageNum = totalPages - 4 + i;
        } else {
          // Middle, show 2 before and 2 after current
          pageNum = currentPage - 2 + i;
        }
        
        // Skip if outside valid range
        if (pageNum < 1 || pageNum > totalPages) {
          return null;
        }
        
        return (
          <button
            key={pageNum}
            onClick={() => handlePageClick(pageNum)}
            className={`px-3 py-1 rounded-md ${
              currentPage === pageNum
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
            }`}
          >
            {pageNum}
          </button>
        );
      })}
      
      {/* Ellipsis for skipped pages at end */}
      {currentPage < totalPages - 3 && (
        <span className="px-3 py-1 text-gray-500 dark:text-gray-400">...</span>
      )}
      
      {/* Last page */}
      {currentPage < totalPages - 2 && (
        <button
          onClick={() => handlePageClick(totalPages)}
          className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700"
        >
          {totalPages}
        </button>
      )}
      
      {/* Next button */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md ${
          currentPage === totalPages
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        } border border-gray-300 dark:border-gray-700`}
      >
        &gt;
      </button>
    </div>
  );
} 