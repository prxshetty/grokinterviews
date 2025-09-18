// Domain configuration with full names
export interface DomainStats {
  sections: number;
  topics: number;
  questions: number;
  difficulty: string;
}

export interface DomainOption {
  id: string;
  label: string;
  description: string;
  color: string;
  gradient: string;
  stats: DomainStats;
  progressColor: string;
}

// Centralized domain configuration
export const DOMAIN_OPTIONS: DomainOption[] = [
  {
    id: 'ai',
    label: 'Artificial Intelligence',
    description: 'AI concepts, algorithms, and applications',
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-purple-600',
    progressColor: '#8B5CF6',
    stats: { sections: 13, topics: 434, questions: 18225, difficulty: 'Advanced' }
  },
  {
    id: 'ml',
    label: 'Machine Learning',
    description: 'ML models, training, and data science',
    color: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
    progressColor: '#3B82F6',
    stats: { sections: 26, topics: 384, questions: 7681, difficulty: 'Intermediate' }
  },
  {
    id: 'sdesign',
    label: 'System Design',
    description: 'Scalable systems, architecture, and design patterns',
    color: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-500 to-green-600',
    progressColor: '#10B981',
    stats: { sections: 11, topics: 461, questions: 11800, difficulty: 'Advanced' }
  },
  {
    id: 'dsa',
    label: 'Data Structures & Algorithms',
    description: 'Core CS concepts, coding problems, and optimization',
    color: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-orange-600',
    progressColor: '#F59E0B',
    stats: { sections: 35, topics: 305, questions: 8575, difficulty: 'Intermediate' }
  },
  {
    id: 'webdev',
    label: 'Web Development',
    description: 'Frontend, backend, and full-stack development',
    color: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-indigo-600',
    progressColor: '#6366F1',
    stats: { sections: 16, topics: 431, questions: 20080, difficulty: 'Beginner' }
  }
];

// Helper function to get full domain name from slug
export const getDomainLabel = (domainId: string): string => {
  const domain = DOMAIN_OPTIONS.find(d => d.id === domainId);
  return domain?.label || domainId.charAt(0).toUpperCase() + domainId.slice(1);
};

// Valid domain IDs for validation
export const VALID_DOMAINS = DOMAIN_OPTIONS.map(d => d.id);

// Map for quick lookup
export const DOMAIN_LABEL_MAP = Object.fromEntries(
  DOMAIN_OPTIONS.map(d => [d.id, d.label])
);