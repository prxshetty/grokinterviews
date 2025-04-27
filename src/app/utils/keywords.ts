/**
 * Returns domain-specific keywords
 */
export function getDomainKeywords(domain: string | null): string[] {
  if (!domain) return [];
  
  switch (domain) {
    case 'ml':
      return [
        'bias-variance',
        'regularization',
        'overfitting',
        'feature-selection',
        'cross-validation',
        'hyperparameters',
        'evaluation-metrics',
        'supervised',
        'unsupervised',
        'clustering',
        'classification',
        'regression',
        'neural-networks'
      ];
    case 'ai':
      return [
        'reasoning',
        'knowledge-representation',
        'nlp',
        'computer-vision',
        'planning',
        'expert-systems',
        'robotics',
        'deep-learning',
        'reinforcement-learning',
        'ethics',
        'search-algorithms'
      ];
    case 'webdev':
      return [
        'frontend',
        'backend',
        'responsive',
        'frameworks',
        'libraries',
        'api',
        'security',
        'performance',
        'accessibility',
        'seo',
        'testing',
        'deployment'
      ];
    case 'sdesign':
      return [
        'scalability',
        'availability',
        'reliability',
        'consistency',
        'microservices',
        'distributed-systems',
        'caching',
        'databases',
        'load-balancing',
        'api-design',
        'security',
        'performance'
      ];
    case 'dsa':
      return [
        'arrays',
        'linked-lists',
        'stacks',
        'queues',
        'trees',
        'graphs',
        'sorting',
        'searching',
        'dynamic-programming',
        'recursion',
        'backtracking',
        'greedy-algorithms',
        'complexity'
      ];
    default:
      return [];
  }
} 