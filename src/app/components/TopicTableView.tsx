'use client';

import { useState, useEffect } from 'react';
import styles from './TopicTableView.module.css';

interface TopicTableViewProps {
  selectedMainTopic: string | null;
  onSelectTopic: (topicId: string) => void;
}

interface SectionHeader {
  id: number;
  name: string;
}

export default function TopicTableView({
  selectedMainTopic,
  onSelectTopic
}: TopicTableViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sectionHeaders, setSectionHeaders] = useState<SectionHeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');

  // Fetch section headers from the database when the selected main topic changes
  useEffect(() => {
    const fetchSectionHeaders = async () => {
      if (!selectedMainTopic) return;

      console.log(`TopicTableView - Fetching section headers for domain: ${selectedMainTopic}`);

      try {
        setIsLoading(true);
        setError(null);

        // Fetch section headers for the domain (e.g., 'ml')
        const response = await fetch(`/api/section-headers?domain=${selectedMainTopic}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch section headers: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`TopicTableView - Received ${data.headers?.length || 0} section headers:`, data.headers);
        setSectionHeaders(data.headers || []);
      } catch (err) {
        console.error('Error fetching section headers:', err);
        setError('Failed to load section headers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectionHeaders();
  }, [selectedMainTopic]);

  // Handle topic selection
  const handleTopicSelect = (headerId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTopic(headerId);
    onSelectTopic(headerId);

    // Dispatch a custom event to hide the tree
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // Handle close button click
  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // Filter section headers based on search value
  const filteredHeaders = searchValue.trim() === ''
    ? sectionHeaders
    : sectionHeaders.filter(header =>
        header.name.toLowerCase().includes(searchValue.toLowerCase())
      );

  // Render a section header row
  const renderHeaderRow = (header: SectionHeader) => {
    const isSelected = selectedTopic === `header-${header.id}`;

    return (
      <div
        className={`${styles.categoryRow} ${isSelected ? styles.selected : ''}`}
        onClick={(e) => handleTopicSelect(`header-${header.id}`, e)}
      >
        <div className={styles.categoryArea}>
          <div className={styles.arrowContainer}>
            <span>→</span>
          </div>
          <span className={styles.topicLabel}>{header.name}</span>
        </div>
        <div className={styles.categoryProject}>
          <span className={styles.topicLabel}>View Content</span>
        </div>
      </div>
    );
  };

  // Log when the component renders
  console.log(`TopicTableView - Rendering with selectedMainTopic: ${selectedMainTopic}`);

  return (
    <div className={styles.tableContainer}>
      <button className={styles.closeButton} onClick={handleClose}>Close</button>
      <div className={styles.tableContent}>
        {/* Search input */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search section headers..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className={styles.categoriesContainer}>
          {/* Header row */}
          <div className={styles.headerRow}>
            <div className={styles.headerCell}>↓ Topic</div>
            <div className={styles.headerCell}>↓ Action</div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className={styles.messageContainer}>
              <p>Loading section headers...</p>
            </div>
          ) : error ? (
            <div className={styles.messageContainer}>
              <p className={styles.errorText}>{error}</p>
            </div>
          ) : filteredHeaders.length === 0 ? (
            <div className={styles.messageContainer}>
              <p>
                {searchValue.trim() !== ''
                  ? 'No matching section headers found.'
                  : 'No section headers available for this topic.'}
              </p>
            </div>
          ) : (
            /* Section header rows */
            filteredHeaders.map((header) => (
              <div key={header.id}>
                {renderHeaderRow(header)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
