/**
 * TopicDataService.ts
 * Client-side service for loading and managing topic data
 */

import DatabaseService from '@/services/DatabaseService';
import { Question } from '@/types/database';

// Define TopicItem type directly in this file
export type TopicItem = {
  id?: string;
  label: string;
  content?: string;
  questions?: Question[];
  categoryId?: number;
  subtopicId?: number;
  subtopics?: Record<string, TopicItem>;
  isGenerated?: boolean;
};

export type TopicTree = {
  [key: string]: {
    label: string;
    subtopics: Record<string, TopicItem>;
  };
};

type CategoryItem = {
  id: string;
  label: string;
  display_order?: number; // Add display_order for proper section ordering
  subtopics?: { id: string; label: string }[]; // Add subtopics to CategoryItem
};

// Helper function (ideally in a utils file, define or import it as needed)
// For the purpose of this edit, we'll assume slugify is available in the scope.
// If not, you would need to define it here or import it.
// Example:
function slugify(text: string): string {
  if (typeof text !== 'string') return ''; // Handle cases where name might be undefined
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars (alphanumeric, underscore, hyphen)
    .replace(/--+/g, '-'); // Replace multiple hyphens with single hyphen
}

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
   * Gets all section headers for a specific domain
   * @param domain The domain to get section headers for (e.g., 'ml', 'ai')
   */
  async getSectionHeaders(domain: string): Promise<CategoryItem[]> {
    try {
      // Check cache first
      const cacheKey = `section-headers-${domain}`;
      if (this.cache.categories && this.cache.categories[cacheKey]) {
        return this.cache.categories[cacheKey];
      }

      // Fetch section headers from the API
      const response = await fetch(`/api/section-headers?domain=${domain}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch section headers: ${response.statusText}`);
      }

      const sectionHeaders = await response.json();

      // Convert to CategoryItem format
      const result = sectionHeaders.map((header: any) => ({
        id: `header-${header.id}`,
        label: header.name,
        display_order: header.display_order
      }));

      // Cache the result
      if (!this.cache.categories) {
        this.cache.categories = {};
      }
      this.cache.categories[cacheKey] = result;

      return result;
    } catch (error) {
      console.error('Error fetching section headers:', error);
      return [];
    }
  }

  /**
   * Gets all topics for a specific section
   * @param domain The domain (e.g., 'ml', 'ai')
   * @param sectionId The ID of the section to get topics for
   */
  async getTopicsBySection(domain: string, sectionId: string): Promise<CategoryItem[]> {
    try {
      console.log(`TopicDataService.getTopicsBySection - Called with domain: ${domain}, sectionId: ${sectionId}`);

      // Check cache first
      const cacheKey = `topics-${domain}-${sectionId}`;
      if (this.cache.categories && this.cache.categories[cacheKey]) {
        console.log(`TopicDataService.getTopicsBySection - Using cached data for ${cacheKey}`);
        return this.cache.categories[cacheKey];
      }

      // Fetch topics from the API
      console.log(`TopicDataService.getTopicsBySection - Fetching from API: /api/topics/by-section?domain=${domain}&sectionId=${sectionId}`);
      const response = await fetch(`/api/topics/by-section?domain=${domain}&sectionId=${sectionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.statusText}`);
      }

      const topics = await response.json();
      console.log(`TopicDataService.getTopicsBySection - Received ${topics.length} topics:`, topics);

      // Convert to CategoryItem format. These items are the "subtopics".
      const result = topics.map((topic: any) => ({
        id: `topic-${topic.id}`,
        label: topic.name,
        // No deeper subtopics for these items
      }));

      // Cache the result
      if (!this.cache.categories) {
        this.cache.categories = {};
      }
      this.cache.categories[cacheKey] = result;
      console.log(`TopicDataService.getTopicsBySection - Cached ${result.length} topics for ${cacheKey}`);

      return result;
    } catch (error) {
      console.error('Error fetching topics by section:', error);
      return [];
    }
  }
  
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

      // Try to get categories directly from the database
      const categories = await DatabaseService.getCategoriesByTopic(topicId);

      // Convert database categories to the format expected by the UI
      const formattedCategories = categories.map(category => ({
        id: slugify(category.name), // Use slugified name for category ID
        label: category.name
      }));

      // Update cache
      if (!this.cache.categories) {
        this.cache.categories = {};
      }
      this.cache.categories[topicId] = formattedCategories;

      return formattedCategories;
    } catch (error) {
      console.error(`Error fetching categories for topic ${topicId} from database:`, error);
      return []; // Return empty array on error
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

      let categoryDataFromDB: any = null;

      // 1. Try to get category with questions from the database
      try {
        const categoryWithQuestions = await DatabaseService.getCategoryWithQuestions(categoryId, topicId);

        if (categoryWithQuestions) {
          console.log(`Found category ${categoryId} with ${categoryWithQuestions.questions?.length || 0} questions in database`);

          categoryDataFromDB = {
            id: categoryWithQuestions.id, // Keep original category ID if needed
            label: categoryWithQuestions.name,
            subtopics: {}
          };

          if (categoryWithQuestions.questions && categoryWithQuestions.questions.length > 0) {
            categoryWithQuestions.questions.forEach((question) => {
              const questionId = `question-${question.id}`; // Ensure question.id is unique and suitable
              categoryDataFromDB.subtopics[questionId] = {
                id: questionId,
                label: question.question_text,
                content: question.answer_text || '',
                difficulty: question.difficulty,
                keywords: question.keywords,
                categoryId: categoryWithQuestions.id, // Add categoryId to question object
                categoryName: categoryWithQuestions.name // Add categoryName to question object
              };
            });
          }
        } else {
          // This case means the categoryId itself was not found or has no details in DB.
          console.log(`Category ${categoryId} not found in database via DatabaseService.getCategoryWithQuestions.`);
        }
      } catch (dbError) {
        console.error(`Error fetching category details for ${categoryId} from database:`, dbError);
        // categoryDataFromDB remains null, fallback logic will be triggered
      }

      let result: any = categoryDataFromDB;

      // Fallback logic if database fetch failed or returned no subtopics
      // This section starting from the original "if (!mergedResult || ...)"
      // now operates on 'result' which is derived solely from dbCategoryData.
      // The extensive fallback logic (searching this.cache.topics, special handling) is preserved here.
      if (!result || Object.keys(result.subtopics || {}).length === 0) {
        console.log(`Attempting fallback for ${topicId}:${categoryId}`);
        if (this.cache.topics && this.cache.topics[topicId]) {
          const topic = this.cache.topics[topicId];
          if (topic && topic.subtopics) {
            // Try to find the category by exact ID match first
            if (topic.subtopics[categoryId]) {
              result = topic.subtopics[categoryId];
              console.log(`Fallback: Found category by exact ID match in cache: ${categoryId}`);
            } else {
              // Try to find by partial match or label
              for (const subtopicKey in topic.subtopics) {
                const subtopic = topic.subtopics[subtopicKey];
                if (subtopic && (
                  subtopic.id === categoryId ||
                  slugify(subtopic.label) === categoryId ||
                  subtopic.label.toLowerCase().includes(categoryId.toLowerCase()) ||
                  categoryId.toLowerCase().includes(subtopic.label.toLowerCase())
                )) {
                  result = subtopic;
                  console.log(`Fallback: Found category by fuzzy match in cache: ${subtopic.label}`);
                  break;
                }
              }
            }
          }
        }

        // Special case for 'data-preprocessing-and-exploration' and 'naive-bayes' (example)
        if (!result || Object.keys(result.subtopics || {}).length === 0) {
          if (categoryId === 'data-preprocessing-and-exploration') {
            console.warn('Attempting special fallback for data-preprocessing-and-exploration');
          } else if (categoryId === 'naive-bayes' && this.cache.topics) {
            console.warn('Attempting special fallback for naive-bayes');
            const findNaiveBayes = (node: TopicItem): TopicItem | null => {
              if (node.label === 'Naive Bayes') return node;
              if (node.subtopics) {
                for (const key in node.subtopics) {
                  const subNode = node.subtopics[key];
                  if (subNode) { // Check if subNode exists before passing
                    const found = findNaiveBayes(subNode);
                    if (found) return found;
                  }
                }
              }
              return null;
            };

            for (const topicKey in this.cache.topics) {
              const topic = this.cache.topics[topicKey];
              if (topic && topic.subtopics) {
                for (const subtopicKey in topic.subtopics) {
                  const subNode = topic.subtopics[subtopicKey];
                  if (subNode) { // Check if subNode exists before passing
                    const found = findNaiveBayes(subNode);
                    if (found) {
                      result = found;
                      break;
                    }
                  }
                }
              }
              if (result && Object.keys(result.subtopics || {}).length > 0) break;
            }
          }
        }
      }

      // Cache the merged result
      this.cache.categoryDetails[cacheKey] = result;

      return result;
    } catch (error) {
      console.error(`Error fetching category details for ${topicId}:${categoryId}:`, error);
      return null;
    }
  }

  /**
   * Gets topic data for a specific topic ID, fetching from the network if not in cache.
   * This function is intended to replace direct use of a large, pre-fetched topic tree.
   * @param topicId The ID of the topic to get.
   */
  async getTopicData(topicId: string): Promise<TopicTree | null> {
    // This is a placeholder for a more robust implementation.
    // In a real scenario, this would likely fetch from an API endpoint
    // like `/api/topics/${topicId}`.
    console.log(`getTopicData for ${topicId} is not fully implemented.`);
    
    // For now, let's return null to indicate data needs to be fetched.
    // Components will need to handle this loading state.
    return null;
  }

  // NOTE: getAllTopicData has been removed to prevent fetching the entire database
  // and to address stale data issues. Components should now fetch data on-demand.

  /**
   * Clears all client-side cache.
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