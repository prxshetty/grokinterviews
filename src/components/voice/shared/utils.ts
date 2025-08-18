// Utility functions for formatting durations and score colors

export const getScoreColor = (score: number, includeDarkMode: boolean = false) => {
  const baseColors = {
    high: includeDarkMode ? 'text-green-600 dark:text-green-400' : 'text-green-600',
    medium: includeDarkMode ? 'text-yellow-600 dark:text-yellow-400' : 'text-yellow-600',
    low: includeDarkMode ? 'text-red-600 dark:text-red-400' : 'text-red-600'
  };
  
  if (score >= 8) return baseColors.high;
  if (score >= 6) return baseColors.medium;
  return baseColors.low;
};

export const formatWebDuration = (start: string, end: string | null) => {
  if (!end) return 'Incomplete';
  const duration = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${duration} min`;
};

export const formatPhoneDuration = (duration: number) => {
  if (!duration) return '0 min';
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};