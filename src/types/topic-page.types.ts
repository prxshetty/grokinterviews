import { type Database } from './database.types';

// Base database row types
type DbQuestionRow = Database['public']['Tables']['questions']['Row'];
type DbCategoryRow = Database['public']['Tables']['categories']['Row'];
type DbTopicRow = Database['public']['Tables']['topics']['Row'];

// Augmented type for Questions as used in TopicPageClient
// Includes joined category and topic information, and potential answer_text
interface QuestionCategoryDetails extends Pick<DbCategoryRow, 'id' | 'name' | 'topic_id'> {
  topics?: Pick<DbTopicRow, 'id' | 'name' | 'domain'>; // Represents the joined topic for this category
}

export interface QuestionType extends DbQuestionRow {
  answer_text?: string;
  categories?: QuestionCategoryDetails; // Structured nested information
}

// UI-specific type for items in a category list (e.g., sections, topics)
export interface CategoryItem {
  id: string; // Can be 'header-X' or 'topic-Y'
  label: string;
}

// UI-specific type for representing a topic or category with its content and sub-items
// This is often used for displaying details or nested structures.
export interface TopicItem {
  id?: string; // Can be 'header-X' or 'topic-Y'
  label: string;
  content?: string;
  questions?: QuestionType[]; // If it's a category displaying questions
  categoryId?: number; // DB ID of category
  subtopicId?: number; // DB ID of subtopic (if applicable)
  subtopics?: Record<string, TopicItem>; // For nested structures (e.g., section with topics)
  isGenerated?: boolean; // Flag for UI purposes
}

// UI-specific type for aggregated progress data
export interface ProgressData {
  progress: number; // Overall completion percentage
  completed: number; // Number of items completed
  total: number; // Total number of items
  subtopicsCompleted?: number;
  partiallyCompletedSubtopics?: number;
  totalSubtopics?: number;
}

// UI-specific type for progress at the subtopic level
export interface SubtopicProgress {
  completionPercentage: number;
  questionsCompleted: number;
  totalQuestions: number;
  categoriesCompleted: number;
  totalCategories: number;
}

// UI-specific type for progress at the category level
export interface CategoryProgress {
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
} 