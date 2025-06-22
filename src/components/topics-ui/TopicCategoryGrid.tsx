'use client';

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { IconHover3D } from '@/components/ui';
import styles from './TopicCategoryGrid.module.css';
import { fetchCategoryProgress, fetchSubtopicProgress, fetchSectionProgress } from '@/app/utils/progress';
import { LoadingSpinner } from '@/components/ui';

// Define the structure for items to be displayed
interface DisplayItem {
  id: string;
  label: string;
  progress?: {
    questionsCompleted: number;
    totalQuestions: number;
    completionPercentage: number;
  };
}

interface SubtopicProgress {
  completionPercentage: number;
  questionsCompleted: number;
  totalQuestions: number;
  categoriesCompleted: number;
  totalCategories: number;
}

// Define the possible levels this grid can represent
type HierarchyLevel = 'section' | 'topic' | 'category';

interface TopicCategoryGridProps {
  items?: DisplayItem[];
  categories?: DisplayItem[];
  level?: HierarchyLevel; // Indicates what level of the hierarchy the items represent
  onSelectItem?: (itemId: string, level: HierarchyLevel) => void; // Callback when an item is selected
  onSelectCategory?: (categoryId: string) => void; // Alternative callback for backward compatibility
  domain?: string; // Optional domain for section progress
  isLoading?: boolean; // Optional loading state controlled by parent
  error?: string | null; // Optional error state controlled by parent
  subtopicProgress?: Record<string, SubtopicProgress>;
  dataCache?: Record<string, any>;
  showDomainTitle?: boolean; // New prop to control domain title visibility
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
  subtopicProgress,
  dataCache,
  showDomainTitle = false // Default to false
}: TopicCategoryGridProps) {
  const [itemsWithProgress, setItemsWithProgress] = useState<DisplayItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Memoize the base items to avoid recalculating on every render
  const baseItems = useMemo(() => {
    return items || categories || [];
  }, [items, categories]);

  // Memoize the displayable items calculation
  const displayableItems = useMemo(() => {
    return itemsWithProgress.length > 0 ? itemsWithProgress : baseItems;
  }, [itemsWithProgress, baseItems]);

  // Memoize the format index function with useCallback
  const formatIndex = useCallback((index: number) => {
    return `${String(index + 1).padStart(2, '0')}`;
  }, []);

  // Memoize the handle item select function
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItemId(itemId);

    // Call the appropriate callback based on what was provided
    if (onSelectItem) {
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
  }, [onSelectItem, onSelectCategory, level, expandedItemId]);

  // Define fetchProgress function
  const fetchProgress = useCallback(async (forceRefresh = false) => {
    // Use the memoized baseItems
    if (!baseItems || !Array.isArray(baseItems) || baseItems.length === 0) {
      setItemsWithProgress([]);
      return;
    }

    try {
      // Create a new array with progress data
      const itemsWithProgressData = await Promise.all(
        baseItems.map(async (item) => {
          try {
            let progress;
            const isTopic = item.id.startsWith('topic-');
            const isCategory = !isTopic && !item.id.startsWith('header-');
            const numericId = parseInt(item.id.split('-').pop() || '0');

            // Fetch progress based on the level
            if (level === 'category' && isCategory && !isNaN(numericId)) {
              progress = await fetchCategoryProgress(numericId, forceRefresh);
            } else if (level === 'topic' && isTopic && !isNaN(numericId)) {
              const sp = subtopicProgress && subtopicProgress[item.id];
              if (sp) {
                progress = {
                  questionsCompleted: sp.questionsCompleted,
                  totalQuestions: sp.totalQuestions,
                  completionPercentage: sp.completionPercentage,
                };
              } else {
                progress = await fetchSubtopicProgress(numericId, forceRefresh);
              }
            } else if (level === 'section' && domain) {
              const cacheKey = `section-progress-${domain}-${item.label}`;
              if (dataCache && dataCache[cacheKey]) {
                progress = dataCache[cacheKey];
              } else {
                try {
                  const response = await fetch(`/api/user/progress/summary?domain=${domain}&section=${encodeURIComponent(item.label)}&entityType=section`);
                  
                  if (response.ok) {
                    const data = await response.json();

                    // For sections, use completed_children and total_children instead of questions
                    // since sections track subtopic completion, not individual question completion
                    progress = {
                      questionsCompleted: data.completed_children || 0,  // Number of subtopics completed
                      totalQuestions: data.total_children || 0,          // Total number of subtopics
                      completionPercentage: data.completion_percentage || 0
                    };

                  } else {
                    // If the API call failed, fall back to the section progress endpoint
                    progress = await fetchSectionProgress(domain, item.label, forceRefresh); // Pass forceRefresh here too
                  }
                } catch (error) {
                   // Retry might be excessive here, just use fallback or default
                  try {
                    progress = await fetchSectionProgress(domain, item.label, forceRefresh);
                  } catch (fallbackError) {
                    progress = {
                      questionsCompleted: 0,
                      totalQuestions: 0,
                      completionPercentage: 0
                    };
                  }
                }
              }
            } else if (!isNaN(numericId)) { // Fallback for potentially numeric IDs if level is unknown
               progress = await fetchCategoryProgress(numericId, forceRefresh);
            } else { // Default for non-numeric IDs or other cases
                progress = { questionsCompleted: 0, totalQuestions: 0, completionPercentage: 0 };
            }

            // If progress data is valid, add it to the item
            if (progress && typeof progress.completionPercentage === 'number') {
              return { ...item, progress };
            }

            return item; // Return item without progress if fetch failed or wasn't applicable
          } catch (error) {
            return item; // Return item without progress data on error
          }
        })
      );

      // Ensure all progress data is properly formatted
      const validatedProgressData = itemsWithProgressData.map(item => {
        if (item.progress) {
          // Make sure completionPercentage is a number
          const completionPercentage = typeof item.progress.completionPercentage === 'number' ?
            item.progress.completionPercentage : 0;

          // Make sure other values are numbers
          return {
            ...item,
            progress: {
              ...item.progress,
              completionPercentage,
              questionsCompleted: item.progress.questionsCompleted || 0,
              totalQuestions: item.progress.totalQuestions || 0
            }
          };
        }
        // If item has no progress property after fetch, initialize it
        return {
          ...item,
          progress: {
            questionsCompleted: 0,
            totalQuestions: 0, // Might need a way to get total questions if progress fetch failed entirely
            completionPercentage: 0
          }
        };
      });

      setItemsWithProgress(validatedProgressData);
    } catch (error) {
      // Set items with default progress on error
      setItemsWithProgress(baseItems.map(item => ({
          ...item,
          progress: { questionsCompleted: 0, totalQuestions: 0, completionPercentage: 0 }
      })));
    }
  }, [baseItems, level, domain, subtopicProgress, dataCache]);

  // Define event handlers with useCallback at component level
  const handleQuestionCompleted = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    fetchProgress(true); // Force refresh on completion event
  }, [fetchProgress, level]);

  const handleQuestionCompletionFailed = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    // Potentially force a refresh to revert optimistic changes in parent components
    fetchProgress(true);
  }, [fetchProgress]);

  const handleSectionProgressUpdate = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail;

    // Only refresh if this grid is showing sections and the event matches the domain
    if (level === 'section' && domain && detail && detail.domain === domain) {
      fetchProgress(true); // Force refresh
    }
  }, [level, domain, fetchProgress]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('questionCompleted', handleQuestionCompleted);
    window.addEventListener('questionCompletionFailed', handleQuestionCompletionFailed);
    window.addEventListener('sectionProgressUpdate', handleSectionProgressUpdate);

    return () => {
      window.removeEventListener('questionCompleted', handleQuestionCompleted);
      window.removeEventListener('questionCompletionFailed', handleQuestionCompletionFailed);
      window.removeEventListener('sectionProgressUpdate', handleSectionProgressUpdate);
    };
  }, [handleQuestionCompleted, handleQuestionCompletionFailed, handleSectionProgressUpdate]);

  // Initial fetch of progress data
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Define a mapping for domain abbreviations to full names
  const domainNameMap: Record<string, string> = {
    ai: 'Artificial Intelligence',
    ml: 'Machine Learning',
    'web-dev': 'Web Development',
    'system-design': 'System Design',
    dsa: 'Data Structures and Algorithms',
  };

  // Helper function to get the display name for the domain
  const getDisplayDomainName = (domainKey: string): string => {
    const lowerDomainKey = domainKey.toLowerCase();
    return domainNameMap[lowerDomainKey] || domainKey.charAt(0).toUpperCase() + domainKey.slice(1);
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
      <div className="text-center py-10 px-4">
        {showDomainTitle && domain && (
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl mb-6 text-left text-gray-800 dark:text-gray-200">
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
    <div className="w-full px-2 sm:px-4">
      {showDomainTitle && domain && (
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight md:text-5xl mb-6 text-left text-gray-800 dark:text-gray-200">
          {getDisplayDomainName(domain)}
        </h2>
      )}
      <div className={`${styles.gridContainer} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-2 sm:p-4`}>
        {displayableItems.map((item, index) => {
          // Determine the text to display. Show total questions for topics/categories,
          // and total subtopics for sections.
          const total = item.progress?.totalQuestions ?? 0;
          const completed = item.progress?.questionsCompleted ?? 0;
          const progressText = level === 'section'
            ? `${completed} / ${total} Subtopics`
            : `${completed} / ${total} Questions`;

          return (
            <div
              key={item.id || index}
              className={`${styles.gridItem} px-2 sm:px-3 py-2 sm:py-3 group relative rounded-lg transition-all duration-300 ease-in-out focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-gray-800`}
              onClick={() => handleItemSelect(item.id)}
              onKeyPress={(e) => e.key === 'Enter' && handleItemSelect(item.id)}
              tabIndex={0}
              role="button"
              aria-pressed={selectedItemId === item.id}
              aria-label={`Select ${item.label}`}
            >
              <IconHover3D
                heading={item.label}
                text={item.progress ? `Progress: ${item.progress.completionPercentage.toFixed(0)}% (${progressText})` : 'No progress data'}
              />
              <span className={styles.serialNumber}>{formatIndex(index)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TopicCategoryGridComponent);
