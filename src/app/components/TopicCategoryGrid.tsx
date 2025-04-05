'use client';

import { useState, useEffect } from 'react';
import styles from './TopicCategoryGrid.module.css';

interface TopicCategoryGridProps {
  categories: Array<{ id: string; label: string }>;
  onSelectCategory: (categoryId: string) => void;
}

export default function TopicCategoryGrid({
  categories,
  onSelectCategory
}: TopicCategoryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Format the index number with leading zeros
  const formatIndex = (index: number) => {
    return `${String(index + 1).padStart(2, '0')}`;
  };

  // Split categories into two columns for better layout
  const halfLength = Math.ceil(categories.length / 2);
  const firstColumn = categories.slice(0, halfLength);
  const secondColumn = categories.slice(halfLength);

  return (
    <div className={`${styles.gridContainer} ${isDarkMode ? styles.darkMode : ''}`}>

      {/* First column */}
      <div>
        {firstColumn.map((category, index) => (
          <div key={category.id}>
            <div
              className={`${styles.categoryRow} ${selectedCategory === category.id ? styles.selected : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <div className={styles.categoryNumber}>{formatIndex(index)}</div>
              <div className={styles.categoryLabel}>{category.label}</div>
              <div className={styles.expandIcon}>
                {expandedCategory === category.id ? '×' : '+'}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Second column */}
      <div>
        {secondColumn.map((category, index) => (
          <div key={category.id}>
            <div
              className={`${styles.categoryRow} ${selectedCategory === category.id ? styles.selected : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <div className={styles.categoryNumber}>{formatIndex(index + halfLength)}</div>
              <div className={styles.categoryLabel}>{category.label}</div>
              <div className={styles.expandIcon}>
                {expandedCategory === category.id ? '×' : '+'}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
