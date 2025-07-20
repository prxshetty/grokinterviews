export const getSessionTypeColor = (type: string) => {
  switch (type) {
    case 'behavioral':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'technical':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'general':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
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

export const getCallStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'ended':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'in-progress':
    case 'ringing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getInterviewModeIcon = (mode: 'web' | 'phone') => {
  return mode === 'web' ? '💻' : '📞';
};