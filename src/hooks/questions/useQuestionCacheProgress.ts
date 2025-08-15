import { useState, useEffect, useMemo, useCallback } from 'react';
import { questionCache, type CategoryProgress, type TopicProgress } from '@/utils/questionCache';

interface Question {
  id: number;
  category_id?: number;
  topic_id?: number;
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

  // Memoize progress calculations
  const categoryProgress = useMemo(() => {
    if (!categoryId) return null;

    const cachedProgress = questionCache.getCategoryProgress(categoryId);
    
    // If we have questions, calculate current progress
    if (questions.length > 0) {
      const categoryQuestions = questions.filter(q => 
        q.category_id === categoryId || (q as Question & { categories?: { id: number } }).categories?.id === categoryId
      );
      
      const completedCount = categoryQuestions.filter(q => 
        questionCache.isQuestionCompleted(q.id)
      ).length;
      
      const totalCount = categoryQuestions.length;
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      
      // Update cache with current totals
      questionCache.setCategoryTotalQuestions(categoryId, totalCount);
      
      return {
        categoryId,
        totalQuestions: totalCount,
        completedQuestions: completedCount,
        progress: Math.round(progress * 100) / 100 // Round to 2 decimal places
      };
    }
    
    return cachedProgress;
  }, [categoryId, questions, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const topicProgress = useMemo(() => {
    if (!topicId) return null;

    const cachedProgress = questionCache.getTopicProgress(topicId);
    
    // If we have questions, calculate current progress
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
      const categoriesInTopic = new Map<number, { name: string; questions: any[]; topic_id: number }>();
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
      
      // Update cache with current totals
      questionCache.setTopicTotalQuestions(topicId, totalCount, categoryProgressList);
      
      return {
        topicId,
        totalQuestions: totalCount,
        completedQuestions: completedCount,
        progress: Math.round(progress * 100) / 100,
        categories: categoryProgressList
      };
    }
    
    return cachedProgress;
  }, [topicId, questions, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshProgress = useCallback(() => {
    // Set user ID on questionCache
    questionCache.setUserId(userId);
    
    setRefreshTrigger(prev => prev + 1);
  }, [userId]);

  const getCompletedCount = (questionIds: number[]): number => {
    return questionIds.filter(id => questionCache.isQuestionCompleted(id)).length;
  };

  const isQuestionCompleted = (questionId: number): boolean => {
    return questionCache.isQuestionCompleted(questionId);
  };

  // Listen for storage changes to refresh progress when cache is updated from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('grok_')) {
        refreshProgress();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshProgress]); // Add refreshProgress dependency

  return {
    categoryProgress,
    topicProgress,
    refreshProgress,
    getCompletedCount,
    isQuestionCompleted
  };
}