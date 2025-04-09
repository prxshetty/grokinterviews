/**
 * DatabaseService.ts
 * Service for interacting with the Supabase database
 */

import supabase from '@/utils/supabase';
import { isBrowser } from '@/utils/environment';
import {
  Topic,
  Category,
  Question,
  TopicWithCategories,
  CategoryWithQuestions
} from '@/types/database';

class DatabaseService {
  private cache: {
    topics: Topic[] | null;
    categoriesByTopic: Record<string, Category[]>;
    questionsByCategory: Record<string, Question[]>;
    lastFetched: {
      topics: number;
      categories: Record<string, number>;
      questions: Record<string, number>;
    };
  };

  // Cache expiry time in milliseconds (1 hour)
  private CACHE_EXPIRY = 60 * 60 * 1000;

  constructor() {
    this.cache = {
      topics: null,
      categoriesByTopic: {},
      questionsByCategory: {},
      lastFetched: {
        topics: 0,
        categories: {},
        questions: {}
      }
    };
  }

  /**
   * Get all topics from the database
   * @param domain Optional domain filter (e.g., 'ml' for Machine Learning)
   */
  async getTopics(domain?: string): Promise<Topic[]> {
    console.log('DatabaseService.getTopics - Called with domain:', domain);

    // Check cache first if no domain filter is applied
    if (!domain && this.cache.topics && Date.now() - this.cache.lastFetched.topics < this.CACHE_EXPIRY) {
      console.log('DatabaseService.getTopics - Using cached topics data');
      return this.cache.topics;
    }

    // If we're in the browser, we need to use the API instead of direct Supabase access
    if (isBrowser) {
      console.log('DatabaseService.getTopics - Running in browser, using API');
      try {
        const url = domain ? `/api/topics?domain=${domain}` : '/api/topics';
        console.log('DatabaseService.getTopics - Fetching from URL:', url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch topics: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('DatabaseService.getTopics - Received data from API:', data);

        // Convert from legacy format to Topic[] format
        const topics: Topic[] = Object.entries(data).map(([slug, details]: [string, any]) => {
          // Generate a unique ID based on the slug if it's not a number
          let id: number;
          if (!isNaN(parseInt(slug, 10))) {
            id = parseInt(slug, 10);
          } else {
            // Use a hash function to generate a numeric ID from the slug
            id = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          }

          return {
            id,
            slug,
            name: details.label,
            domain: domain || 'unknown',
            created_at: new Date().toISOString(),
          };
        });

        console.log('DatabaseService.getTopics - Converted topics:', topics);

        // Update cache if no domain filter was applied
        if (!domain) {
          this.cache.topics = topics;
          this.cache.lastFetched.topics = Date.now();
        }

        return topics;
      } catch (error) {
        console.error('Failed to fetch topics via API:', error);
        return [];
      }
    }

    // Server-side direct database access
    try {
      let query = supabase.from('topics').select('*');

      // Apply domain filter if provided
      if (domain) {
        query = query.eq('domain', domain);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching topics:', error);
        throw error;
      }

      // Update cache if no domain filter was applied
      if (!domain) {
        this.cache.topics = data;
        this.cache.lastFetched.topics = Date.now();
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch topics directly:', error);
      return [];
    }
  }

  /**
   * Get categories for a specific topic
   * @param topicId The ID or slug of the topic
   */
  async getCategoriesByTopic(topicId: string | number): Promise<Category[]> {
    const cacheKey = `topic_${topicId}`;

    // Check cache first
    if (
      this.cache.categoriesByTopic[cacheKey] &&
      this.cache.lastFetched.categories[cacheKey] &&
      Date.now() - this.cache.lastFetched.categories[cacheKey] < this.CACHE_EXPIRY
    ) {
      console.log(`Using cached categories for topic ${topicId}`);
      return this.cache.categoriesByTopic[cacheKey];
    }

    // If we're in the browser, we need to use the API instead of direct Supabase access
    if (isBrowser) {
      try {
        // Fetch categories from API
        const response = await fetch(`/api/topics/categories?topicId=${topicId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }

        const data = await response.json();

        // The API returns categories in a different format, so we need to convert them
        const categories: Category[] = [];

        // Extract categories for this topic
        const topicCategories = data[topicId as string] || [];

        // Convert to Category[] format
        topicCategories.forEach((cat: any, index: number) => {
          categories.push({
            id: index + 1, // Generate a fake ID
            name: cat.label,
            slug: cat.id,
            topic_id: typeof topicId === 'number' ? topicId : 0,
            created_at: new Date().toISOString()
          });
        });

        // Update cache
        this.cache.categoriesByTopic[cacheKey] = categories;
        this.cache.lastFetched.categories[cacheKey] = Date.now();

        return categories;
      } catch (error) {
        console.error(`Failed to fetch categories via API for topic ${topicId}:`, error);
        return [];
      }
    }

    // Server-side direct database access
    try {
      let query;

      // Check if topicId is a number or a slug
      let topicIdValue: number | null = null;

      if (typeof topicId === 'number' || !isNaN(Number(topicId))) {
        topicIdValue = Number(topicId);
      } else {
        // First get the topic by slug
        try {
          const { data: topicData, error } = await supabase
            .from('topics')
            .select('id')
            .eq('slug', topicId)
            .single();

          if (!error && topicData) {
            topicIdValue = topicData.id;
          }
        } catch (slugError) {
          console.error(`Error finding topic by slug: ${slugError}`);
        }

        // If not found by slug, try with name
        if (!topicIdValue) {
          try {
            const { data, error } = await supabase
              .from('topics')
              .select('id')
              .ilike('name', topicId.replace(/-/g, ' '));

            if (!error && data && data.length > 0) {
              topicIdValue = data[0].id;
            }
          } catch (nameError) {
            console.error(`Error finding topic by name: ${nameError}`);
          }
        }
      }

      if (!topicIdValue) {
        throw new Error(`Topic with ID or slug ${topicId} not found`);
      }

      query = supabase.from('categories').select('*').eq('topic_id', topicIdValue);

      const { data, error } = await query.order('name');

      if (error) {
        console.error(`Error fetching categories for topic ${topicId}:`, error);
        throw error;
      }

      // Update cache
      this.cache.categoriesByTopic[cacheKey] = data || [];
      this.cache.lastFetched.categories[cacheKey] = Date.now();

      return data || [];
    } catch (error) {
      console.error(`Failed to fetch categories directly for topic ${topicId}:`, error);
      return [];
    }
  }

  /**
   * Get questions for a specific category
   * @param categoryId The ID or slug of the category
   */
  async getQuestionsByCategory(categoryId: string | number): Promise<Question[]> {
    const cacheKey = `category_${categoryId}`;

    // Check cache first
    if (
      this.cache.questionsByCategory[cacheKey] &&
      this.cache.lastFetched.questions[cacheKey] &&
      Date.now() - this.cache.lastFetched.questions[cacheKey] < this.CACHE_EXPIRY
    ) {
      console.log(`Using cached questions for category ${categoryId}`);
      return this.cache.questionsByCategory[cacheKey];
    }

    // If we're in the browser, we need to use the API instead of direct Supabase access
    if (isBrowser) {
      try {
        // Fetch questions from API
        const response = await fetch(`/api/questions?categoryId=${categoryId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch questions: ${response.statusText}`);
        }

        const data = await response.json();
        const questions = data.questions || [];

        // Update cache
        this.cache.questionsByCategory[cacheKey] = questions;
        this.cache.lastFetched.questions[cacheKey] = Date.now();

        return questions;
      } catch (error) {
        console.error(`Failed to fetch questions via API for category ${categoryId}:`, error);
        return [];
      }
    }

    // Server-side direct database access
    try {
      let query;

      // Check if categoryId is a number or a slug
      if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
        query = supabase.from('questions').select('*').eq('category_id', categoryId);
      } else {
        // Try different approaches to find the category
        let categoryData = null;

        // First try to get the category by name (assuming name is used instead of slug)
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('id')
            .ilike('name', categoryId.replace(/-/g, ' '));

          if (!error && data && data.length > 0) {
            categoryData = data[0];
          }
        } catch (nameError) {
          console.error(`Error finding category by name: ${nameError}`);
        }

        // If not found, try a partial match
        if (!categoryData) {
          try {
            const { data, error } = await supabase
              .from('categories')
              .select('id')
              .ilike('name', `%${categoryId.replace(/-/g, ' ')}%`);

            if (!error && data && data.length > 0) {
              categoryData = data[0];
            }
          } catch (partialError) {
            console.error(`Error finding category by partial name: ${partialError}`);
          }
        }

        if (!categoryData) {
          throw new Error(`Category with ID or name ${categoryId} not found`);
        }

        query = supabase.from('questions').select('*').eq('category_id', categoryData.id);
      }

      const { data, error } = await query.order('difficulty');

      if (error) {
        console.error(`Error fetching questions for category ${categoryId}:`, error);
        throw error;
      }

      // Update cache
      this.cache.questionsByCategory[cacheKey] = data || [];
      this.cache.lastFetched.questions[cacheKey] = Date.now();

      return data || [];
    } catch (error) {
      console.error(`Failed to fetch questions directly for category ${categoryId}:`, error);
      return [];
    }
  }

  /**
   * Get a topic with all its categories
   * @param topicId The ID or slug of the topic
   */
  async getTopicWithCategories(topicId: string | number): Promise<TopicWithCategories | null> {
    // If we're in the browser, we need to use the API instead of direct Supabase access
    if (isBrowser) {
      try {
        // First get the topic
        const topicResponse = await fetch(`/api/topics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ topicId })
        });

        if (!topicResponse.ok) {
          throw new Error(`Failed to fetch topic: ${topicResponse.statusText}`);
        }

        const topicData = await topicResponse.json();

        // Convert from legacy format to Topic format
        const topicSlug = Object.keys(topicData)[0];
        if (!topicSlug) return null;

        const topicDetails = topicData[topicSlug];

        const topic: Topic = {
          id: parseInt(topicSlug, 10) || 0,
          slug: topicSlug,
          name: topicDetails.label,
          domain: 'unknown',
          created_at: new Date().toISOString()
        };

        // Get categories for this topic
        const categories = await this.getCategoriesByTopic(topicSlug);

        return {
          ...topic,
          categories
        };
      } catch (error) {
        console.error(`Failed to fetch topic with categories via API for ${topicId}:`, error);
        return null;
      }
    }

    // Server-side direct database access
    try {
      let topic: Topic | null = null;

      // Get the topic
      if (typeof topicId === 'number' || !isNaN(Number(topicId))) {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('id', topicId)
          .single();

        if (error) throw error;
        topic = data;
      } else {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('slug', topicId)
          .single();

        if (error) throw error;
        topic = data;
      }

      if (!topic) return null;

      // Get the categories for this topic
      const categories = await this.getCategoriesByTopic(topic.id);

      return {
        ...topic,
        categories
      };
    } catch (error) {
      console.error(`Failed to fetch topic with categories directly for ${topicId}:`, error);
      return null;
    }
  }

