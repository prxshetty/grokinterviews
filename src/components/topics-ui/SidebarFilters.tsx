'use client';

import FloatingSettings from './FloatingSettings';

interface SidebarFiltersProps {
  selectedTopic: string | null;
  selectedDifficulty: string | null;
  onSelectDifficulty: (difficulty: string) => void;
}

export default function SidebarFilters({
  selectedTopic,
  selectedDifficulty,
  onSelectDifficulty,
}: SidebarFiltersProps) {
  if (!selectedTopic) {
    return null;
  }

  return (
    <FloatingSettings
      selectedDifficulty={selectedDifficulty}
      onSelectDifficulty={onSelectDifficulty}
    />
  );
} 