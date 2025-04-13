'use client';

import { useState, useEffect } from 'react';
import styles from './TopicCategoryGrid.module.css';

// Define the structure for items to be displayed
interface DisplayItem {
  id: string;
  label: string;
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
  isLoading = false, // Default to not loading
  error = null      // Default to no error
}: TopicCategoryGridProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Use the items passed via props, with fallback to categories for backward compatibility
  let displayItems = items || categories || [];

  // Optional: Reverse order if needed (e.g., for sections) - parent should handle this if necessary
  // Example (could be controlled by a prop):
  // if (level === 'section') {
  //   displayItems = [...displayItems].reverse();
  // }

  console.log(`TopicCategoryGrid - Rendering level: ${level}`);
  console.log(`TopicCategoryGrid - Display items:`, displayItems);
  console.log(`TopicCategoryGrid - Topic ID:`, topicId);

  // Check if displayItems is defined and has a length property before using it
  if (!displayItems || !Array.isArray(displayItems)) {
    console.error('TopicCategoryGrid - displayItems is not an array:', displayItems);
    displayItems = [];
  }

  // Split items into three columns for better layout
  const itemsPerColumn = Math.ceil(displayItems.length / 3);
  const firstColumn = displayItems.slice(0, itemsPerColumn);
  const secondColumn = displayItems.slice(itemsPerColumn, itemsPerColumn * 2);
  const thirdColumn = displayItems.slice(itemsPerColumn * 2);

  // Show loading state (controlled by parent)
  if (isLoading) {
    return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading {level}s...</p>
        </div>
      </div>
    );
  }

  // Show error state (controlled by parent)
  if (error) {
    return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  // Show message if no items are available
  if (!displayItems || displayItems.length === 0) {
     return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4 text-gray-500">
          No {level}s found.
        </div>
      </div>
    );
  }


  return (
    <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      {/* First column */}
      <div>
        {firstColumn.map((item, index) => (
          <div key={item.id}>
            <div
              className={`${styles.categoryRow} ${selectedItemId === item.id ? styles.selected : ''}`}
              onClick={() => handleItemSelect(item.id)}
            >
              <div className={styles.categoryNumber}>{formatIndex(index)}</div>
              <div className={styles.categoryLabel}>{item.label}</div>
              <div className={styles.expandIcon}>
                {expandedItemId === item.id ? '×' : '+'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second column */}
      <div>
        {secondColumn.map((item, index) => (
          <div key={item.id}>
            <div
              className={`${styles.categoryRow} ${selectedItemId === item.id ? styles.selected : ''}`}
              onClick={() => handleItemSelect(item.id)}
            >
              <div className={styles.categoryNumber}>{formatIndex(index + itemsPerColumn)}</div>
              <div className={styles.categoryLabel}>{item.label}</div>
              <div className={styles.expandIcon}>
                {expandedItemId === item.id ? '×' : '+'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Third column */}
      <div>
        {thirdColumn.map((item, index) => (
          <div key={item.id}>
            <div
              className={`${styles.categoryRow} ${selectedItemId === item.id ? styles.selected : ''}`}
              onClick={() => handleItemSelect(item.id)}
            >
              <div className={styles.categoryNumber}>{formatIndex(index + itemsPerColumn * 2)}</div>
              <div className={styles.categoryLabel}>{item.label}</div>
              <div className={styles.expandIcon}>
                {expandedItemId === item.id ? '×' : '+'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
