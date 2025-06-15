// These types are defined to exactly match the original local types in TopicPageClient.tsx
// to ensure no breaking changes in the client component's logic.

export interface QuestionType {
  id: number;
  category_id: number; // Was non-optional in original local type
  question_text: string;
  answer_text?: string;
  keywords?: string[];
  difficulty?: string;
  created_at?: string;
  categories?: {
    id: number;
    name: string;
    topic_id: number;
    topics?: {
      id: number;
      name: string;
      domain: string;
    };
  };
}

export interface CategoryItem {
  id: string;
  label: string;
}

export interface TopicItem {
  id?: string;
  label: string;
  content?: string;
  questions?: QuestionType[]; // Uses the QuestionType defined above
  categoryId?: number;
  subtopicId?: number;
  subtopics?: Record<string, TopicItem>; // Recursive structure
  isGenerated?: boolean;
}

export interface ProgressData {
  progress: number;
  completed: number;
  total: number;
  subtopicsCompleted?: number;
  partiallyCompletedSubtopics?: number;
  totalSubtopics?: number;
}

export interface SubtopicProgress {
  completionPercentage: number;
  questionsCompleted: number;
  totalQuestions: number;
  categoriesCompleted: number;
  totalCategories: number;
}

export interface CategoryProgress {
  questionsCompleted: number;
  totalQuestions: number;
  completionPercentage: number;
} 