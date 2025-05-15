/**
 * Returns domain-specific keywords with occurrence counts
 * @param domain The domain to get keywords for
 * @param page Optional page number for pagination
 * @param pageSize Optional page size for pagination
 * @returns An array of objects with keyword and occurrence_count properties
 */
export function getDomainKeywords(
  domain: string | null,
  page: number = 1,
  pageSize: number = 10
): { keyword: string; occurrence_count: number }[] {
  if (!domain) return [];
  
  // Define all domain keywords with occurrence counts
  const keywordsByDomain: Record<string, { keyword: string; occurrence_count: number }[]> = {
    'ai': [
      { keyword: 'trade-offs', occurrence_count: 791 },
      { keyword: 'scalability', occurrence_count: 729 },
      { keyword: 'limitations', occurrence_count: 482 },
      { keyword: 'generalization', occurrence_count: 458 },
      { keyword: 'optimization', occurrence_count: 443 },
      { keyword: 'computational efficiency', occurrence_count: 412 },
      { keyword: 'knowledge representation', occurrence_count: 360 },
      { keyword: 'computational complexity', occurrence_count: 358 },
      { keyword: 'reinforcement learning', occurrence_count: 355 },
      { keyword: 'machine learning', occurrence_count: 354 }
    ],
    'dsa': [
      { keyword: 'time complexity', occurrence_count: 1634 },
      { keyword: 'space complexity', occurrence_count: 718 },
      { keyword: 'trade-offs', occurrence_count: 383 },
      { keyword: 'efficiency', occurrence_count: 271 },
      { keyword: 'dynamic programming', occurrence_count: 258 },
      { keyword: 'optimization', occurrence_count: 254 },
      { keyword: 'stack', occurrence_count: 192 },
      { keyword: 'memoization', occurrence_count: 181 },
      { keyword: 'binary search', occurrence_count: 167 },
      { keyword: 'optimal substructure', occurrence_count: 167 }
    ],
    'ml': [
      { keyword: 'optimization', occurrence_count: 435 },
      { keyword: 'overfitting', occurrence_count: 351 },
      { keyword: 'time series', occurrence_count: 284 },
      { keyword: 'implementation', occurrence_count: 194 },
      { keyword: 'cross-validation', occurrence_count: 192 },
      { keyword: 'feature selection', occurrence_count: 185 },
      { keyword: 'hyperparameter tuning', occurrence_count: 185 },
      { keyword: 'regularization', occurrence_count: 183 },
      { keyword: 'dimensionality reduction', occurrence_count: 173 },
      { keyword: 'gradient descent', occurrence_count: 168 }
    ],
    'sdesign': [
      { keyword: 'trade-offs', occurrence_count: 830 },
      { keyword: 'scalability', occurrence_count: 720 },
      { keyword: 'latency', occurrence_count: 624 },
      { keyword: 'microservices', occurrence_count: 525 },
      { keyword: 'distributed systems', occurrence_count: 515 },
      { keyword: 'consistency', occurrence_count: 357 },
      { keyword: 'performance', occurrence_count: 330 },
      { keyword: 'fault tolerance', occurrence_count: 307 },
      { keyword: 'eventual consistency', occurrence_count: 272 },
      { keyword: 'throughput', occurrence_count: 268 }
    ],
    'webdev': [
      { keyword: 'performance', occurrence_count: 473 },
      { keyword: 'scalability', occurrence_count: 345 },
      { keyword: 'trade-offs', occurrence_count: 336 },
      { keyword: 'security', occurrence_count: 264 },
      { keyword: 'performance optimization', occurrence_count: 258 },
      { keyword: 'time complexity', occurrence_count: 204 },
      { keyword: 'authentication', occurrence_count: 157 },
      { keyword: 'maintainability', occurrence_count: 154 },
      { keyword: 'user experience', occurrence_count: 153 },
      { keyword: 'microservices', occurrence_count: 149 }
    ]
  };

  // Get keywords for the specified domain
  const domainKeywords = keywordsByDomain[domain] || [];
  
  // If pagination is not needed, return all keywords
  if (pageSize <= 0) {
    return domainKeywords;
  }
  
  // Calculate start and end indices for pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Return paginated keywords
  return domainKeywords.slice(startIndex, endIndex);
}

/**
 * Returns the total count of keywords for a domain
 * @param domain The domain to get the keyword count for
 * @returns The total number of keywords for the domain
 */
export function getDomainKeywordCount(domain: string | null): number {
  if (!domain) return 0;
  
  const keywordCounts: Record<string, number> = {
    'ai': 5,
    'dsa': 5,
    'ml': 5,
    'sdesign': 5,
    'webdev': 5
  };
  
  return keywordCounts[domain] || 0;
} 