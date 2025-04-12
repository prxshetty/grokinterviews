'use client';

import { useState, useEffect } from 'react';
import styles from './TopicCategoryGrid.module.css';

interface TopicCategoryGridProps {
  categories: Array<{ id: string; label: string }>;
  onSelectCategory: (categoryId: string) => void;
  topicId?: string; // Add topicId prop to fetch section headers
}

interface SectionHeader {
  id: number;
  name: string;
}

export default function TopicCategoryGrid({
  categories,
  onSelectCategory,
  topicId
}: TopicCategoryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sectionHeaders, setSectionHeaders] = useState<SectionHeader[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [useHeaders, setUseHeaders] = useState(false);

  // Check for dark mode on mount and when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    // Check on mount
    checkDarkMode();

    // Set up a MutationObserver to watch for class changes on the html element
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

  // Fetch section headers when topicId changes
  useEffect(() => {
    const fetchSectionHeaders = async () => {
      if (!topicId) return;

      try {
        setIsLoadingHeaders(true);
        setHeaderError(null);

        console.log(`TopicCategoryGrid - Fetching section headers for domain: ${topicId}`);

        // Fetch section headers for the domain (e.g., 'ml')
        const response = await fetch(`/api/section-headers?domain=${topicId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch section headers: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`TopicCategoryGrid - Received ${data.headers?.length || 0} section headers:`, data.headers);

        if (data.headers && data.headers.length > 0) {
          setSectionHeaders(data.headers);
          setUseHeaders(true);
        } else {
          // If no section headers, fall back to categories
          setUseHeaders(false);
        }
      } catch (err) {
        console.error('Error fetching section headers:', err);
        setHeaderError('Failed to load section headers');
        setUseHeaders(false);
      } finally {
        setIsLoadingHeaders(false);
      }
    };

    fetchSectionHeaders();
  }, [topicId]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onSelectCategory(categoryId);

    // Toggle expanded state
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  // Handle section header selection
  const handleHeaderSelect = (headerId: number) => {
    const headerIdStr = `header-${headerId}`;
    setSelectedCategory(headerIdStr);
    onSelectCategory(headerIdStr);

    // Toggle expanded state
    if (expandedCategory === headerIdStr) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(headerIdStr);
    }
  };

  // Format the index number with leading zeros
  const formatIndex = (index: number) => {
    return `${String(index + 1).padStart(2, '0')}`;
  };

  // Determine which data to use
  const displayItems = useHeaders ?
    sectionHeaders.map(header => ({ id: `header-${header.id}`, label: header.name })) :
    categories;

  console.log(`TopicCategoryGrid - Using ${useHeaders ? 'section headers' : 'categories'} for display`);
  console.log(`TopicCategoryGrid - Display items:`, displayItems);

  // Split items into three columns for better layout
  const itemsPerColumn = Math.ceil(displayItems.length / 3);
  const firstColumn = displayItems.slice(0, itemsPerColumn);
  const secondColumn = displayItems.slice(itemsPerColumn, itemsPerColumn * 2);
  const thirdColumn = displayItems.slice(itemsPerColumn * 2);

  // Show loading state
  if (isLoadingHeaders) {
    return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 border-r-2 border-gray-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading topics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (headerError && useHeaders) {
    return (
      <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>
        <div className="col-span-3 text-center py-4 text-red-500">
          {headerError}
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
              className={`${styles.categoryRow} ${selectedCategory === item.id ? styles.selected : ''}`}
              onClick={() => useHeaders ?
                handleHeaderSelect(parseInt(item.id.replace('header-', ''))) :
                handleCategorySelect(item.id)
              }
            >
              <div className={styles.categoryNumber}>{formatIndex(index)}</div>
              <div className={styles.categoryLabel}>{item.label}</div>
              <div className={styles.expandIcon}>
                {expandedCategory === item.id ? '×' : '+'}
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
              className={`${styles.categoryRow} ${selectedCategory === item.id ? styles.selected : ''}`}
              onClick={() => useHeaders ?
                handleHeaderSelect(parseInt(item.id.replace('header-', ''))) :
                handleCategorySelect(item.id)
              }
            >
              <div className={styles.categoryNumber}>{formatIndex(index + itemsPerColumn)}</div>
              <div className={styles.categoryLabel}>{item.label}</div>
              <div className={styles.expandIcon}>
                {expandedCategory === item.id ? '×' : '+'}
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
              className={`${styles.categoryRow} ${selectedCategory === item.id ? styles.selected : ''}`}
              onClick={() => useHeaders ?
                handleHeaderSelect(parseInt(item.id.replace('header-', ''))) :
                handleCategorySelect(item.id)
              }
            >
              <div className={styles.categoryNumber}>{formatIndex(index + itemsPerColumn * 2)}</div>
              <div className={styles.categoryLabel}>{item.label}</div>
              <div className={styles.expandIcon}>
                {expandedCategory === item.id ? '×' : '+'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
