interface QuestionCompletionData {
  questionId: number;
  isCompleted: boolean;
  completedAt: string;
  topicId?: number | undefined;
  categoryId?: number | undefined;
}

class QuestionCacheService {
  private static readonly STORAGE_KEY = 'grok_question_progress';

  private userId: string | undefined;

  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  private getStorageKey(): string {
    // Always use user-specific key if userId is available
    return this.userId
      ? `${QuestionCacheService.STORAGE_KEY}_${this.userId}`
      : QuestionCacheService.STORAGE_KEY;
  }

  private getStorageData(): Map<number, QuestionCompletionData> {
    if (typeof window === 'undefined') return new Map();

    try {
      const stored = localStorage.getItem(this.getStorageKey());
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
      localStorage.setItem(this.getStorageKey(), JSON.stringify(dataObject));
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
  }

  markQuestionIncomplete(questionId: number): void {
    const data = this.getStorageData();

    if (data.has(questionId)) {
      data.delete(questionId);
      this.setStorageData(data);
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

  clearCache(): void {
    if (typeof window === 'undefined') return;

    // Clear current user's cache
    localStorage.removeItem(this.getStorageKey());

    // Also clear legacy base key if it exists
    localStorage.removeItem(QuestionCacheService.STORAGE_KEY);

    // Clean up any orphaned category/topic progress keys (legacy cleanup)
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('grok_category_progress') ||
      key.startsWith('grok_topic_progress')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  exportCache(): string {
    if (typeof window === 'undefined') return '{}';

    const questionData = this.getStorageData();

    return JSON.stringify({
      questions: Object.fromEntries(questionData),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  importCache(jsonData: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const data = JSON.parse(jsonData);

      if (data.questions) {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(data.questions));
      }

      return true;
    } catch (error) {
      console.error('Error importing cache data:', error);
      return false;
    }
  }
}

export const questionCache = new QuestionCacheService();
export type { QuestionCompletionData };