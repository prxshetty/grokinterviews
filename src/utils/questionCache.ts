interface QuestionCompletionData {
  questionId: number;
  isCompleted: boolean;
  completedAt: string;
  topicId?: number | undefined;
  categoryId?: number | undefined;
}

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

class QuestionCacheService {
  private static readonly STORAGE_KEY = 'grok_question_progress';
  private static readonly CATEGORY_PROGRESS_KEY = 'grok_category_progress';
  private static readonly TOPIC_PROGRESS_KEY = 'grok_topic_progress';
  
  private userId: string | undefined;
  
  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }
  
  private getStorageKey(baseKey: string): string {
    return this.userId ? `${baseKey}_${this.userId}` : baseKey;
  }

  private getStorageData(): Map<number, QuestionCompletionData> {
    if (typeof window === 'undefined') return new Map();
    
    try {
      const stored = localStorage.getItem(this.getStorageKey(QuestionCacheService.STORAGE_KEY));
      if (!stored) return new Map();
      
      const data = JSON.parse(stored);
      return new Map(Object.entries(data).map(([key, value]) => [
        parseInt(key, 10),
        value as QuestionCompletionData
      ]));
    } catch (error) {
      console.error('Error reading question cache:', error);
      return new Map();
    }
  }

  private setStorageData(data: Map<number, QuestionCompletionData>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const dataObject = Object.fromEntries(data);
      localStorage.setItem(this.getStorageKey(QuestionCacheService.STORAGE_KEY), JSON.stringify(dataObject));
    } catch (error) {
      console.error('Error saving question cache:', error);
    }
  }

  markQuestionCompleted(
    questionId: number,
    topicId?: number,
    categoryId?: number
  ): void {
    const data = this.getStorageData();
    data.set(questionId, {
      questionId,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      ...(topicId !== undefined && { topicId }),
      ...(categoryId !== undefined && { categoryId })
    });
    this.setStorageData(data);
    
    this.updateCategoryProgress(categoryId);
    this.updateTopicProgress(topicId);
  }

  markQuestionIncomplete(questionId: number): void {
    const data = this.getStorageData();
    const questionData = data.get(questionId);
    
    if (questionData) {
      data.delete(questionId);
      this.setStorageData(data);
      
      this.updateCategoryProgress(questionData.categoryId);
      this.updateTopicProgress(questionData.topicId);
    }
  }

  isQuestionCompleted(questionId: number): boolean {
    const data = this.getStorageData();
    return data.has(questionId) && data.get(questionId)?.isCompleted === true;
  }

  getQuestionCompletionData(questionId: number): QuestionCompletionData | null {
    const data = this.getStorageData();
    return data.get(questionId) || null;
  }

  getAllCompletedQuestions(): QuestionCompletionData[] {
    const data = this.getStorageData();
    return Array.from(data.values()).filter(item => item.isCompleted);
  }

  getCompletedQuestionsForCategory(categoryId: number): QuestionCompletionData[] {
    return this.getAllCompletedQuestions().filter(item => item.categoryId === categoryId);
  }

  getCompletedQuestionsForTopic(topicId: number): QuestionCompletionData[] {
    return this.getAllCompletedQuestions().filter(item => item.topicId === topicId);
  }

  private updateCategoryProgress(categoryId?: number): void {
    if (!categoryId || typeof window === 'undefined') return;

    try {
      const categoryProgressData = this.getCategoryProgressData();
      const completedQuestions = this.getCompletedQuestionsForCategory(categoryId);
      
      categoryProgressData.set(categoryId, {
        categoryId,
        totalQuestions: 0, // Will be updated by parent component
        completedQuestions: completedQuestions.length,
        progress: 0 // Will be calculated when totalQuestions is known
      });
      
      this.setCategoryProgressData(categoryProgressData);
    } catch (error) {
      console.error('Error updating category progress:', error);
    }
  }

  private updateTopicProgress(topicId?: number): void {
    if (!topicId || typeof window === 'undefined') return;

    try {
      const topicProgressData = this.getTopicProgressData();
      const completedQuestions = this.getCompletedQuestionsForTopic(topicId);
      
      topicProgressData.set(topicId, {
        topicId,
        totalQuestions: 0, // Will be updated by parent component
        completedQuestions: completedQuestions.length,
        progress: 0, // Will be calculated when totalQuestions is known
        categories: [] // Will be populated by parent component
      });
      
      this.setTopicProgressData(topicProgressData);
    } catch (error) {
      console.error('Error updating topic progress:', error);
    }
  }

  private getCategoryProgressData(): Map<number, CategoryProgress> {
    if (typeof window === 'undefined') return new Map();
    
    try {
      const stored = localStorage.getItem(this.getStorageKey(QuestionCacheService.CATEGORY_PROGRESS_KEY));
      if (!stored) return new Map();
      
      const data = JSON.parse(stored);
      return new Map(Object.entries(data).map(([key, value]) => [
        parseInt(key, 10),
        value as CategoryProgress
      ]));
    } catch (error) {
      console.error('Error reading category progress cache:', error);
      return new Map();
    }
  }

  private setCategoryProgressData(data: Map<number, CategoryProgress>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const dataObject = Object.fromEntries(data);
      localStorage.setItem(this.getStorageKey(QuestionCacheService.CATEGORY_PROGRESS_KEY), JSON.stringify(dataObject));
    } catch (error) {
      console.error('Error saving category progress cache:', error);
    }
  }

  private getTopicProgressData(): Map<number, TopicProgress> {
    if (typeof window === 'undefined') return new Map();
    
    try {
      const stored = localStorage.getItem(this.getStorageKey(QuestionCacheService.TOPIC_PROGRESS_KEY));
      if (!stored) return new Map();
      
      const data = JSON.parse(stored);
      return new Map(Object.entries(data).map(([key, value]) => [
        parseInt(key, 10),
        value as TopicProgress
      ]));
    } catch (error) {
      console.error('Error reading topic progress cache:', error);
      return new Map();
    }
  }

  private setTopicProgressData(data: Map<number, TopicProgress>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const dataObject = Object.fromEntries(data);
      localStorage.setItem(this.getStorageKey(QuestionCacheService.TOPIC_PROGRESS_KEY), JSON.stringify(dataObject));
    } catch (error) {
      console.error('Error saving topic progress cache:', error);
    }
  }

  setCategoryTotalQuestions(categoryId: number, totalQuestions: number): void {
    if (typeof window === 'undefined') return;
    
    const categoryProgressData = this.getCategoryProgressData();
    const existing = categoryProgressData.get(categoryId) || {
      categoryId,
      totalQuestions: 0,
      completedQuestions: 0,
      progress: 0
    };
    
    existing.totalQuestions = totalQuestions;
    existing.progress = totalQuestions > 0 ? (existing.completedQuestions / totalQuestions) * 100 : 0;
    
    categoryProgressData.set(categoryId, existing);
    this.setCategoryProgressData(categoryProgressData);
  }

  setTopicTotalQuestions(topicId: number, totalQuestions: number, categories: CategoryProgress[] = []): void {
    if (typeof window === 'undefined') return;
    
    const topicProgressData = this.getTopicProgressData();
    const existing = topicProgressData.get(topicId) || {
      topicId,
      totalQuestions: 0,
      completedQuestions: 0,
      progress: 0,
      categories: []
    };
    
    existing.totalQuestions = totalQuestions;
    existing.completedQuestions = this.getCompletedQuestionsForTopic(topicId).length;
    existing.progress = totalQuestions > 0 ? (existing.completedQuestions / totalQuestions) * 100 : 0;
    existing.categories = categories;
    
    topicProgressData.set(topicId, existing);
    this.setTopicProgressData(topicProgressData);
  }

  getCategoryProgress(categoryId: number): CategoryProgress | null {
    const data = this.getCategoryProgressData();
    return data.get(categoryId) || null;
  }

  getTopicProgress(topicId: number): TopicProgress | null {
    const data = this.getTopicProgressData();
    return data.get(topicId) || null;
  }

  clearCache(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(QuestionCacheService.STORAGE_KEY);
    localStorage.removeItem(QuestionCacheService.CATEGORY_PROGRESS_KEY);
    localStorage.removeItem(QuestionCacheService.TOPIC_PROGRESS_KEY);
  }

  exportCache(): string {
    if (typeof window === 'undefined') return '{}';
    
    const questionData = this.getStorageData();
    const categoryData = this.getCategoryProgressData();
    const topicData = this.getTopicProgressData();
    
    return JSON.stringify({
      questions: Object.fromEntries(questionData),
      categories: Object.fromEntries(categoryData),
      topics: Object.fromEntries(topicData),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  importCache(jsonData: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const data = JSON.parse(jsonData);
      
      if (data.questions) {
        localStorage.setItem(QuestionCacheService.STORAGE_KEY, JSON.stringify(data.questions));
      }
      
      if (data.categories) {
        localStorage.setItem(QuestionCacheService.CATEGORY_PROGRESS_KEY, JSON.stringify(data.categories));
      }
      
      if (data.topics) {
        localStorage.setItem(QuestionCacheService.TOPIC_PROGRESS_KEY, JSON.stringify(data.topics));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing cache data:', error);
      return false;
    }
  }
}

export const questionCache = new QuestionCacheService();
export type { QuestionCompletionData, CategoryProgress, TopicProgress };