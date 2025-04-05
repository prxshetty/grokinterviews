/**
 * TopicDataService.ts
 * Client-side service for loading and managing topic data
 */

import { TopicItem } from '@/utils/markdownParser';
import DatabaseService from '@/services/DatabaseService';
import { Topic, Category, Question } from '@/types/database';

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

      // Try to get categories directly from the database first
      try {
        const categories = await DatabaseService.getCategoriesByTopic(topicId);

        // Convert database categories to the format expected by the UI
        const formattedCategories = categories.map(category => ({
          id: category.slug,
          label: category.name
        }));

        // Update cache
        if (!this.cache.categories) {
          this.cache.categories = {};
        }
        this.cache.categories[topicId] = formattedCategories;

        return formattedCategories;
      } catch (dbError) {
        console.error('Error fetching categories from database:', dbError);
        // Fall back to API if database fails
      }

      // Fetch categories from API as fallback
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

      // We need both the database questions and the markdown content
      let dbCategoryData: any = null;
      let markdownCategoryData: any = null;

      // 1. Try to get category with questions from the database first
      try {
        const categoryWithQuestions = await DatabaseService.getCategoryWithQuestions(categoryId);

        if (categoryWithQuestions && categoryWithQuestions.questions && categoryWithQuestions.questions.length > 0) {
          console.log(`Found category ${categoryId} with ${categoryWithQuestions.questions.length} questions in database`);

          // Convert to the format expected by the UI
          dbCategoryData = {
            label: categoryWithQuestions.name,
            subtopics: {}
          };

          // Add each question as a subtopic
          categoryWithQuestions.questions.forEach((question, index) => {
            const questionId = `question-${question.id}`;
            dbCategoryData.subtopics[questionId] = {
              id: questionId,
              label: question.question_text,
              content: question.answer_text || '',
              difficulty: question.difficulty,
              keywords: question.keywords
            };
          });
        }
      } catch (dbError) {
        console.error('Error fetching category details from database:', dbError);
      }

      // 2. Fetch from API to get markdown content
      try {
        // Log the normalized categoryId for better debugging
        const normalizedCategoryId = categoryId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        console.log(`Normalized categoryId: ${normalizedCategoryId}`);

        const response = await fetch(`/api/topics/categories?categoryId=${categoryId}&topicId=${topicId}`);

        if (response.ok) {
          markdownCategoryData = await response.json();
        }
      } catch (apiError) {
        console.error('Error fetching category details from API:', apiError);
      }

      // 3. Merge the data sources
      let mergedCategoryData: any = null;

      if (dbCategoryData && markdownCategoryData) {
        // We have both data sources, merge them
        mergedCategoryData = {
          label: dbCategoryData.label,
          subtopics: { ...dbCategoryData.subtopics }
        };

        // Add content from markdown if available
        if (markdownCategoryData.content) {
          mergedCategoryData.content = markdownCategoryData.content;
        }

        // Add subtopics from markdown that aren't questions
        if (markdownCategoryData.subtopics) {
          for (const key in markdownCategoryData.subtopics) {
            // Skip if it's already a question from the database
            if (!key.startsWith('question-')) {
              mergedCategoryData.subtopics[key] = markdownCategoryData.subtopics[key];
            }
          }
        }
      } else if (dbCategoryData) {
        // Only have database data
        mergedCategoryData = dbCategoryData;
      } else if (markdownCategoryData) {
        // Only have markdown data
        mergedCategoryData = markdownCategoryData;
      }

      // If we have merged data, update cache and return
      if (mergedCategoryData) {
        this.cache.categoryDetails[cacheKey] = mergedCategoryData;
        return mergedCategoryData;
      }

      // If we get here, we need to try fallbacks

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
    } catch (error) {
      console.error(`Error loading details for category ${categoryId} in topic ${topicId}:`, error);
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

      // We need both the database structure and the markdown content
      let dbTopicData: any = null;
      let markdownTopicData: any = null;

      // 1. Try to get from database first
      try {
        const topicWithCategories = await DatabaseService.getTopicWithCategories(topicId);

        if (topicWithCategories) {
          // Convert to the format expected by the UI
          dbTopicData = {
            label: topicWithCategories.name,
            subtopics: {}
          };

          // Add categories as subtopics
          if (topicWithCategories.categories) {
            for (const category of topicWithCategories.categories) {
              dbTopicData.subtopics[category.slug] = {
                id: category.slug,
                label: category.name,
                subtopics: {}
              };
            }
          }
        }
      } catch (dbError) {
        console.error(`Error fetching topic data from database for ${topicId}:`, dbError);
      }

      // 2. Fetch from API to get markdown content
      try {
        const response = await fetch(`/api/topics/${topicId}`);

        if (response.ok) {
          const data = await response.json();
          markdownTopicData = data[topicId];
        }
      } catch (apiError) {
        console.error(`Error fetching topic data from API for ${topicId}:`, apiError);
      }

      // 3. Merge the data sources
      let mergedTopicData: any = null;

      if (dbTopicData && markdownTopicData) {
        // We have both data sources, merge them
        mergedTopicData = {
          label: dbTopicData.label,
          subtopics: {}
        };

        // First add all database categories
        for (const categorySlug in dbTopicData.subtopics) {
          mergedTopicData.subtopics[categorySlug] = {
            ...dbTopicData.subtopics[categorySlug],
            subtopics: {}
          };
        }

        // Then add content from markdown
        for (const subtopicKey in markdownTopicData.subtopics) {
          const markdownSubtopic = markdownTopicData.subtopics[subtopicKey];

          // Find matching category in database by label or ID
          let matchingCategorySlug = subtopicKey;
          for (const categorySlug in mergedTopicData.subtopics) {
            const dbCategory = mergedTopicData.subtopics[categorySlug];

            // Match by label (case insensitive)
            if (dbCategory.label.toLowerCase() === markdownSubtopic.label.toLowerCase()) {
              matchingCategorySlug = categorySlug;
              break;
            }
          }

          // If we found a match, add the markdown content to it
          if (mergedTopicData.subtopics[matchingCategorySlug]) {
            // Keep the database ID and label, but add the markdown subtopics
            mergedTopicData.subtopics[matchingCategorySlug].subtopics =
              markdownSubtopic.subtopics || {};

            // If markdown has content, add it
            if (markdownSubtopic.content) {
              mergedTopicData.subtopics[matchingCategorySlug].content =
                markdownSubtopic.content;
            }
          } else {
            // No matching category in database, add the markdown subtopic as is
            mergedTopicData.subtopics[subtopicKey] = markdownSubtopic;
          }
        }
      } else if (dbTopicData) {
        // Only have database data
        mergedTopicData = dbTopicData;
      } else if (markdownTopicData) {
        // Only have markdown data
        mergedTopicData = markdownTopicData;
      } else {
        // No data available
        throw new Error(`No data available for topic ${topicId}`);
      }

      // Update cache
      if (!this.cache.topics) {
        this.cache.topics = {};
      }
      this.cache.topics[topicId] = mergedTopicData;

      return { [topicId]: mergedTopicData };
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

      // We need both the database structure and the markdown content
      let dbTopics: Topic[] = [];
      let markdownTopicData: TopicTree = {};

      // 1. Try to get from database first
      try {
        dbTopics = await DatabaseService.getTopics();
      } catch (dbError) {
        console.error('Error fetching all topics from database:', dbError);
      }

      // 2. Fetch from API to get markdown content
      try {
        const response = await fetch('/api/topics');

        if (response.ok) {
          markdownTopicData = await response.json();
        }
      } catch (apiError) {
        console.error('Error fetching all topics from API:', apiError);
      }

      // 3. Merge the data sources
      const mergedTopics: TopicTree = {};

      // First, add all database topics with their categories
      if (dbTopics && dbTopics.length > 0) {
        for (const topic of dbTopics) {
          mergedTopics[topic.slug] = {
            label: topic.name,
            subtopics: {}
          };

          // Get categories for this topic
          try {
            const categories = await DatabaseService.getCategoriesByTopic(topic.id);

            // Add categories as subtopics
            for (const category of categories) {
              mergedTopics[topic.slug].subtopics[category.slug] = {
                id: category.slug,
                label: category.name,
                subtopics: {}
              };
            }
          } catch (categoryError) {
            console.error(`Error fetching categories for topic ${topic.slug}:`, categoryError);
          }
        }
      }

      // Then, merge with markdown data
      if (Object.keys(markdownTopicData).length > 0) {
        // For each topic in markdown data
        for (const topicSlug in markdownTopicData) {
          const markdownTopic = markdownTopicData[topicSlug];

          if (!mergedTopics[topicSlug]) {
            // Topic doesn't exist in database, add it from markdown
            mergedTopics[topicSlug] = markdownTopic;
          } else {
            // Topic exists in both sources, merge subtopics
            for (const subtopicKey in markdownTopic.subtopics) {
              const markdownSubtopic = markdownTopic.subtopics[subtopicKey];

              // Find matching category in database by label
              let matchingCategorySlug = subtopicKey;
              let foundMatch = false;

              for (const categorySlug in mergedTopics[topicSlug].subtopics) {
                const dbCategory = mergedTopics[topicSlug].subtopics[categorySlug];

                // Match by label (case insensitive)
                if (dbCategory.label.toLowerCase() === markdownSubtopic.label.toLowerCase()) {
                  matchingCategorySlug = categorySlug;
                  foundMatch = true;
                  break;
                }
              }

              if (foundMatch) {
                // Found a match, merge the subtopics
                mergedTopics[topicSlug].subtopics[matchingCategorySlug].subtopics =
                  markdownSubtopic.subtopics || {};

                // If markdown has content, add it
                if (markdownSubtopic.content) {
                  mergedTopics[topicSlug].subtopics[matchingCategorySlug].content =
                    markdownSubtopic.content;
                }
              } else {
                // No match found, add the markdown subtopic as is
                mergedTopics[topicSlug].subtopics[subtopicKey] = markdownSubtopic;
              }
            }
          }
        }
      }

      // If we have no data from either source, fall back to API
      if (Object.keys(mergedTopics).length === 0) {
        const response = await fetch('/api/topics');

        if (!response.ok) {
          throw new Error(`Failed to fetch all topic data: ${response.statusText}`);
        }

        const data = await response.json();

        // Update cache
        this.cache.topics = data;

        return data;
      }

      // Update cache
      this.cache.topics = mergedTopics;

      return mergedTopics;
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