  /**
   * Helper method to create a CategoryWithQuestions object from markdown data
   * @param data The markdown data
   * @param categoryId The ID of the category
   */
  private createCategoryWithQuestionsFromMarkdown(data: any, categoryId: string | number): CategoryWithQuestions {
    // Create a category object
    const category: Category = {
      id: typeof categoryId === 'number' ? categoryId : 0,
      name: data.label || 'Unknown Category',
      slug: typeof categoryId === 'string' ? categoryId : 'unknown',
      topic_id: 0, // We don't know the topic ID from this API call
      created_at: new Date().toISOString()
    };

    // Create questions from subtopics if available
    const questions: Question[] = [];

    if (data.subtopics) {
      Object.entries(data.subtopics).forEach(([id, subtopic]: [string, any], index) => {
        questions.push({
          id: index + 1,
          category_id: typeof categoryId === 'number' ? categoryId : 0,
          question_text: subtopic.label || `Question ${index + 1}`,
          answer_text: subtopic.content || '',
          difficulty: 'medium',
          keywords: [],
          created_at: new Date().toISOString()
        });
      });
    }

    return {
      ...category,
      questions
    };
  }

  /**
   * Get a category with all its questions
   * @param categoryId The ID or slug of the category
   */
  async getCategoryWithQuestions(categoryId: string | number): Promise<CategoryWithQuestions | null> {
    // If we're in the browser, we need to use the API instead of direct Supabase access
    if (isBrowser) {
      try {
        // Fetch category details from our new category-details API
        const response = await fetch(`/api/topics/category-details?topicId=ml&categoryId=${categoryId}`);

        if (!response.ok) {
          console.warn(`Failed to fetch from category-details API: ${response.statusText}`);
          // Try with a different topic
          const altResponse = await fetch(`/api/topics/category-details?topicId=ai&categoryId=${categoryId}`);

          if (!altResponse.ok) {
            console.warn(`Failed to fetch from category-details API with alt topic: ${altResponse.statusText}`);
            // Try with another topic
            const dsa = await fetch(`/api/topics/category-details?topicId=dsa&categoryId=${categoryId}`);

            if (!dsa.ok) {
              console.warn(`Failed to fetch from category-details API with dsa topic: ${dsa.statusText}`);
              // Fall back to the original categories API
              const categoriesResponse = await fetch(`/api/topics/categories?categoryId=${categoryId}&topicId=any`);

              if (!categoriesResponse.ok) {
                throw new Error(`Failed to fetch category: ${categoriesResponse.statusText}`);
              }

              const categoryData = await categoriesResponse.json();

              if (!categoryData || categoryData.error) {
                throw new Error(categoryData?.error || 'Failed to fetch category');
              }

              // Create a category object
              const category: Category = {
                id: typeof categoryId === 'number' ? categoryId : 0,
                name: categoryData.label || 'Unknown Category',
                slug: typeof categoryId === 'string' ? categoryId : 'unknown',
                topic_id: 0, // We don't know the topic ID from this API call
                created_at: new Date().toISOString()
              };

              // Get questions for this category
              const questions = await this.getQuestionsByCategory(categoryId);

              return {
                ...category,
                questions
              };
            }

            // Use the DSA response
            const dsaData = await dsa.json();
            return this.createCategoryWithQuestionsFromMarkdown(dsaData, categoryId);
          }

          // Use the alt response
          const altData = await altResponse.json();
          return this.createCategoryWithQuestionsFromMarkdown(altData, categoryId);
        }

        // Use the primary response
        const data = await response.json();
        return this.createCategoryWithQuestionsFromMarkdown(data, categoryId);
      } catch (error) {
        console.error(`Failed to fetch category with questions via API for ${categoryId}:`, error);
        return null;
      }
    }

    // Server-side direct database access
    try {
      let category: Category | null = null;

      // Get the category
      if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
        // Try to get by ID
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (!error) {
          category = data;
        }
      }

      // If not found by ID, try with name
      if (!category && typeof categoryId === 'string') {
        // Try to match by name (case insensitive)
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .ilike('name', categoryId.replace(/-/g, ' '));

          if (!error && data && data.length > 0) {
            category = data[0];
          }
        } catch (nameError) {
          console.error(`Error finding category by name: ${nameError}`);
        }

        // If still not found, try a partial match
        if (!category) {
          try {
            const { data, error } = await supabase
              .from('categories')
              .select('*')
              .ilike('name', `%${categoryId.replace(/-/g, ' ')}%`);

            if (!error && data && data.length > 0) {
              category = data[0];
            }
          } catch (partialError) {
            console.error(`Error finding category by partial name: ${partialError}`);
          }
        }
      }

