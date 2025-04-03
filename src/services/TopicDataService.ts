/**
 * TopicDataService.ts
 * Client-side service for loading and managing topic data
 */

import { TopicItem } from '@/utils/markdownParser';

export type TopicTree = {
  [key: string]: {
    label: string;
    subtopics: Record<string, TopicItem>;
  };
};

type CategoryItem = {
  id: string;
  label: string;
};

class TopicDataService {
  private cache: {
    topics: TopicTree | null;
    categories: Record<string, CategoryItem[]> | null;
    categoryDetails: Record<string, any>;
  } = {
    topics: null,
    categories: null,
    categoryDetails: {}
  };

  /**
   * Gets all main categories from a specific topic file
   * @param topicId The ID of the topic to get categories from
   */
  async getTopicCategories(topicId: string): Promise<CategoryItem[]> {
    try {
      // Check cache first
      if (this.cache.categories && this.cache.categories[topicId]) {
        return this.cache.categories[topicId];
      }
      
      // Fetch categories from API
      const response = await fetch('/api/topics/categories');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch topic categories: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.cache.categories = data;
      
      return data[topicId] || [];
    } catch (error) {
      console.error('Error fetching topic categories:', error);
      return [];
    }
  }

  /**
   * Gets detailed information for a specific category within a topic
   * @param topicId The ID of the topic
   * @param categoryId The ID of the category to fetch details for
   */
  async getCategoryDetails(topicId: string, categoryId: string): Promise<any> {
    try {
      // Check cache first
      const cacheKey = `${topicId}:${categoryId}`;
      if (this.cache.categoryDetails[cacheKey]) {
        console.log(`Using cached data for ${topicId}:${categoryId}`);
        return this.cache.categoryDetails[cacheKey];
      }

      console.log(`Fetching category details for ${topicId}:${categoryId}`);
      
      // Log the normalized categoryId for better debugging
      const normalizedCategoryId = categoryId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      console.log(`Normalized categoryId: ${normalizedCategoryId}`);
      
      // Fetch from API
      const response = await fetch(`/api/topics/categories?categoryId=${categoryId}&topicId=${topicId}`);
      
      if (!response.ok) {
        console.error(`API error for ${topicId}:${categoryId} - ${response.status} ${response.statusText}`);
        
        // Log additional debugging info
        if (response.status === 404) {
          console.log(`Category ${categoryId} not found in topic ${topicId}, trying fallbacks...`);
        }
        
        // Don't throw right away - try to use a fallback
        
        // Fallback 1: Try to get this category from the main topic data if available
        if (this.cache.topics && this.cache.topics[topicId]) {
          console.log(`Attempting fallback from cached topic data for ${categoryId}`);
          const topicData = this.cache.topics[topicId];
          
          // Look for the category in the subtopics
          if (topicData.subtopics) {
            console.log(`Available subtopics: ${Object.keys(topicData.subtopics).join(', ')}`);
            
            // Try exact match first
            if (topicData.subtopics[categoryId]) {
              console.log(`Found exact fallback match for ${categoryId}`);
              const result = topicData.subtopics[categoryId];
              this.cache.categoryDetails[cacheKey] = result;
              return result;
            }
            
            // Try partial match
            for (const key in topicData.subtopics) {
              if (key.includes(categoryId) || categoryId.includes(key)) {
                console.log(`Found partial fallback match: ${key} for ${categoryId}`);
                const result = topicData.subtopics[key];
                this.cache.categoryDetails[cacheKey] = result;
                return result;
              }
            }
            
            // Try matching by parts
            const categoryParts = categoryId.split('-');
            for (const key in topicData.subtopics) {
              const keyParts = key.split('-');
              let matchingParts = 0;
              for (const part of categoryParts) {
                if (keyParts.includes(part)) {
                  matchingParts++;
                }
              }
              
              if (matchingParts >= Math.min(2, categoryParts.length / 2)) {
                console.log(`Found part-matching fallback: ${key} for ${categoryId} (${matchingParts} matching parts)`);
                const result = topicData.subtopics[key];
                this.cache.categoryDetails[cacheKey] = result;
                return result;
              }
            }
            
            // Try a fuzzy search based on the category label
            const categories = await this.getTopicCategories(topicId);
            const targetCategory = categories.find(cat => cat.id === categoryId);
            
            if (targetCategory) {
              const targetLabel = targetCategory.label.toLowerCase();
              for (const key in topicData.subtopics) {
                const subtopic = topicData.subtopics[key];
                if (subtopic.label.toLowerCase().includes(targetLabel) || 
                    targetLabel.includes(subtopic.label.toLowerCase())) {
                  console.log(`Found label-matching fallback: ${subtopic.label} for ${targetCategory.label}`);
                  this.cache.categoryDetails[cacheKey] = subtopic;
                  return subtopic;
                }
              }
            }
          }
        }
        
        // Special case for known problematic categories
        if (categoryId === 'data-preprocessing-and-exploration') {
          console.log('Applying special case logic for data-preprocessing-and-exploration');
          
          // Try loading the entire topic again via the API to force a fresh fetch
          try {
            const fullTopicResponse = await fetch(`/api/topics/${topicId}`);
            if (fullTopicResponse.ok) {
              const fullTopicData = await fullTopicResponse.json();
              
              if (fullTopicData[topicId] && fullTopicData[topicId].subtopics) {
                // Find any subtopic that contains "data preprocessing" in the label
                for (const key in fullTopicData[topicId].subtopics) {
                  const subtopic = fullTopicData[topicId].subtopics[key];
                  if (subtopic.label.toLowerCase().includes('data preprocessing')) {
                    console.log(`Found special-case match: ${subtopic.label}`);
                    this.cache.categoryDetails[cacheKey] = subtopic;
                    return subtopic;
                  }
                }
              }
            }
          } catch (specialError) {
            console.error('Special case handling failed:', specialError);
          }
        }
        
        // Special case for naive-bayes
        if (categoryId === 'naive-bayes') {
          console.log('Applying special case logic for naive-bayes');
          
          try {
            // Try loading the entire topic data to look for Naive Bayes
            const fullTopicData = await this.getTopicData(topicId);
            
            if (fullTopicData && fullTopicData[topicId]?.subtopics) {
              // First look for a main section called "Naive Bayes"
              for (const key in fullTopicData[topicId].subtopics) {
                const subtopic = fullTopicData[topicId].subtopics[key];
                if (subtopic.label.toLowerCase().includes('naive bayes')) {
                  console.log(`Found Naive Bayes section: ${subtopic.label}`);
                  this.cache.categoryDetails[cacheKey] = subtopic;
                  return subtopic;
                }
              }
              
              // Then look in Supervised Learning section for Classification which might contain Naive Bayes
              for (const key in fullTopicData[topicId].subtopics) {
                const subtopic = fullTopicData[topicId].subtopics[key];
                
                if (subtopic.label.toLowerCase().includes('supervised learning') && subtopic.subtopics) {
                  // Look for Classification Techniques
                  for (const classKey in subtopic.subtopics) {
                    const classSubtopic = subtopic.subtopics[classKey];
                    
                    if (classSubtopic.label.toLowerCase().includes('classification') && classSubtopic.subtopics) {
                      // Look for Naive Bayes in Classification
                      for (const bulletKey in classSubtopic.subtopics) {
                        const bulletItem = classSubtopic.subtopics[bulletKey];
                        
                        if (bulletItem.label.toLowerCase().includes('naive bayes')) {
                          console.log(`Found Naive Bayes in Classification: ${bulletItem.label}`);
                          // Return the entire Classification section which contains Naive Bayes
                          this.cache.categoryDetails[cacheKey] = classSubtopic;
                          return classSubtopic;
                        }
                      }
                    }
                  }
                }
              }
              
              // Last resort - try to find any mention of Naive Bayes anywhere in the topic
              const findNaiveBayes = (node: TopicItem): TopicItem | null => {
                if (node.label && node.label.toLowerCase().includes('naive bayes')) {
                  return node;
                }
                
                if (node.subtopics) {
                  for (const key in node.subtopics) {
                    const result: TopicItem | null = findNaiveBayes(node.subtopics[key]);
                    if (result) return result;
                  }
                }
                
                return null;
              };
              
              const naiveBayesNode = findNaiveBayes(fullTopicData[topicId]);
              if (naiveBayesNode) {
                console.log(`Found Naive Bayes mention somewhere in the topic: ${naiveBayesNode.label}`);
                this.cache.categoryDetails[cacheKey] = naiveBayesNode;
                return naiveBayesNode;
              }
            }
          } catch (specialError) {
            console.error('Naive Bayes special case handling failed:', specialError);
          }
        }
        
        // If we get here, no fallback worked - throw the original error
        throw new Error(`Failed to fetch category details: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update cache if we got valid data
      if (data && !data.error) {
        this.cache.categoryDetails[cacheKey] = data;
      }
      
      return data;
    } catch (error) {
      console.error(`Error loading details for category ${categoryId} in topic ${topicId}:`, error);
      
      // Try one more fallback - load the entire topic data and extract this category
      try {
        console.log(`Attempting to load full topic data for ${topicId} as final fallback`);
        const fullData = await this.getTopicData(topicId);
        if (fullData && fullData[topicId] && fullData[topicId].subtopics) {
          const subtopics = fullData[topicId].subtopics;
          
          // Try to find a matching subtopic
          for (const key in subtopics) {
            const simplifiedKey = key.toLowerCase().replace(/[^a-z0-9-]/g, '');
            const simplifiedCategoryId = categoryId.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            if (simplifiedKey.includes(simplifiedCategoryId) || 
                simplifiedCategoryId.includes(simplifiedKey)) {
              console.log(`Found matching subtopic ${key} for ${categoryId} in fallback`);
              return subtopics[key];
            }
          }
          
          // Special case for data preprocessing
          if (categoryId === 'data-preprocessing-and-exploration' || 
              categoryId.includes('preprocessing')) {
            for (const key in subtopics) {
              if (subtopics[key].label.toLowerCase().includes('data preprocessing')) {
                console.log(`Found data preprocessing subtopic via special case`);
                return subtopics[key];
              }
            }
          }
        }
      } catch (fallbackError) {
        console.error('Fallback attempt also failed:', fallbackError);
      }
      
      return null;
    }
  }

  /**
   * Gets topic data for a specific topic
   * @param topicId The ID of the topic to load
   */
  async getTopicData(topicId: string): Promise<TopicTree | null> {
    try {
      // Try to get from cache first
      if (this.cache.topics && this.cache.topics[topicId]) {
        return { [topicId]: this.cache.topics[topicId] };
      }
      
      // Fetch from API
      const response = await fetch(`/api/topics/${topicId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch topic data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update cache
      if (!this.cache.topics) {
        this.cache.topics = {};
      }
      this.cache.topics[topicId] = data[topicId];
      
      return data;
    } catch (error) {
      console.error(`Error loading topic data for ${topicId}:`, error);
      return null;
    }
  }

  /**
   * Gets all available topic data
   */
  async getAllTopicData(): Promise<TopicTree> {
    try {
      // Try to get from cache first
      if (this.cache.topics) {
        return this.cache.topics;
      }
      
      // Fetch from API
      const response = await fetch('/api/topics');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch all topic data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update cache
      this.cache.topics = data;
      
      return data;
    } catch (error) {
      console.error('Error loading all topic data:', error);
      return {};
    }
  }
  
  /**
   * Clears the cache
   */
  clearCache() {
    this.cache = {
      topics: null,
      categories: null,
      categoryDetails: {}
    };
  }
}

export default new TopicDataService(); 