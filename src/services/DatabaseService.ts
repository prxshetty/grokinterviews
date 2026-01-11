/**
 * DatabaseService.ts
 * Service for interacting with the Supabase database
 */

import { supabase } from '@/utils/supabase/client';
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
    allDetailedTopics: TopicWithCategories[] | null;
    lastFetched: {
      topics: number;
      categories: Record<string, number>;
      questions: Record<string, number>;
      allDetailedTopics: number;
    };
  };

  // Cache expiry time in milliseconds (1 hour)
  private CACHE_EXPIRY = 60 * 60 * 1000;

  constructor() {
    this.cache = {
      topics: null,
      categoriesByTopic: {},
      questionsByCategory: {},
      allDetailedTopics: null,
      lastFetched: {
        topics: 0,
        categories: {},
        questions: {},
        allDetailedTopics: 0,
      }
    };
  }

  /**
   * Get all topics from the database
   * @param domain Optional domain filter (e.g., 'ml' for Machine Learning)
   */
  async getTopics(domain?: string): Promise<Topic[]> {

    if (!domain && this.cache.topics && Date.now() - this.cache.lastFetched.topics < this.CACHE_EXPIRY) {
      return this.cache.topics;
    }

    if (isBrowser) {
      try {
        const url = domain ? `/api/topics?domain=${domain}` : '/api/topics';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch topics: ${response.statusText}`);
        }

        const topics: Topic[] = await response.json(); // API now returns Topic[] directly

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
        // First get the domain ID from the domain code
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .select('id')
          .eq('code', domain)
          .single();

        if (domainError || !domainData) {
          console.error(`Domain ${domain} not found:`, domainError);
          return [];
        }

        query = query.eq('domain_id', domainData.id);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

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

    if (
      this.cache.categoriesByTopic[cacheKey] &&
      this.cache.lastFetched.categories[cacheKey] &&
      Date.now() - this.cache.lastFetched.categories[cacheKey] < this.CACHE_EXPIRY
    ) {
      return this.cache.categoriesByTopic[cacheKey];
    }

    if (isBrowser) {
      try {
        // Fetch categories from API
        const response = await fetch(`/api/topics/categories?topicId=${topicId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }

        // API now returns Category[] directly for this specific call
        const categories: Category[] = await response.json();

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
      // Check if topicId is a number or a slug
      let topicIdValue: number | null = null;

      if (!isNaN(Number(topicId))) {
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
        if (!topicIdValue && typeof topicId === 'string') {
          try {
            const { data, error } = await supabase
              .from('topics')
              .select('id')
              .ilike('name', topicId.replace(/-/g, ' '));

            if (!error && data && data.length > 0 && data[0]) {
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

      const query = supabase.from('categories').select('*').eq('topic_id', topicIdValue);

      const { data, error } = await query.order('created_at', { ascending: true });

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

    if (
      this.cache.questionsByCategory[cacheKey] &&
      this.cache.lastFetched.questions[cacheKey] &&
      Date.now() - this.cache.lastFetched.questions[cacheKey] < this.CACHE_EXPIRY
    ) {
      return this.cache.questionsByCategory[cacheKey];
    }

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
    if (isBrowser) {
      try {
        const response = await fetch(`/api/topics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ topicId })
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Failed to fetch topic with categories: ${response.statusText}`);
        }

        const topicWithCategories: TopicWithCategories | null = await response.json(); // API now returns TopicWithCategories | null
        return topicWithCategories;
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
   * Get a category with all its questions
   * @param categoryId The ID or slug of the category
   */
  async getCategoryWithQuestions(categoryId: string | number, topicIdFromCaller?: string | number): Promise<CategoryWithQuestions | null> {
    if (isBrowser) {
      try {
        const apiTopicId = topicIdFromCaller && String(topicIdFromCaller) !== 'any' ? String(topicIdFromCaller) : undefined;

        if (!apiTopicId) {
          console.warn(`DatabaseService.getCategoryWithQuestions: topicIdFromCaller missing for ${categoryId}.`);
          return null; // Requires topic ID for context
        }

        const response = await fetch(`/api/topics/categories?categoryId=${categoryId}&topicId=${apiTopicId}`);

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Failed to fetch category ${categoryId} with questions for topic ${apiTopicId}: ${response.statusText}`);
        }

        const categoryWithQuestions: CategoryWithQuestions | null = await response.json();
        return categoryWithQuestions;

      } catch (error) {
        console.error(`Failed to fetch category with questions via API for ${categoryId} (topic: ${topicIdFromCaller}):`, error);
        return null;
      }
    }

    if (typeof categoryId === 'string' && categoryId.startsWith('header-')) {
      console.log(`Category ID ${categoryId} is a section header ID`);

      const headerId = categoryId.replace('header-', '');

      try {
        // Get all topics with this section header ID
        const { data: topics, error: topicsError } = await supabase
          .from('topics')
          .select('section_name')
          .eq('id', headerId);

        if (topicsError || !topics || topics.length === 0 || !topics[0]) {
          console.error(`Error fetching section name for header ID ${headerId}:`, topicsError);
          return null;
        }

        const sectionName = topics[0].section_name;

        // Get all categories that belong to this section
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('section_name', sectionName)
          .order('created_at', { ascending: false });

        if (categoriesError) {
          console.error(`Error fetching categories for section ${sectionName}:`, categoriesError);
          return null;
        }

        if (!categories || categories.length === 0) {
          // Create a synthetic category for the section header
          const fakeCategory: CategoryWithQuestions = {
            id: parseInt(headerId, 10),
            name: sectionName,
            topic_id: 0,
            created_at: new Date().toISOString(),
            questions: []
          };

          return fakeCategory;
        }

        // Create a result object with the section name
        const result = {
          id: parseInt(headerId, 10),
          name: sectionName,
          slug: `section-${headerId}`,
          topic_id: 0,
          created_at: new Date().toISOString(),
          questions: [] as Question[],
          subtopics: {} as Record<string, any>
        };

        // Add each category as a subtopic
        for (let i = 0; i < categories.length; i++) {
          const category = categories[i];
          const subtopicId = `subtopic-${i}`;

          // Get questions for this category
          const { data: questionsForSubtopic, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('category_id', category.id)
            .order('difficulty');

          // Add this category as a subtopic
          // Ensure result.subtopics is treated as defined here
          result.subtopics[subtopicId] = {
            id: subtopicId,
            label: category.name,
            categoryId: category.id, // Store the actual category ID for reference
            questions: questionsForSubtopic || []
          };

          if (!questionsError && questionsForSubtopic && questionsForSubtopic.length > 0) {
            // Also add these questions to the main result for backward compatibility
            // Ensure result.questions is treated as defined here
            result.questions.push(...questionsForSubtopic);
          }
        }

        return result as CategoryWithQuestions; // Cast to ensure compatibility, subtopics is an extra prop
      } catch (error) {
        console.error(`Error processing section header ${categoryId}:`, error);
        return null;
      }
    }

    // Server-side direct database access for regular categories
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
      allDetailedTopics: null,
      lastFetched: {
        topics: 0,
        categories: {},
        questions: {},
        allDetailedTopics: 0,
      }
    };
  }

  /**
   * Fetches all topics with their associated categories directly.
   * Uses a new API route if on client-side, or direct Supabase query if on server-side.
   */
  async fetchAllTopicsWithDetailedCategories(): Promise<TopicWithCategories[]> {
    const lastFetched = this.cache.lastFetched?.allDetailedTopics;
    const isCacheValid = lastFetched && lastFetched > 0 &&
      (Date.now() - lastFetched < this.CACHE_EXPIRY);

    if (this.cache.allDetailedTopics && isCacheValid) {
      return this.cache.allDetailedTopics;
    }

    if (isBrowser) {
      try {
        const response = await fetch('/api/topics-detailed');
        if (!response.ok) {
          throw new Error(`Failed to fetch detailed topics: ${response.statusText}`);
        }
        const topicsWithCategories: TopicWithCategories[] = await response.json();

        this.cache.allDetailedTopics = topicsWithCategories;
        this.cache.lastFetched!.allDetailedTopics = Date.now();

        return topicsWithCategories;
      } catch (error) {
        console.error('Failed to fetch detailed topics via API:', error);
        return [];
      }
    }

    // Server-side direct database access
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: true }); // Order topics by creation date

      if (error) {
        console.error('Error fetching topics with categories directly:', error);
        throw error;
      }

      this.cache.allDetailedTopics = (data as TopicWithCategories[]) || [];
      this.cache.lastFetched!.allDetailedTopics = Date.now();

      return (data as TopicWithCategories[]) || [];
    } catch (error) {
      console.error('Failed to fetch topics with categories directly:', error);
      return [];
    }
  }
}

export default new DatabaseService();
