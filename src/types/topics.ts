export interface QuestionType {
  id: number;
  question_text: string;
  answer_text?: string | null;
  keywords?: string[] | string | null;
  difficulty?: string | null;
  category_id?: number | null;
  topic_id?: number | null;
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

export interface DisplayItem {
  id: string;
  label: string;
  display_order?: number;
}

export interface SubtopicListItem {
  id: number; // Was topic.id, which is number
  label: string;
  categoryId: number; // Was topic.id
  subtopicId: number; // Was topic.id
}

export interface TopicItem {
  id?: string;
  label: string;
  content?: string;
  questions?: QuestionType[];
  categoryId?: number;
  subtopicId?: number;
  subtopics?: Record<string, any>;
  isGenerated?: boolean;
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

export interface ProgressData {
  progress: number;
  completed: number;
  total: number;
  subtopicsCompleted?: number;
  partiallyCompletedSubtopics?: number;
  totalSubtopics?: number;
}

export interface CategoryResponse {
  id: number;
  topic_id: number;
  name: string;
  description?: string;
  created_at: string;
  questions?: QuestionType[];
}

export interface TopicResponse {
  topic: {
    id: number;
    name: string;
    section_name: string;
    created_at: string;
    domain: string;
    description?: string;
  };
  categories: CategoryResponse[];
}