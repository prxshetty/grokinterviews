'use client';

import { useState, memo, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconHover3D } from '@/components/ui';
import styles from './TopicCategoryGrid.module.css';
import { LoadingSpinner } from '@/components/ui';
import { getDomainLabel } from '@/config/domain.constants';
import { useResponsive } from '@/hooks/ui/useResponsive';
import type { DisplayItem } from '@/types/topics';
export type HierarchyLevel = 'section' | 'topic' | 'category';

interface TopicCategoryGridProps {
  items?: DisplayItem[];
  categories?: DisplayItem[];
  level?: HierarchyLevel; // Indicates what level of the hierarchy the items represent
  onSelectItem?: (itemId: string, level: HierarchyLevel) => void; // Callback when an item is selected
  onSelectCategory?: (categoryId: string) => void; // Alternative callback for backward compatibility
  domain?: string; // Optional domain for section progress
  isLoading?: boolean; // Optional loading state controlled by parent
  error?: string | null; // Optional error state controlled by parent
  showDomainTitle?: boolean; // New prop to control domain title visibility
  basePath?: string; // New prop for base path for navigation
  compact?: boolean; // New prop to control padding and spacing
}

// Renaming original component
function TopicCategoryGridComponent({
  items,
  categories,
  level = 'category',
  onSelectItem,
  onSelectCategory,
  domain,
  isLoading = false, // Default to not loading
  error = null,      // Default to no error
  showDomainTitle = true, // Default to false
  basePath, // Destructure new prop
  compact = false, // Default to false
}: TopicCategoryGridProps) {
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const { isMobile, isTablet, isLaptop } = useResponsive();

  // Memoize the base items to avoid recalculating on every render
  const baseItems = useMemo(() => {
    return items || categories || [];
  }, [items, categories]);

  // Use base items directly since we removed progress
  const displayableItems = useMemo(() => {
    return baseItems;
  }, [baseItems]);

  // Memoize the format index function with useCallback
  const formatIndex = useCallback((index: number, item?: DisplayItem) => {
    // For sections, use display_order if available, otherwise fall back to sequential index
    if (level === 'section' && item && item.display_order !== undefined) {
      return `${String(item.display_order).padStart(2, '0')}`;
    }
    return `${String(index + 1).padStart(2, '0')}`;
  }, [level]);

  // Memoize the handle item select function
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItemId(itemId);

    if (basePath) {
      router.push(`${basePath}/${itemId}`);
    } else if (onSelectItem) {
      onSelectItem(itemId, level); // Pass the selected item ID and the current level
    } else if (onSelectCategory) {
      onSelectCategory(itemId); // For backward compatibility
    }

    // Toggle expanded state
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(itemId);
    }
  }, [onSelectItem, onSelectCategory, level, expandedItemId, basePath, router]);



  // Helper function to get the display name for the domain
  const getDisplayDomainName = (domainKey: string): string => {
    return getDomainLabel(domainKey);
  };

  // Display loading or error state if applicable
  if (isLoading) {
    return (
      <LoadingSpinner
        size="lg"
        color="primary"
        text="Loading items..."
        centered={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  // Handle case where no items are available
  if (!displayableItems || displayableItems.length === 0) {
    return (
      <div className="text-center py-10 px-4 pt-24 sm:pt-28 md:pt-32">
        {showDomainTitle && domain && (
          <h2 className="text-3xl sm:text-4xl font-editorial font-extralight tracking-tight md:text-5xl mb-6 text-left text-gray-800 dark:text-gray-200">
            {getDisplayDomainName(domain)}
          </h2>
        )}
        <p className="text-gray-500 dark:text-gray-400">
          No {level} available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col ${compact ? 'pt-4' : 'pt-8 sm:pt-12'}`}>
      {showDomainTitle && domain && (
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/topics')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Back to Topics"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <motion.h2
              layoutId={`domain-title-${domain}`}
              className="text-3xl sm:text-4xl font-editorial font-extralight tracking-tight md:text-5xl text-left text-gray-800 dark:text-gray-200"
            >
              {getDisplayDomainName(domain)}
            </motion.h2>
          </div>
        </div>
      )}
      <div
        className={`${styles.gridContainer} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12`}
      >
        {displayableItems.map((item, index) => {
          return (
            <div
              key={item.id || index}
              className={`${styles.gridItem} p-0 group relative rounded-lg transition-all duration-300 ease-in-out focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-gray-800 max-w-full`}
              onClick={() => handleItemSelect(item.id)}
              onKeyPress={(e) => e.key === 'Enter' && handleItemSelect(item.id)}
              tabIndex={0}
              role="button"
              aria-pressed={selectedItemId === item.id}
              aria-label={`Select ${item.label}`}
            >
              {/* Show IconHover3D only on mobile and desktop, hide on tablet */}
              {!isTablet ? (
                <div className="w-full flex justify-center items-center">
                  <IconHover3D
                    heading={item.label}
                    text={item.label}
                    width={isMobile ? 320 : isLaptop ? 340 : 450}
                    height={isMobile ? 90 : isLaptop ? 115 : 150}
                  />
                </div>
              ) : (
                /* Simplified tablet layout with transparent background and spacing */
                <div className="flex flex-col justify-center flex-1 p-6 bg-transparent border-0 rounded-lg min-h-[120px] transition-colors">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.label}
                  </p>
                </div>
              )}
              <span className={styles.serialNumber}>{formatIndex(index, item)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TopicCategoryGridComponent);
