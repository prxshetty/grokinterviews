'use client';

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useTopicData } from '@/app/hooks';
import ProgressBar from '../ui/ProgressBar';
import TopicDataService from '@/services/TopicDataService';
import styles from './TopicCategoryGrid.module.css';
import { fetchCategoryProgress, fetchSubtopicProgress, fetchSectionProgress } from '@/app/utils/progress';

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

// Define the possible levels this grid can represent
type HierarchyLevel = 'section' | 'topic' | 'category';

interface TopicCategoryGridProps {
  items?: DisplayItem[];
  categories?: DisplayItem[];
  level?: HierarchyLevel; // Indicates what level of the hierarchy the items represent
  onSelectItem?: (itemId: string, level: HierarchyLevel) => void; // Callback when an item is selected
  onSelectCategory?: (categoryId: string) => void; // Alternative callback for backward compatibility
  topicId?: string; // Optional topic ID for context
  domain?: string; // Optional domain for section progress
  isLoading?: boolean; // Optional loading state controlled by parent
  error?: string | null; // Optional error state controlled by parent
}

// Renaming original component
function TopicCategoryGridComponent({
  items,
  categories,
  level = 'category',
  onSelectItem,
  onSelectCategory,
  topicId,
  domain,
  isLoading = false, // Default to not loading
  error = null      // Default to no error
}: TopicCategoryGridProps) {
  const [itemsWithProgress, setItemsWithProgress] = useState<DisplayItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Check for dark mode on mount and when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode(); // Initial check
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Define fetchProgress function
  const fetchProgress = useCallback(async (forceRefresh = false) => {
    // Use the memoized baseItems
    if (!baseItems || !Array.isArray(baseItems) || baseItems.length === 0) {
      setItemsWithProgress([]);
      return;
    }

    // Log the level and domain for debugging
    console.log(`TopicCategoryGrid - Fetching progress for ${baseItems.length} items at level: ${level}${domain ? `, domain: ${domain}` : ''}`);

    try {
      // Create a new array with progress data
      const itemsWithProgressData = await Promise.all(
        baseItems.map(async (item) => {
          try {
            let progress;
            const numericId = parseInt(item.id); // Assuming IDs might be numeric for topics/categories

            // Fetch progress based on the level
            if (level === 'category' && !isNaN(numericId)) {
              progress = await fetchCategoryProgress(numericId, forceRefresh);
              console.log(`Progress for category ${item.label} (ID: ${item.id}):`, progress);
            } else if (level === 'topic' && !isNaN(numericId)) {
              progress = await fetchSubtopicProgress(numericId, forceRefresh);
              console.log(`Progress for topic ${item.label} (ID: ${item.id}):`, progress);
            } else if (level === 'section' && domain) {
              try {
                console.log(`Fetching progress for section ${item.label} in domain ${domain}`);
                // Use the summary API - removed cache busting timestamp and headers
                const url = `/api/user/progress/summary?domain=${domain}&section=${encodeURIComponent(item.label)}&entityType=section`;
                console.log(`Fetching progress from URL: ${url}`);

                const response = await fetch(url); // Removed cache-disabling headers

                console.log(`Progress API response status for ${item.label}:`, response.status);

                if (response.ok) {
                  const data = await response.json();
                  console.log(`Progress summary for section ${item.label} in domain ${domain}:`, data);

                  // Map the progress data to the expected format
                  progress = {
                    questionsCompleted: data.questions_completed || 0,
                    totalQuestions: data.total_questions || 0,
                    completionPercentage: data.completion_percentage || 0
                  };

                  console.log(`Mapped progress for section ${item.label}:`, progress);
                } else {
                  // If the API call failed, fall back to the section progress endpoint
                  console.log(`Falling back to section progress endpoint for ${item.label}`);
                  progress = await fetchSectionProgress(domain, item.label, forceRefresh); // Pass forceRefresh here too
                  console.log(`Fallback progress for section ${item.label} in domain ${domain}:`, progress);
                }
              } catch (error) {
                console.error(`Error fetching progress for section ${item.label}:`, error);
                 // Retry might be excessive here, just use fallback or default
                console.log(`Falling back to section progress endpoint due to error for ${item.label}`);
                try {
                  progress = await fetchSectionProgress(domain, item.label, forceRefresh);
                } catch (fallbackError) {
                  console.error(`Fallback failed for section ${item.label}:`, fallbackError);
                  progress = {
                    questionsCompleted: 0,
                    totalQuestions: 0,
                    completionPercentage: 0
                  };
                }
              }
            } else if (!isNaN(numericId)) { // Fallback for potentially numeric IDs if level is unknown
               progress = await fetchCategoryProgress(numericId, forceRefresh);
            } else { // Default for non-numeric IDs or other cases
                progress = { questionsCompleted: 0, totalQuestions: 0, completionPercentage: 0 };
                console.warn(`Could not determine progress fetch method for item: ${item.label} (ID: ${item.id}, Level: ${level})`);
            }

            // If progress data is valid, add it to the item
            if (progress && typeof progress.completionPercentage === 'number') {
              return { ...item, progress };
            }

            return item; // Return item without progress if fetch failed or wasn't applicable
          } catch (error) {
            console.error(`Failed to fetch progress for item ${item.id} (Level: ${level}):`, error);
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

      console.log('Items with progress data:', validatedProgressData);
      setItemsWithProgress(validatedProgressData);
    } catch (error) {
      console.error('Failed to process progress data:', error);
      // Set items with default progress on error
      setItemsWithProgress(baseItems.map(item => ({
          ...item,
          progress: { questionsCompleted: 0, totalQuestions: 0, completionPercentage: 0 }
      })));
    }
  }, [baseItems, level, domain, topicId]);

  // Define event handlers with useCallback at component level
  const handleQuestionCompleted = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Question completed event detected:', customEvent.detail);
    console.log(`Refreshing progress data due to question completion (Level: ${level})`);
    fetchProgress(true); // Force refresh on completion event
  }, [fetchProgress, level]);

  const handleSectionProgressUpdate = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail;
    console.log('Section progress update event detected:', detail);

    // Only refresh if this grid is showing sections and the event matches the domain
    if (level === 'section' && domain && detail && detail.domain === domain) {
      console.log(`Refreshing progress data for section ${detail.sectionName || 'unknown'} in domain ${detail.domain}`);
      fetchProgress(true); // Force refresh
    }
  }, [level, domain, fetchProgress]);

  // Main useEffect for fetching progress and setting up event listeners
  useEffect(() => {
    // Initial fetch with force refresh to get the latest data
    fetchProgress(true);

    // Add event listeners
    window.addEventListener('questionCompleted', handleQuestionCompleted);
    window.addEventListener('sectionProgressUpdated', handleSectionProgressUpdate);

    // Clean up event listeners
    return () => {
      window.removeEventListener('questionCompleted', handleQuestionCompleted);
      window.removeEventListener('sectionProgressUpdated', handleSectionProgressUpdate);
    };
  }, [fetchProgress, handleQuestionCompleted, handleSectionProgressUpdate]);

  // Display loading or error state if applicable
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading items...</p>
      </div>
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
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">
          No {level} available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      {displayableItems.map((item, index) => (
        <div
          key={item.id || index} // Use index as fallback key if id is not present
          className={`${
            styles.gridItem
          } group relative p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out ${
            selectedItemId === item.id ? styles.selectedItem : ''
          } ${
            isDarkMode ? styles.darkModeItem : styles.lightModeItem
          } hover:shadow-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-gray-800`}
          onClick={() => handleItemSelect(item.id)}
          onKeyPress={(e) => e.key === 'Enter' && handleItemSelect(item.id)}
          tabIndex={0} // Make it focusable
          role="button"
          aria-pressed={selectedItemId === item.id}
          aria-label={`Select ${item.label}`}
        >
          <div className={styles.itemHeader}>
            <span className={styles.itemIndex}>{formatIndex(index)}</span>
            <h3 className={styles.itemLabel}>{item.label}</h3>
          </div>

          {/* Progress Bar */}
          {item.progress && (
            <div className="mt-2">
              <ProgressBar 
                progress={item.progress.completionPercentage || 0} 
                height="sm" // 'sm' corresponds to 'h-2'
                showText={false} // Text is displayed in the <p> tag below
                completed={item.progress.questionsCompleted}
                total={item.progress.totalQuestions}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {item.progress.questionsCompleted} / {item.progress.totalQuestions} questions completed
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(TopicCategoryGridComponent);
