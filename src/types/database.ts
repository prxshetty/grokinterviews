// Database types for Supabase tables

export interface Topic {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  domain: string;
  section_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  topic_id: string;
  created_at: string;
  updated_at?: string;
  order?: number;
}

export interface Question {
  id: string;
  question_text: string;
  answer_text?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  keywords?: string[];
  category_id: string;
  created_at: string;
  updated_at?: string;
}

// UI-specific types that extend the database types
export interface TopicWithCategories extends Topic {
  categories?: Category[];
}

export interface CategoryWithQuestions extends Category {
  questions?: Question[];
}

// Response types for API endpoints
export interface TopicsResponse {
  topics: Topic[];
  error?: string;
}

export interface CategoriesResponse {
  categories: Category[];
  error?: string;
}

export interface QuestionsResponse {
  questions: Question[];
  error?: string;
}
