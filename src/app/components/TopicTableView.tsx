'use client';

import { useState } from 'react';
import styles from './TopicTableView.module.css';

interface TopicTableViewProps {
  selectedMainTopic: string | null;
  onSelectTopic: (topicId: string) => void;
}

export default function TopicTableView({
  selectedMainTopic,
  onSelectTopic
}: TopicTableViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Handle topic selection
  const handleTopicSelect = (topicId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTopic(topicId);
    onSelectTopic(topicId);

    // Dispatch a custom event to hide the tree
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // Handle close button click
  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // Render a topic row with area and project
  const renderTopicRow = (id: string, areaLabel: string, projectLabel: string) => {
    const isSelected = selectedTopic === id;

    return (
      <div
        className={`${styles.categoryRow} ${isSelected ? styles.selected : ''}`}
        onClick={(e) => handleTopicSelect(id, e)}
      >
        <div className={styles.categoryArea}>
          <div className={styles.arrowContainer}>
            <span>→</span>
          </div>
          <span className={styles.topicLabel}>{areaLabel}</span>
        </div>
        <div className={styles.categoryProject}>
          <span className={styles.topicLabel}>{projectLabel}</span>
        </div>
      </div>
    );
  };

  // Sample data to match the image
  const topicRows = [
    { id: 'exposition', area: 'Exposition', project: 'Spanish Freak Show' },
    { id: 'editorial-branding', area: 'Editorial / Branding', project: 'Azul Magazine' },
    { id: 'branding', area: 'Branding', project: 'Velaz Music' },
    { id: 'typography', area: 'Typography', project: 'Pysoni Numerology' },
    { id: 'event-branding', area: 'Event / Branding', project: 'Oh Holy Festivals!' },
    { id: 'editorial', area: 'Editorial', project: 'Oh Holy Festivals! - Informe' },
    { id: 'exposition-illustration', area: 'Exposition / Illustration', project: 'FastExpo\'17' },
    { id: 'illustration', area: 'Illustration', project: 'Kam_air_sutra' },
    { id: 'art-direction', area: 'Art Direction', project: 'Europe Mode Catalogue' },
    { id: 'inphographics', area: 'Inphographics', project: 'Infografías - Yorokobu Mag' },
    { id: 'typography-illustration', area: 'Typography / Illustration', project: 'Numerografía 79- Yorokobu Mag' },
    { id: 'illustration2', area: 'Illustration', project: 'Chamartin Station Map' },
    { id: 'illustration3', area: 'Illustration', project: 'Plano Festival SOS4.8' },
    { id: 'typography-illustration2', area: 'Typography / Illustration', project: 'Moustachetype - 36DaysofType' },
  ];

  return (
    <div className={styles.tableContainer}>
      <button className={styles.closeButton} onClick={handleClose}>Close</button>
      <div className={styles.tableContent}>
        <div className={styles.categoriesContainer}>
          {/* Header row */}
          <div className={styles.headerRow}>
            <div className={styles.headerCell}>↓ Area</div>
            <div className={styles.headerCell}>↓ Project</div>
          </div>
          
          {/* Topic rows */}
          {topicRows.map((row) => (
            <div key={row.id}>
              {renderTopicRow(row.id, row.area, row.project)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
