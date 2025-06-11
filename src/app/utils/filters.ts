// src/app/utils/filters.ts

// Assume QuestionType is similar to the one in CategoryDetailView
// We might need to import the actual QuestionType later
interface QuestionType {
  id: number;
  question_text: string;
  answer_text?: string | null;
  keywords?: string[] | string | null; // Can be array or single string
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
    }
  };
}

/**
 * Filters an array of questions by difficulty.
 * @param questions - The array of questions to filter.
 * @param difficulty - The difficulty to filter by (e.g., 'beginner', 'intermediate', 'advanced'). If null, returns all questions.
 * @returns A new array containing only the questions that match the specified difficulty.
 */
export function filterQuestionsByDifficulty(questions: QuestionType[], difficulty: string | null): QuestionType[] {
  if (!difficulty) return questions;
  return questions.filter(question => question.difficulty?.toLowerCase() === difficulty.toLowerCase());
}

/**
 * Filters an array of questions by a keyword.
 * Matches if the keyword is present in the question's keywords array or string.
 * The search is case-insensitive.
 * @param questions - The array of questions to filter.
 * @param keyword - The keyword to search for. If null or empty, returns all questions.
 * @returns A new array containing only the questions that include the specified keyword.
 */
export function filterQuestionsByKeyword(questions: QuestionType[], keyword: string | null): QuestionType[] {
  if (!keyword || keyword.trim() === '') return questions;
  const lowerKeyword = keyword.toLowerCase();
  return questions.filter(question => {
    if (!question.keywords) return false;
    if (Array.isArray(question.keywords)) {
      return question.keywords.some(k => k.toLowerCase().includes(lowerKeyword));
    }
    if (typeof question.keywords === 'string') {
      return question.keywords.toLowerCase().includes(lowerKeyword);
    }
    return false;
  });
} 