      if (!category) return null;

      // Get the questions for this category
      const questions = await this.getQuestionsByCategory(category.id);

      return {
        ...category,
        questions
      };
    } catch (error) {
      console.error(`Failed to fetch category with questions directly for ${categoryId}:`, error);
      return null;
    }
  }

  /**
   * Search for questions across all categories
   * @param query The search query
   * @param filters Optional filters (difficulty, topic, etc.)
   */
  async searchQuestions(
    query: string,
    filters?: {
      difficulty?: 'easy' | 'medium' | 'hard',
      topicId?: number,
      categoryId?: number
    }
  ): Promise<Question[]> {
    // If we're in the browser, we need to use the API instead of direct Supabase access
    if (isBrowser) {
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('query', query);

        if (filters) {
          if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
          if (filters.topicId) queryParams.append('topicId', filters.topicId.toString());
          if (filters.categoryId) queryParams.append('categoryId', filters.categoryId.toString());
        }

        // Fetch questions from API
        const response = await fetch(`/api/questions?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to search questions: ${response.statusText}`);
        }

        const data = await response.json();
        return data.questions || [];
      } catch (error) {
        console.error('Failed to search questions via API:', error);
        return [];
      }
    }

    // Server-side direct database access
    try {
      let dbQuery = supabase
        .from('questions')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            topic_id
          )
        `)
        .ilike('question_text', `%${query}%`);

      // Apply filters if provided
      if (filters) {
        if (filters.difficulty) {
          dbQuery = dbQuery.eq('difficulty', filters.difficulty);
        }

        if (filters.categoryId) {
          dbQuery = dbQuery.eq('category_id', filters.categoryId);
        }

        if (filters.topicId) {
          dbQuery = dbQuery.eq('categories.topic_id', filters.topicId);
        }
      }

      const { data, error } = await dbQuery.limit(50);

      if (error) {
        console.error('Error searching questions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search questions directly:', error);
      return [];
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache = {
      topics: null,
      categoriesByTopic: {},
      questionsByCategory: {},
      lastFetched: {
        topics: 0,
        categories: {},
        questions: {}
      }
    };
  }
}

export default new DatabaseService();
