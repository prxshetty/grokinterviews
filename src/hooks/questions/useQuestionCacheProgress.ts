import { useState, useEffect, useMemo, useCallback } from 'react';
import { questionCache } from '@/utils/questionCache';

interface Question {
  id: number;
  category_id?: number;
  topic_id?: number;
}

// Local interfaces for computed progress (no longer exported from questionCache)
interface CategoryProgress {
  categoryId: number;
  totalQuestions: number;
  completedQuestions: number;
  progress: number;
}

interface TopicProgress {
  topicId: number;
  totalQuestions: number;
  completedQuestions: number;
  progress: number;
  categories: CategoryProgress[];
}

interface UseQuestionCacheProgressProps {
  topicId?: number;
  categoryId?: number;
  questions?: { id: number; category_id?: number; topic_id?: number }[];
  userId?: string;
}

interface UseQuestionCacheProgressReturn {
  categoryProgress: CategoryProgress | null;
  topicProgress: TopicProgress | null;
  refreshProgress: () => void;
  getCompletedCount: (questionIds: number[]) => number;
  isQuestionCompleted: (questionId: number) => boolean;
}

export function useQuestionCacheProgress({
  topicId,
  categoryId,
  questions = [],
  userId
}: UseQuestionCacheProgressProps): UseQuestionCacheProgressReturn {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Set user ID on mount and when it changes
  useEffect(() => {
    questionCache.setUserId(userId);
  }, [userId]);

  // Compute category progress dynamically from question completion data
  const categoryProgress = useMemo(() => {
    if (!categoryId) return null;

    // Always calculate from actual question data when available
    if (questions.length > 0) {
      const categoryQuestions = questions.filter(q =>
        q.category_id === categoryId || (q as Question & { categories?: { id: number } }).categories?.id === categoryId
      );

      const completedCount = categoryQuestions.filter(q =>
        questionCache.isQuestionCompleted(q.id)
      ).length;

      const totalCount = categoryQuestions.length;
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      return {
        categoryId,
        totalQuestions: totalCount,
        completedQuestions: completedCount,
        progress: Math.round(progress * 100) / 100
      };
    }

    // No questions provided - return minimal progress based on cached completions
    const completedForCategory = questionCache.getCompletedQuestionsForCategory(categoryId);
    return {
      categoryId,
      totalQuestions: 0,
      completedQuestions: completedForCategory.length,
      progress: 0
    };
  }, [categoryId, questions, refreshTrigger]);

  // Compute topic progress dynamically from question completion data
  const topicProgress = useMemo(() => {
    if (!topicId) return null;

    // Always calculate from actual question data when available
    if (questions.length > 0) {
      const topicQuestions = questions.filter(q =>
        q.topic_id === topicId || (q as Question & { categories?: { topic_id: number } }).categories?.topic_id === topicId
      );

      const completedCount = topicQuestions.filter(q =>
        questionCache.isQuestionCompleted(q.id)
      ).length;

      const totalCount = topicQuestions.length;
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      // Calculate category breakdown
      const categoriesInTopic = new Map<number, { name: string; questions: Question[]; topic_id: number }>();
      topicQuestions.forEach(q => {
        const catId = q.category_id || (q as Question & { categories?: { id: number } }).categories?.id;
        const catName = (q as Question & { categories?: { name: string } }).categories?.name || `Category ${catId}`;
        const catTopicId = q.topic_id || (q as Question & { categories?: { topic_id: number } }).categories?.topic_id || topicId;

        if (catId) {
          if (!categoriesInTopic.has(catId)) {
            categoriesInTopic.set(catId, { name: catName, questions: [], topic_id: catTopicId });
          }
          categoriesInTopic.get(catId)!.questions.push(q);
        }
      });

      const categoryProgressList: CategoryProgress[] = Array.from(categoriesInTopic.entries()).map(([catId, catData]) => {
        const catCompletedCount = catData.questions.filter(q =>
          questionCache.isQuestionCompleted(q.id)
        ).length;
        const catTotalCount = catData.questions.length;
        const catProgress = catTotalCount > 0 ? (catCompletedCount / catTotalCount) * 100 : 0;

        return {
          categoryId: catId,
          totalQuestions: catTotalCount,
          completedQuestions: catCompletedCount,
          progress: Math.round(catProgress * 100) / 100
        };
      });

      return {
        topicId,
        totalQuestions: totalCount,
        completedQuestions: completedCount,
        progress: Math.round(progress * 100) / 100,
        categories: categoryProgressList
      };
    }

    // No questions provided - return minimal progress based on cached completions
    const completedForTopic = questionCache.getCompletedQuestionsForTopic(topicId);
    return {
      topicId,
      totalQuestions: 0,
      completedQuestions: completedForTopic.length,
      progress: 0,
      categories: []
    };
  }, [topicId, questions, refreshTrigger]);

  const refreshProgress = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const getCompletedCount = useCallback((questionIds: number[]): number => {
    return questionIds.filter(id => questionCache.isQuestionCompleted(id)).length;
  }, []);

  const isQuestionCompleted = useCallback((questionId: number): boolean => {
    return questionCache.isQuestionCompleted(questionId);
  }, []);

  // Listen for storage changes to refresh progress when cache is updated from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('grok_')) {
        refreshProgress();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshProgress]);

  return {
    categoryProgress,
    topicProgress,
    refreshProgress,
    getCompletedCount,
    isQuestionCompleted
  };
}

export type { CategoryProgress, TopicProgress };