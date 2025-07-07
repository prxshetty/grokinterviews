export const DOMAIN_COLORS = {
  'summary': {
    color: 'text-pink-600 dark:text-pink-400',
    gradient: 'from-pink-500 to-purple-600',
    progressColor: '#EC4899'
  },
  'ai': {
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-purple-600',
    progressColor: '#8B5CF6'
  },
  'ml': {
    color: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
    progressColor: '#3B82F6'
  },
  'sdesign': {
    color: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-500 to-green-600',
    progressColor: '#10B981'
  },
  'dsa': {
    color: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-orange-600',
    progressColor: '#F59E0B'
  },
  'webdev': {
    color: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-indigo-600',
    progressColor: '#6366F1'
  }
} as const

export const getDomainColor = (domainId: keyof typeof DOMAIN_COLORS) => {
  return DOMAIN_COLORS[domainId] || DOMAIN_COLORS.webdev // default fallback
}

export const getDomainId = (domainName: string): keyof typeof DOMAIN_COLORS => {
  const mapping: { [key: string]: keyof typeof DOMAIN_COLORS } = {
    'Artificial Intelligence': 'ai',
    'Machine Learning': 'ml',
    'System Design': 'sdesign',
    'Data Structures': 'dsa',
    'Web Development': 'webdev'
  }
  return mapping[domainName] || 'webdev'
} 