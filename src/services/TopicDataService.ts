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
  private ongoingGetAllTopicDataFetch: Promise<TopicTree> | null = null;

  /**
   * Gets all section headers for a specific domain
   * @param domain The domain to get section headers for (e.g., 'ml', 'ai')
   */
  async getSectionHeaders(domain: string): Promise<CategoryItem[]> {
    try {
      // Fetch section headers from the API (already sorted by display_order)
      const response = await fetch(`/api/section-headers?domain=${domain}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch section headers: ${response.statusText}`);
      }
      const sectionHeaders = await response.json();
      return sectionHeaders.map((header: any) => ({
        id: `header-${header.id}`,
        label: header.name
      }));
    } catch (error) {
      console.error('Error fetching section headers:', error);
      return [];
    }
  }

  /**
   * Gets all topics for a specific section
   * @param domain The domain (e.g., 'ml', 'ai')
   * @param sectionName The name of the section to get topics for
   */
  async getTopicsBySection(domain: string, sectionName: string): Promise<CategoryItem[]> {
    try {
      // Fetch topics from the API (already sorted by created_at)
      const response = await fetch(`/api/topics/by-section?domain=${domain}&sectionName=${encodeURIComponent(sectionName)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.statusText}`);
      }
      const topics = await response.json();
      return topics.map((topic: any) => ({
        id: `topic-${topic.id}`,
        label: topic.name
      }));
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
        return this.cache.categoryDetails[cacheKey];
      }

      let categoryDataFromDB: any = null;

      // 1. Try to get category with questions from the database
      try {
        const categoryWithQuestions = await DatabaseService.getCategoryWithQuestions(categoryId, topicId);

        if (categoryWithQuestions) {

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
        if (this.cache.topics && this.cache.topics[topicId]) {
          const topic = this.cache.topics[topicId];
          if (topic && topic.subtopics) {
            // Try to find the category by exact ID match first
            if (topic.subtopics[categoryId]) {
              result = topic.subtopics[categoryId];
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


      if (result) {
        this.cache.categoryDetails[cacheKey] = result;
      } else {
        console.warn(`Failed to fetch category details for ${topicId}:${categoryId} after all attempts.`);
        // Return null or an empty object structure if preferred, instead of throwing
        // For now, returning null to indicate failure to find details
        return null;
      }

      return result;
    } catch (error) {
      console.error(`Error in getCategoryDetails for ${topicId}:${categoryId}:`, error);
      // Consider what to return in a general catch-all: null, empty object, or rethrow
      return null; // Or throw error;
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

      let topicDataFromDB: any = null;

      // 1. Get topic with categories from the database
      try {
        const topicWithCategories = await DatabaseService.getTopicWithCategories(topicId);

        if (topicWithCategories) {
          // Convert to the format expected by the UI
          topicDataFromDB = {
            label: topicWithCategories.name,
            subtopics: {}
          };

          // Add categories as subtopics
          if (topicWithCategories.categories) {
            for (const category of topicWithCategories.categories) {
              const categorySlug = slugify(category.name); // Generate slug from name
              topicDataFromDB.subtopics[categorySlug] = {
                id: categorySlug,
                label: category.name,
                // Initialize subtopics for category, actual content/questions handled by getCategoryDetails
                subtopics: {}
              };
            }
          }
        } else {
          // Topic not found in database
          console.warn(`Topic ${topicId} not found in database.`);
          // No need to throw here, will fall through and potentially return null if no data
        }
      } catch (dbError) {
        console.error(`Error fetching topic data from database for ${topicId}:`, dbError);
        // If database call fails, topicDataFromDB remains null, allowing graceful failure
      }

      // If no data was fetched from the database, return null
      if (!topicDataFromDB) {
        console.warn(`No data successfully fetched for topic ${topicId} from DatabaseService.`);
        return null;
      }

      // Update cache with the data fetched from the database
      if (!this.cache.topics) {
        this.cache.topics = {};
      }
      this.cache.topics[topicId] = topicDataFromDB;

      return { [topicId]: topicDataFromDB };
    } catch (error) {
      // General error catch for any unexpected issues during the process
      console.error(`Error loading topic data for ${topicId}:`, error);
      return null;
    }
  }

  /**
   * Gets all available topic data
   */
  async getAllTopicData(): Promise<TopicTree> {
    // Try to get from cache first
    if (this.cache.topics) {
      return this.cache.topics;
    }

    // Check if a fetch is already in progress
    if (this.ongoingGetAllTopicDataFetch) {
      return this.ongoingGetAllTopicDataFetch;
    }

    this.ongoingGetAllTopicDataFetch = (async (): Promise<TopicTree> => {
      try {
        const topicsWithCategories = await DatabaseService.fetchAllTopicsWithDetailedCategories();

        if (!topicsWithCategories || topicsWithCategories.length === 0) {
          console.warn('TopicDataService.getAllTopicData - No topics returned from DatabaseService.fetchAllTopicsWithDetailedCategories');
          this.cache.topics = {}; // Cache empty object
          return {};
        }

        const newTopicTree: TopicTree = {};

        for (const topic of topicsWithCategories) {
          const topicNameForSlug = topic.name;
          const topicIdForLog = topic.id;
          let currentTopicSlug = slugify(topicNameForSlug);

          if (newTopicTree[currentTopicSlug]) {
            const originalSlug = currentTopicSlug;
            currentTopicSlug = `${currentTopicSlug}-${topicIdForLog}`;
            console.warn(`TopicDataService.getAllTopicData - (Collision) Slug '${originalSlug}' already exists. Using new unique slug '${currentTopicSlug}' for Topic ID ${topicIdForLog}`);
          }

          if (!currentTopicSlug) {
            console.warn(`TopicDataService.getAllTopicData - Topic with ID ${topicIdForLog} has no valid slug (original name: '${topicNameForSlug}'), skipping.`);
            continue;
          }

          newTopicTree[currentTopicSlug] = {
            label: String(topicNameForSlug),
            subtopics: {}
          };
        }

        this.cache.topics = newTopicTree;
        return newTopicTree;

      } catch (error) {
        console.error('Error in TopicDataService.getAllTopicData during new fetch logic:', error);
        this.cache.topics = {}; // Cache empty on error
        return {}; // Resolve promise with empty on error
      } finally {
        this.ongoingGetAllTopicDataFetch = null; // Clear the ongoing fetch promise
      }
    })();

    return this.ongoingGetAllTopicDataFetch;
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