'use client';

import { useState, useEffect } from 'react';
import styles from './TopicCategoryGrid.module.css';
import ProgressBar from '../ui/ProgressBar';
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

export default function TopicCategoryGrid({
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [itemsWithProgress, setItemsWithProgress] = useState<DisplayItem[]>([]);

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

  // Handle item selection
  const handleItemSelect = (itemId: string) => {
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
  };

  // Format the index number with leading zeros
  const formatIndex = (index: number) => {
    return `${String(index + 1).padStart(2, '0')}`;
  };

  // Fetch progress data for each item (category, topic, or section)
  useEffect(() => {
    const fetchProgress = async (forceRefresh = false) => {
      // Use the items passed via props, with fallback to categories for backward compatibility
      const baseItems = items || categories || [];

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
    };

    // Initial fetch with force refresh to get the latest data
    fetchProgress(true);

    // Set up event listeners for progress updates

    // General question completed event triggers refresh for all levels shown
    const handleQuestionCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Question completed event detected:', customEvent.detail);
      console.log(`Refreshing progress data due to question completion (Level: ${level})`);
      fetchProgress(true); // Force refresh on completion event
    };

    // Section-specific event listener for more targeted updates (only relevant if level='section')
    const handleSectionProgressUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      console.log('Section progress update event detected:', detail);

      // Only refresh if this grid is showing sections and the event matches the domain
      if (level === 'section' && domain && detail && detail.domain === domain) {
        console.log(`Refreshing progress data for section ${detail.sectionName || 'unknown'} in domain ${detail.domain}`);
        fetchProgress(true); // Force refresh
      }
    };

    // Add the general listener
    window.addEventListener('questionCompleted', handleQuestionCompleted);

    // Add section listeners only if the level is 'section' and domain is provided
    let sectionEventListeners: { eventName: string; handler: EventListener }[] = [];
    if (level === 'section' && domain) {
      const domainEventName = `sectionProgress:${domain}`;
      console.log(`Setting up listener for domain event: ${domainEventName}`);
      window.addEventListener(domainEventName, handleSectionProgressUpdate);
      sectionEventListeners.push({ eventName: domainEventName, handler: handleSectionProgressUpdate });

      // Also listen for specific section updates within this domain
      const baseItems = items || categories || [];
      if (baseItems && Array.isArray(baseItems)) {
        baseItems.forEach(item => {
          const sectionEventName = `sectionProgress:${domain}:${item.label}`;
          console.log(`Setting up listener for section event: ${sectionEventName}`);
          window.addEventListener(sectionEventName, handleSectionProgressUpdate);
          sectionEventListeners.push({ eventName: sectionEventName, handler: handleSectionProgressUpdate });
        });
      }
    }

    // Cleanup function
    return () => {
      // Clean up general event listener
      window.removeEventListener('questionCompleted', handleQuestionCompleted);

      // Clean up section-specific listeners if they were added
      sectionEventListeners.forEach(({ eventName, handler }) => {
        console.log(`Removing listener for: ${eventName}`);
        window.removeEventListener(eventName, handler);
      });
    };
    // Dependencies: items/categories structure might change, level, domain
  }, [items, categories, level, domain]); // Removed topicId as it wasn't used in the effect for fetching

  // Use the items with progress data
  let displayItems = itemsWithProgress;

  console.log(`TopicCategoryGrid - Rendering level: ${level}`);
  console.log(`TopicCategoryGrid - Display items count: ${displayItems?.length || 0}`);

  // Check if displayItems is defined and has a length property before using it
  if (!displayItems || !Array.isArray(displayItems)) {
    console.error('TopicCategoryGrid - displayItems is not an array:', displayItems);
    displayItems = []; // Fallback to empty array
  }

  // Split items into three columns for better layout
  // Ensure displayItems is an array before slicing
  const safeDisplayItems = Array.isArray(displayItems) ? displayItems : [];
  const itemsPerColumn = Math.ceil(safeDisplayItems.length / 3);
  const firstColumn = safeDisplayItems.slice(0, itemsPerColumn);
  const secondColumn = safeDisplayItems.slice(itemsPerColumn, itemsPerColumn * 2);
  const thirdColumn = safeDisplayItems.slice(itemsPerColumn * 2);

  // Show loading state (controlled by parent)
  if (isLoading) {
    return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading {level}s...</p>
        </div>
      </div>
    );
  }

  // Show error state (controlled by parent)
  if (error) {
    return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4 text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  // Show message if no items are available
  if (safeDisplayItems.length === 0) {
     return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4 text-gray-500 dark:text-gray-400">
          No {level}s found for this topic.
        </div>
      </div>
    );
  }


  return (
    <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      {/* First column */}
      <div className={styles.gridColumn}>
        {firstColumn.map((item, index) => (
          <div key={item.id}>
            <div
              className={`${styles.categoryRow} ${selectedItemId === item.id ? styles.selected : ''}`}
              onClick={() => handleItemSelect(item.id)}
              role="button"
              tabIndex={0} // Make it focusable
              onKeyPress={(e) => e.key === 'Enter' && handleItemSelect(item.id)} // Keyboard accessible
            >
              <div className={styles.categoryNumber}>{formatIndex(index)}</div>
              <div className={styles.categoryContent}>
                <div className={styles.categoryLabel}>{item.label}</div>
                <div className={styles.progressBar}>
                  <ProgressBar
                    progress={item.progress?.completionPercentage ?? 0}
                    completed={item.progress?.questionsCompleted ?? 0}
                    total={item.progress?.totalQuestions ?? 0}
                    height="md"
                    showText={false}
                    className={item.label} // Pass the section name as a className
                  />
                  {/* Optional: Debug text to show progress percentage */}
                  {/* <div className="text-xs text-gray-500 mt-1">
                    {item.progress ? `${item.progress.completionPercentage}%` : '0%'}
                  </div> */}
                </div>
              </div>
              <div className={styles.expandIcon}>
                {expandedItemId === item.id ? '−' : '+'} {/* Changed minus sign */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second column */}
      <div className={styles.gridColumn}>
        {secondColumn.map((item, index) => (
          <div key={item.id}>
            <div
              className={`${styles.categoryRow} ${selectedItemId === item.id ? styles.selected : ''}`}
              onClick={() => handleItemSelect(item.id)}
               role="button"
               tabIndex={0}
               onKeyPress={(e) => e.key === 'Enter' && handleItemSelect(item.id)}
            >
              <div className={styles.categoryNumber}>{formatIndex(index + itemsPerColumn)}</div>
              <div className={styles.categoryContent}>
                <div className={styles.categoryLabel}>{item.label}</div>
                <div className={styles.progressBar}>
                  <ProgressBar
                    progress={item.progress?.completionPercentage ?? 0}
                    completed={item.progress?.questionsCompleted ?? 0}
                    total={item.progress?.totalQuestions ?? 0}
                    height="md"
                    showText={false}
                    className={item.label} // Pass the section name as a className
                  />
                   {/* Optional: Debug text */}
                   {/* <div className="text-xs text-gray-500 mt-1">
                    {item.progress ? `${item.progress.completionPercentage}%` : '0%'}
                  </div> */}
                </div>
              </div>
              <div className={styles.expandIcon}>
                {expandedItemId === item.id ? '−' : '+'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Third column */}
      <div className={styles.gridColumn}>
        {thirdColumn.map((item, index) => (
          <div key={item.id}>
            <div
              className={`${styles.categoryRow} ${selectedItemId === item.id ? styles.selected : ''}`}
              onClick={() => handleItemSelect(item.id)}
               role="button"
               tabIndex={0}
               onKeyPress={(e) => e.key === 'Enter' && handleItemSelect(item.id)}
            >
              <div className={styles.categoryNumber}>{formatIndex(index + itemsPerColumn * 2)}</div>
              <div className={styles.categoryContent}>
                <div className={styles.categoryLabel}>{item.label}</div>
                 <div className={styles.progressBar}>
                  <ProgressBar
                    progress={item.progress?.completionPercentage ?? 0}
                    completed={item.progress?.questionsCompleted ?? 0}
                    total={item.progress?.totalQuestions ?? 0}
                    height="md"
                    showText={false}
                    className={item.label} // Pass the section name as a className
                  />
                   {/* Optional: Debug text */}
                   {/* <div className="text-xs text-gray-500 mt-1">
                    {item.progress ? `${item.progress.completionPercentage}%` : '0%'}
                  </div> */}
                </div>
              </div>
              <div className={styles.expandIcon}>
                {expandedItemId === item.id ? '−' : '+'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
