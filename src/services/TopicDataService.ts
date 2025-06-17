/**
 * TopicDataService.ts
 * Client-side service for loading and managing topic data
 */

import DatabaseService from '@/services/DatabaseService';
import { Topic, Question } from '@/types/database';

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
        label: header.name
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
   * @param sectionName The name of the section to get topics for
   */
  async getTopicsBySection(domain: string, sectionName: string): Promise<CategoryItem[]> {
    try {
      console.log(`TopicDataService.getTopicsBySection - Called with domain: ${domain}, sectionName: ${sectionName}`);

      // Check cache first
      const cacheKey = `topics-${domain}-${sectionName}`;
      if (this.cache.categories && this.cache.categories[cacheKey]) {
        console.log(`TopicDataService.getTopicsBySection - Using cached data for ${cacheKey}`);
        return this.cache.categories[cacheKey];
      }

      // Fetch topics from the API
      console.log(`TopicDataService.getTopicsBySection - Fetching from API: /api/topics/by-section?domain=${domain}&sectionName=${encodeURIComponent(sectionName)}`);
      const response = await fetch(`/api/topics/by-section?domain=${domain}&sectionName=${encodeURIComponent(sectionName)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.statusText}`);
      }

      const topics = await response.json();
      console.log(`TopicDataService.getTopicsBySection - Received ${topics.length} topics:`, topics);

      // Convert to CategoryItem format
      const result = topics.map((topic: any) => ({
        id: `topic-${topic.id}`,
        label: topic.name
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
              // This logic might need further review as per Phase 1.2 re-evaluation
              for (const subtopicKey in topic.subtopics) {
                const subtopic = topic.subtopics[subtopicKey];
                if (
                  subtopic.id === categoryId || // Check actual id field if present
                  slugify(subtopic.label) === categoryId ||
                  subtopic.label.toLowerCase().includes(categoryId.toLowerCase()) ||
                  categoryId.toLowerCase().includes(subtopic.label.toLowerCase())
                ) {
                  result = subtopic;
                  console.log(`Fallback: Found category by fuzzy match in cache: ${subtopic.label}`);
                  break;
                }
              }
            }
          }
        }

        // Special case for 'data-preprocessing-and-exploration' and 'naive-bayes' (example)
        // This specific hardcoding should be reviewed if it's due to old markdown structures
        if (!result || Object.keys(result.subtopics || {}).length === 0) {
          if (categoryId === 'data-preprocessing-and-exploration') {
            // Attempt to find a category that looks like "Data Preprocessing"
            // This is a placeholder for the kind of logic that might exist
            console.warn('Attempting special fallback for data-preprocessing-and-exploration');
            // ... (keep existing special logic if any, but ensure it doesn't rely on markdown data)
          } else if (categoryId === 'naive-bayes' && this.cache.topics) {
            console.warn('Attempting special fallback for naive-bayes');
            // This is complex logic that was in the original file, preserved for now.
            // It searches through all topics and their subtopics for "Naive Bayes".
            // Needs careful review in Phase 1.2 "Subsequent Re-evaluation".
            const findNaiveBayes = (node: TopicItem): TopicItem | null => {
              if (node.label === 'Naive Bayes') return node;
              if (node.subtopics) {
                for (const key in node.subtopics) {
                  const found = findNaiveBayes(node.subtopics[key]);
                  if (found) return found;
                }
              }
              return null;
            };

            for (const topicKey in this.cache.topics) {
              const topic = this.cache.topics[topicKey];
              if (topic && topic.subtopics) { // Ensure topic and topic.subtopics are not null
                for (const subtopicKey in topic.subtopics) {
                  const found = findNaiveBayes(topic.subtopics[subtopicKey]);
                  if (found) {
                    result = found;
                    break;
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
        console.log(`Successfully fetched and cached details for ${topicId}:${categoryId}`, result);
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
    console.log('TopicDataService.getTopicData - Called with topicId:', topicId);
    try {
      // Try to get from cache first
      if (this.cache.topics && this.cache.topics[topicId]) {
        console.log('TopicDataService.getTopicData - Using cached data');
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
    console.log('TopicDataService.getAllTopicData - Called');
    // Try to get from cache first
    if (this.cache.topics) {
      console.log('TopicDataService.getAllTopicData - Using cached data');
      return this.cache.topics;
    }

    // Check if a fetch is already in progress
    if (this.ongoingGetAllTopicDataFetch) {
      console.log('TopicDataService.getAllTopicData - Fetch already in progress, returning existing promise');
      return this.ongoingGetAllTopicDataFetch;
    }

    console.log('TopicDataService.getAllTopicData - Starting new fetch');
    this.ongoingGetAllTopicDataFetch = (async (): Promise<TopicTree> => {
      try {
        const allTopicsFromDB: TopicTree = {};
        let dbTopics: Topic[] = [];

        // 1. Get all topics from the database
        try {
          console.log('TopicDataService.getAllTopicData - (Inner) Fetching topics from database');
          dbTopics = await DatabaseService.getTopics();
          console.log('TopicDataService.getAllTopicData - (Inner) Got topics from database:', dbTopics);
        } catch (dbError) {
          console.error('Error fetching all topics from database:', dbError);
          this.cache.topics = {}; // Key fix: Cache empty on this critical failure
          return {}; // Resolve promise with empty
        }

        // 2. For each database topic, get its categories and structure the TopicTree
        if (dbTopics && dbTopics.length > 0) {
          console.log('TopicDataService.getAllTopicData - (Inner) Processing database topics');
          for (const topic of dbTopics) {
            const currentTopicSlug = (topic as Topic & { slug?: string }).slug || slugify(topic.name);
            if (!currentTopicSlug) {
              console.warn(`TopicDataService.getAllTopicData - Topic with ID ${topic.id} has no slug or name, skipping.`);
              continue;
            }
            console.log(`TopicDataService.getAllTopicData - (Inner) Processing topic: ${currentTopicSlug}`);
            allTopicsFromDB[currentTopicSlug] = {
              label: topic.name,
              subtopics: {}
            };

            try {
              console.log(`TopicDataService.getAllTopicData - (Inner) Fetching categories for topic: ${currentTopicSlug} (ID: ${topic.id})`);
              const categories = await DatabaseService.getCategoriesByTopic(topic.id);
              console.log(`TopicDataService.getAllTopicData - (Inner) Got ${categories.length} categories for topic: ${currentTopicSlug}`);

              for (const category of categories) {
                const categorySlug = slugify(category.name);
                if (!categorySlug) {
                  console.warn(`TopicDataService.getAllTopicData - (Inner) Category under topic ${currentTopicSlug} has no name, skipping.`);
                  continue;
                }
                console.log(`TopicDataService.getAllTopicData - (Inner) Adding category: ${categorySlug} to topic ${currentTopicSlug}`);
                allTopicsFromDB[currentTopicSlug].subtopics[categorySlug] = {
                  id: categorySlug,
                  label: category.name,
                  subtopics: {}
                };
              }
            } catch (categoryError) {
              console.error(`Error fetching categories for topic ${currentTopicSlug} (ID: ${topic.id}):`, categoryError);
            }
          }
        } else {
          console.log('TopicDataService.getAllTopicData - (Inner) No topics found in the database.');
          this.cache.topics = {}; // Cache empty if no topics found
          return {}; // Resolve promise with empty
        }

        console.log('TopicDataService.getAllTopicData - (Inner) DB processing complete, topics processed:', Object.keys(allTopicsFromDB).length);
        this.cache.topics = allTopicsFromDB;
        return allTopicsFromDB;

      } catch (error) {
        console.error('Error processing all topic data within IIFE:', error);
        // Ensure cache is set if not already by a specific error handler and it is still null
        if (this.cache.topics === null) {
            this.cache.topics = {};
        }
        return this.cache.topics; // Return current cache state (likely {} now)
      } finally {
        this.ongoingGetAllTopicDataFetch = null;
        console.log('TopicDataService.getAllTopicData - Fetch operation concluded. Ongoing fetch cleared.');
      }
    })();
    
    return this.ongoingGetAllTopicDataFetch;
    // Removed the outer try-catch as the IIFE handles its own errors and sets the cache.
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